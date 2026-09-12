import {CycleClock, lightAt, sceneFrame, smoothstep, wrap} from './cycle.mjs';

export function createScene({element, plane, canvas, onChange, reducedMotion = false}) {
  const clock = new CycleClock({paused: reducedMotion});
  const ctx = canvas.getContext('2d');
  let suspended = false;
  let timer = 0;
  let lastStamp = null;
  let ambientSeconds = 0;
  let transition = null;
  let lastName = '';
  let lastUIUpdate = 0;
  let dayReady = false;
  let stopped = false;

  function resize() {
    const r = sceneFrame(element.clientWidth, element.clientHeight);
    Object.assign(plane.style, {
      width: `${r.width}px`, height: `${r.height}px`, left: `${r.left}px`, top: `${r.top}px`
    });
    // A small transparent effects canvas; the image itself remains full resolution.
    canvas.width = Math.round(Math.min(1000, r.width));
    canvas.height = Math.round(canvas.width * 926 / 1698);
    paint();
  }

  function atmosphere(light) {
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Only the distant valley: broad, barely perceptible wisps of cool air.
    for (let i = 0; i < 3; i++) {
      const x = w * (0.16 + i * 0.10 + Math.sin(ambientSeconds * 0.018 + i) * 0.018);
      const y = h * (0.5 + i * 0.045);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.09);
      const fog = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.13);
      fog.addColorStop(0, `rgba(186,201,204,${0.022 + light.warmth * 0.017})`);
      fog.addColorStop(1, 'rgba(186,201,204,0)');
      ctx.fillStyle = fog;
      ctx.fillRect(-w * 0.14, -w * 0.14, w * 0.28, w * 0.28);
      ctx.restore();
    }
    // Gentle scattering near the existing window; never a theatrical spotlight.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(w * 0.583, h * 0.55, 0, w * 0.585, h * 0.575, w * 0.037);
    glow.addColorStop(0, `rgba(230,191,117,${light.warmth * 0.026})`);
    glow.addColorStop(1, 'rgba(230,191,117,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(w * 0.53, h * 0.49, w * 0.12, h * 0.2);
    ctx.restore();
  }

  function paint(forceUI = false) {
    const light = lightAt(clock.phase);
    element.style.setProperty('--day', dayReady ? light.day.toFixed(5) : '0');
    element.style.setProperty('--twilight', light.twilight.toFixed(5));
    element.style.setProperty('--warmth', light.warmth.toFixed(5));
    element.classList.toggle('still', clock.paused || reducedMotion);
    element.classList.toggle('suspended', suspended || document.hidden);
    const now = performance.now();
    if (forceUI || light.name !== lastName || now - lastUIUpdate > 500) {
      onChange({...light, paused: clock.paused, dayReady});
      lastName = light.name;
      lastUIUpdate = now;
    }
    atmosphere(light);
  }

  function canAnimate() {
    return !stopped && !document.hidden && !suspended && (transition || !clock.paused);
  }
  function schedule() {
    if (!timer && canAnimate()) timer = setTimeout(frame, 80);
  }
  function frame() {
    timer = 0;
    if (!canAnimate()) { lastStamp = null; return; }
    const now = performance.now();
    const delta = lastStamp === null ? 0 : Math.min(250, now - lastStamp);
    lastStamp = now;
    if (transition) {
      transition.elapsed += delta;
      const t = smoothstep(0, 1600, transition.elapsed);
      clock.phase = wrap(transition.from + transition.distance * t);
      if (t === 1) transition = null;
    } else {
      clock.advance(delta, !dayReady);
      if (!clock.paused) ambientSeconds += delta / 1000;
    }
    paint();
    schedule();
  }
  function wake(forceUI = true) {
    if (timer) clearTimeout(timer);
    timer = 0;
    lastStamp = null;
    paint(forceUI);
    schedule();
  }

  const day = document.getElementById('day-image');
  const night = document.getElementById('night-image');
  function dayLoaded() { dayReady = true; wake(); }
  function imageError(which) {
    const message = document.getElementById('scene-error');
    message.hidden = false;
    message.textContent = which === 'day' ? 'Daylight could not load. You can still explore the night scene and journal.' : 'The scene could not load. Your project journal is still available.';
    if (which === 'day') { dayReady = false; clock.paused = true; wake(); }
  }
  day.addEventListener('load', dayLoaded, {once: true});
  day.addEventListener('error', () => imageError('day'), {once: true});
  night.addEventListener('error', () => imageError('night'), {once: true});
  if (day.complete) { if (day.naturalWidth) dayLoaded(); else imageError('day'); }
  if (night.complete && !night.naturalWidth) imageError('night');
  const observer = new ResizeObserver(resize);
  observer.observe(element);
  document.addEventListener('visibilitychange', () => wake());
  resize();
  wake();

  return {
    get paused() { return clock.paused; },
    get phase() { return clock.phase; },
    choosePhase(value, {immediate = false} = {}) {
      if (!dayReady || !Number.isFinite(value)) return;
      const from = clock.phase;
      clock.choose(value);
      const to = clock.phase;
      if (!reducedMotion && !immediate) {
        let distance = to - from;
        if (distance > 0.5) distance -= 1;
        if (distance < -0.5) distance += 1;
        transition = {from, distance, elapsed: 0};
        clock.phase = from;
      } else transition = null;
      wake();
    },
    setPaused(value) { clock.paused = value; transition = null; wake(); },
    setSuspended(value) { suspended = value; wake(); },
    setReducedMotion(value) { reducedMotion = value; if (value) clock.paused = true; wake(); },
    destroy() { stopped = true; clearTimeout(timer); observer.disconnect(); }
  };
}

export function createSky(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let seed = 731;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const stars = Array.from({length: 220}, () => ({x: random(), y: random(), r: 0.4 + random() ** 5 * 1.5, a: 0.18 + random() * 0.64}));
  let active = false, motion = true, timer = 0, time = 0, last = null;
  let lookX = 0, lookY = 0, pointer = null, shot = null;
  const clamp = n => Math.max(-0.25, Math.min(0.25, n));
  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    for (const [i, star] of stars.entries()) {
      const x = ((star.x + lookX * 0.4 + 1) % 1) * w;
      const y = ((star.y + lookY * 0.4 + 1) % 1) * h;
      const alpha = star.a + (motion ? Math.sin(time * 0.3 + i) * 0.04 : 0);
      ctx.fillStyle = `rgba(222,230,218,${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, star.r * w / 650, 0, Math.PI * 2); ctx.fill();
    }
    if (shot) {
      const progress = motion ? shot.progress : 0.45;
      const x = (0.18 + progress * 0.55) * w, y = (0.23 + progress * 0.22) * h;
      const alpha = Math.sin(progress * Math.PI);
      const tail = ctx.createLinearGradient(x - w * 0.1, y - h * 0.04, x, y);
      tail.addColorStop(0, 'rgba(233,227,200,0)'); tail.addColorStop(1, `rgba(233,227,200,${alpha * 0.75})`);
      ctx.strokeStyle = tail; ctx.lineWidth = Math.max(1, w / 650);
      ctx.beginPath(); ctx.moveTo(x - w * 0.1, y - h * 0.04); ctx.lineTo(x, y); ctx.stroke();
    }
  }
  function frame() {
    timer = 0;
    if (!active || !motion || document.hidden) { last = null; return; }
    const now = performance.now();
    const dt = last === null ? 0 : Math.min(100, now - last) / 1000;
    last = now; time += dt;
    if (shot) { shot.progress += dt * 0.38; if (shot.progress >= 1) shot = null; }
    draw(); timer = setTimeout(frame, 50);
  }
  function wake() { clearTimeout(timer); timer = 0; last = null; if (active) { draw(); if (motion && !document.hidden) frame(); } }
  function resize() { const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr); draw(); }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  canvas.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0) return;
    pointer = {id: e.pointerId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointer || pointer.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY) > 8) pointer.moved = true;
    lookX = clamp(lookX + (e.clientX - pointer.x) / canvas.clientWidth);
    lookY = clamp(lookY + (e.clientY - pointer.y) / canvas.clientHeight);
    pointer.x = e.clientX; pointer.y = e.clientY; draw();
  });
  canvas.addEventListener('pointerup', e => {
    if (!pointer || pointer.id !== e.pointerId) return;
    if (!pointer.moved) shot = {progress: 0};
    pointer = null; draw();
  });
  canvas.addEventListener('pointercancel', () => { pointer = null; });
  canvas.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') lookX = clamp(lookX + 0.025);
    if (e.key === 'ArrowRight') lookX = clamp(lookX - 0.025);
    if (e.key === 'ArrowUp') lookY = clamp(lookY + 0.025);
    if (e.key === 'ArrowDown') lookY = clamp(lookY - 0.025);
    if (e.key === 'Enter' || e.key === ' ') shot = {progress: 0};
    draw();
  });
  document.addEventListener('visibilitychange', wake);
  return {setActive(value) { active = value; if (!active) pointer = null; resize(); wake(); }, setMotion(value) { motion = value; wake(); }};
}

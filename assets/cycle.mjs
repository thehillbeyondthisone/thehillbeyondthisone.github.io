export const CYCLE_MS = 20 * 60 * 1000;
export const INITIAL_PHASE = 0.79;
export const wrap = value => ((value % 1) + 1) % 1;
export const smoothstep = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function lightAt(phase) {
  const p = wrap(phase);
  const elevation = Math.sin((p - 0.25) * Math.PI * 2);
  const day = smoothstep(-0.36, 0.42, elevation);
  let name = 'Night';
  if (p >= 0.16 && p < 0.3) name = 'Dawn';
  else if (p >= 0.3 && p < 0.66) name = 'Day';
  else if (p >= 0.66 && p < 0.85) name = 'Dusk';
  return {phase: p, day, warmth: 1 - day, twilight: Math.exp(-(elevation ** 2) / 0.045) * 0.13, name};
}

export class CycleClock {
  constructor({phase = INITIAL_PHASE, paused = false, duration = CYCLE_MS} = {}) {
    this.phase = wrap(phase);
    this.paused = paused;
    this.duration = duration;
  }
  advance(milliseconds, suspended = false) {
    if (!this.paused && !suspended && Number.isFinite(milliseconds) && milliseconds > 0) {
      this.phase = wrap(this.phase + milliseconds / this.duration);
    }
    return lightAt(this.phase);
  }
  choose(phase) {
    if (Number.isFinite(phase)) this.phase = wrap(phase);
    this.paused = true;
    return lightAt(this.phase);
  }
}

// Art coordinates stay attached to the same objects across portrait crops.
export function sceneFrame(width, height) {
  const aspect = 1698 / 926;
  const portrait = width / height < 1.1;
  const h = portrait ? Math.min(height, width / 0.68) : Math.max(height, width / aspect);
  const w = h * aspect;
  return {width: w, height: h, left: width * 0.5 - w * (portrait ? 0.64 : 0.5), top: (height - h) * (portrait ? 0.43 : 0.5)};
}

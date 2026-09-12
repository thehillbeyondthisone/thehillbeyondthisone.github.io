import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CycleClock, CYCLE_MS, lightAt, sceneFrame} from '../assets/cycle.mjs';
import {journalProjects, safeHTTPS} from '../assets/catalog-view.mjs';

test('a full cycle returns to its starting light without an endpoint jump', () => {
  const clock = new CycleClock({phase: 0.79});
  const initial = lightAt(clock.phase);
  const final = clock.advance(CYCLE_MS);
  assert.ok(Math.abs(final.phase - initial.phase) < 1e-12);
  assert.ok(Math.abs(final.day - initial.day) < 1e-12);
  assert.ok(Math.abs(lightAt(0.999999).day - lightAt(0).day) < 1e-6);
});

test('time holds on pause, suspension, and invalid elapsed values', () => {
  const clock = new CycleClock({phase: 0.32});
  clock.advance(45000, true);
  assert.ok(Math.abs(clock.phase - 0.32) < 1e-12);
  clock.paused = true;
  clock.advance(45000);
  assert.ok(Math.abs(clock.phase - 0.32) < 1e-12);
  clock.paused = false;
  clock.advance(NaN); clock.advance(-200); clock.advance(Infinity);
  assert.ok(Math.abs(clock.phase - 0.32) < 1e-12);
  clock.advance(CYCLE_MS / 10);
  assert.ok(Math.abs(clock.phase - 0.42) < 1e-12);
});

test('choosing daylight holds it; night and midday have distinct lighting', () => {
  const clock = new CycleClock();
  const chosen = clock.choose(0.5);
  assert.equal(clock.paused, true);
  assert.equal(chosen.day, 1);
  assert.equal(chosen.warmth, 0);
  assert.equal(lightAt(0).day, 0);
  assert.equal(lightAt(0).warmth, 1);
  for (let n = 0; n <= 1000; n++) {
    const light = lightAt(n / 1000);
    assert.ok(light.day >= 0 && light.day <= 1);
    assert.ok(light.twilight >= 0 && light.twilight <= 0.13);
  }
});

test('portrait framing retains the telescope, bench, and radio tap targets', () => {
  for (const [w, h] of [[320,568], [375,667], [390,844], [430,932], [768,1024]]) {
    const frame = sceneFrame(w, h);
    for (const [x, y] of [[0.491,0.172], [0.534,0.792], [0.78,0.8]]) {
      const px = frame.left + frame.width * x;
      const py = frame.top + frame.height * y;
      assert.ok(px >= 26 && px <= w - 26, `${w}x${h}: target clipped horizontally`);
      assert.ok(py >= 26 && py <= h - 26, `${w}x${h}: target clipped vertically`);
    }
  }
});

test('journal keeps curated order, supports multi-word search, and escapes no scope', () => {
  const data = {featured: ['beta', 'alpha'], projects: [
    {name:'alpha',title:'Alpha',summary:'A game',category:'Games'},
    {name:'beta',title:'Beta studio',summary:'Local creative tools',language:'TypeScript'},
    {name:'gamma',title:'Gamma',summary:'A second game',category:'Games'}
  ]};
  assert.deepEqual(journalProjects(data).map(p=>p.name), ['beta','alpha']);
  assert.deepEqual(journalProjects(data,'all','GAME').map(p=>p.name), ['alpha','gamma']);
  assert.deepEqual(journalProjects(data,'featured','local typescript').map(p=>p.name), ['beta']);
  assert.deepEqual(journalProjects(data,'featured','gamma'), []);
  assert.equal(safeHTTPS('javascript:alert(1)'), null);
  assert.equal(safeHTTPS('https://user:password@example.com'), null);
  assert.equal(safeHTTPS('https://example.com/demo'), 'https://example.com/demo');
});

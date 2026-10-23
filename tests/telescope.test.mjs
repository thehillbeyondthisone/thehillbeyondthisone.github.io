import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wrapIndex,
  normalizeDiscoveries,
  nextUnseenIndex,
  nearestProject,
} from '../assets/exploration.mjs';

const projects = [
  { name: 'GolfProbably', category: 'Play' },
  { name: 'Kinwild', category: 'Tools' },
  { name: 'Seven Hunters', category: 'Play' },
  { name: 'theGame', category: 'Play' },
  { name: 'Hydra', category: 'Tools' },
];
const names = projects.map(project => project.name);

test('navigation wraps in both directions, including more than one full turn', () => {
  assert.equal(wrapIndex(5, 5), 0);
  assert.equal(wrapIndex(-1, 5), 4);
  assert.equal(wrapIndex(17, 5), 2);
  assert.equal(wrapIndex(-17, 5), 3);
  assert.equal(wrapIndex(0, 1), 0);
});

test('empty catalogs and invalid positions have a stable index', () => {
  for (const length of [0, -1, NaN, Infinity, undefined]) {
    assert.equal(wrapIndex(7, length), 0);
  }
  assert.equal(wrapIndex(NaN, 5), 0);
  assert.equal(wrapIndex(Infinity, 5), 0);
  for (const helper of [nextUnseenIndex, nearestProject]) {
    assert.equal(helper([], 3, new Set()), 0);
    assert.equal(helper(null, 3, null), 0);
    assert.equal(helper([projects[0]], 0, new Set(names)), 0);
  }
});

test('stored discoveries retain unique known names and drop removed projects', () => {
  const restored = normalizeDiscoveries(
    ['GolfProbably', 'RubiKit', 'GolfProbably', 3, null, 'theGame', { name: 'Hydra' }],
    names,
  );
  assert.deepEqual([...restored], ['GolfProbably', 'theGame']);
  assert.deepEqual(
    [...normalizeDiscoveries('["Seven Hunters", "RubiKit", "theGame"]', new Set(names))],
    ['Seven Hunters', 'theGame'],
  );
});

test('malformed storage cannot break discovery restoration', () => {
  for (const saved of [null, undefined, 7, {}, '{broken', 'null', '{}', '"Hydra"']) {
    assert.deepEqual([...normalizeDiscoveries(saved, names)], []);
  }
  assert.deepEqual([...normalizeDiscoveries(['Hydra'], null)], []);
});

test('next discovery skips seen work and wraps to an unseen project', () => {
  assert.equal(nextUnseenIndex(projects, 0, new Set(['GolfProbably', 'Kinwild'])), 2);
  assert.equal(nextUnseenIndex(projects, 4, ['Hydra', 'GolfProbably']), 1);
  assert.equal(nextUnseenIndex(projects, -1, new Set(['Hydra'])), 0);
  assert.equal(nextUnseenIndex(projects, 0, null), 1);
});

test('completion keeps navigation moving through the catalog', () => {
  const complete = new Set(names);
  assert.equal(nextUnseenIndex(projects, 0, complete), 1);
  assert.equal(nextUnseenIndex(projects, 4, complete), 0);
  assert.equal(nearestProject(projects, 0, complete), 1);
  assert.equal(nearestProject(projects, 4, complete), 0);
});

test('related recommendation prefers unseen work in the same category', () => {
  assert.equal(nearestProject(projects, 0, new Set(['GolfProbably'])), 2);
  assert.equal(nearestProject(projects, 0, new Set(['GolfProbably', 'Seven Hunters'])), 3);
  assert.equal(nearestProject(projects, 3, new Set(['theGame'])), 0);
  assert.equal(nearestProject(projects, 1, new Set(['Kinwild'])), 4);
});

test('related recommendation falls back to next unseen work without selecting itself', () => {
  assert.equal(nearestProject(projects, 0, new Set(['GolfProbably', 'Seven Hunters', 'theGame'])), 1);
  assert.equal(nearestProject(projects, 0, new Set(names.slice(1))), 1);
  assert.equal(nearestProject(projects, 2, new Set()), 3);
  assert.equal(nearestProject([{ name: 'A' }, { name: 'B' }, { name: 'C' }], 0, []), 1);
});

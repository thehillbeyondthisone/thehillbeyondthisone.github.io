import {readFile, access} from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
for (const path of ['assets/app.js', 'assets/world.js']) {
  const source = await readFile(new URL(path, root), 'utf8');
  const references = [...source.matchAll(/(?:\$\(|getElementById\()'([^']+)'\)/g)].map(match => match[1]);
  for (const id of references) assert.ok(ids.includes(id), `Missing ${id} used by ${path}`);
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const target = match[1];
  if (!target || target.startsWith('#') || target.includes(':') || target === './') continue;
  await access(new URL(target, root));
}
assert.ok(html.includes('<!-- FALLBACK_PROJECTS -->') && html.includes('<!-- END_FALLBACK_PROJECTS -->'));
assert.ok(html.includes('<dialog class="journal"') && html.includes('<dialog class="viewer"'));
assert.ok(!html.includes('three.min.js'), 'The illustrated scene must not load the discarded 3D scene');
for (const name of ['night', 'day']) {
  const bytes = await readFile(new URL(`assets/scene/${name}.webp`, root));
  assert.equal(bytes.subarray(0,4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8,12).toString(), 'WEBP');
  assert.ok(bytes.length < 450000, `${name} artwork exceeds the initial image budget`);
}
console.log(`Static checks passed: ${ids.length} unique IDs, control references, local assets, dialogs, and WebP budget.`);

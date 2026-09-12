import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, cp, writeFile, readFile, rm, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

test('export isolates cached CSS, module dependencies, images, and catalog by release', async () => {
  const root = await mkdtemp(join(tmpdir(), 'observatory-export-'));
  try {
    for (const dir of ['scripts', 'assets/scene', 'data']) await mkdir(join(root, dir), {recursive: true});
    await cp(new URL('../scripts/export-site.mjs', import.meta.url), join(root, 'scripts/export-site.mjs'));
    await writeFile(join(root, 'index.html'), '<link href="assets/site.css"><img src="assets/scene/night.webp"><script src="data/catalog.js"></script><script src="assets/app.js"></script><a href="#journal">Journal</a>');
    await writeFile(join(root, 'og.png'), 'image');
    await writeFile(join(root, 'assets/site.css'), '.scene{background:url(scene/night.webp)}');
    await writeFile(join(root, 'assets/app.js'), "import './world.js';");
    await writeFile(join(root, 'assets/world.js'), 'export const world = 1;');
    await writeFile(join(root, 'assets/scene/night.webp'), 'night');
    const catalog = 'window.OBSERVATORY_DATA={projects:[{name:"one"}],featured:["one"]};';
    await writeFile(join(root, 'data/catalog.js'), catalog);
    async function build() {
      execFileSync(process.execPath, ['scripts/export-site.mjs'], {cwd: root});
      const html = await readFile(join(root, '_site/index.html'), 'utf8');
      assert.ok(html.includes('href="#journal"'));
      assert.ok(!/\b(?:src|href)="(?:assets|data)\//.test(html), 'Unversioned asset reference');
      const release = html.match(/releases\/[a-f0-9]+\//)[0];
      for (const match of html.matchAll(/(?:src|href)="(releases\/[^"]+)"/g)) await access(join(root, '_site', match[1]));
      assert.equal(await readFile(join(root, '_site', release, 'assets/app.js'), 'utf8'), "import './world.js';");
      await access(join(root, '_site', release, 'assets/world.js'));
      await access(join(root, '_site', release, 'assets/scene/night.webp'));
      return release;
    }
    let release = await build();
    assert.equal(await build(), release, 'Unchanged content keeps stable URLs');
    for (const [path, content] of [
      ['assets/site.css', '.scene{display:block}'],
      ['assets/world.js', 'export const world = 2;'],
      ['assets/scene/night.webp', 'new night'],
      ['data/catalog.js', catalog + '\n// refreshed'],
    ]) {
      await writeFile(join(root, path), content);
      const next = await build();
      assert.notEqual(next, release, `${path} must invalidate all release URLs`);
      release = next;
    }
  } finally { await rm(root, {recursive: true, force: true}); }
});

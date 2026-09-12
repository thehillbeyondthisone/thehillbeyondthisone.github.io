import {cp, mkdir, rm, writeFile, readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const output = new URL('_site/', root);
const context = {window: {}};
vm.runInNewContext(await readFile(new URL('data/catalog.js', root), 'utf8'), context, {timeout: 1000});
const catalog = context.window.OBSERVATORY_DATA;
if (!catalog?.projects?.length || !catalog.featured.every(name => catalog.projects.some(p => p.name === name))) {
  throw new Error('The static catalog is incomplete.');
}
await rm(output, {recursive: true, force: true});
await mkdir(new URL('data/', output), {recursive: true});
for (const path of ['index.html', 'assets', 'og.png', 'data/catalog.js']) {
  await cp(new URL(path, root), new URL(path, output), {recursive: true});
}
await writeFile(new URL('.nojekyll', output), '');

// A release owns its entire dependency graph, including relative module imports
// and CSS images. Reusing /assets/site.css mixed the old layout with new HTML
// in returning visitors' caches. Content-derived paths also cover daily catalogs.
const hash = createHash('sha256');
async function hashFiles(path) {
  const entries = await readdir(new URL(path, root), {withFileTypes: true});
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const name = `${path}${entry.name}`;
    if (entry.isDirectory()) await hashFiles(`${name}/`);
    else { hash.update(name); hash.update('\0'); hash.update(await readFile(new URL(name, root))); }
  }
}
await hashFiles('assets/');
hash.update(await readFile(new URL('data/catalog.js', root)));
const html = await readFile(new URL('index.html', root), 'utf8');
hash.update(html);
const release = `releases/${hash.digest('hex').slice(0, 20)}/`;
await mkdir(new URL(`${release}data/`, output), {recursive: true});
await cp(new URL('assets/', root), new URL(`${release}assets/`, output), {recursive: true});
await cp(new URL('data/catalog.js', root), new URL(`${release}data/catalog.js`, output));
await writeFile(new URL('index.html', output), html.replace(
  /\b(src|href)="((?:assets|data)\/[^\"]+)"/g,
  (_, attribute, path) => `${attribute}="${release}${path}"`
));
console.log(`Exported _site with ${catalog.projects.length} projects (${release}).`);

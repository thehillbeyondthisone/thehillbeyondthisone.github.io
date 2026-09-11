import {cp, mkdir, rm, writeFile, readFile} from 'node:fs/promises';
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
console.log(`Exported _site with ${catalog.projects.length} projects.`);

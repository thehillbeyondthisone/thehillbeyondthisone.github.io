import {readFile,writeFile,rename} from 'node:fs/promises';
import {makeCatalog,serialize,escapeHTML} from './catalog-lib.mjs';
const config=JSON.parse(await readFile(new URL('../data/curation.json',import.meta.url),'utf8'));
let repos=[];
for(let page=1;page<=100;page++){
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
  const response=await fetch(`https://api.github.com/users/${config.owner}/repos?per_page=100&type=owner&page=${page}`,{headers,signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`GitHub returned ${response.status}; the previous catalog is unchanged.`);
  const batch=await response.json();if(!Array.isArray(batch))throw new Error('Unexpected API response.');repos.push(...batch);if(batch.length<100)break;
  if(page===100)throw new Error('Pagination limit reached; refusing partial data.');
}
const catalog=makeCatalog(repos,config);
const out=new URL('../data/catalog.js',import.meta.url);await writeFile(new URL('../data/catalog.js.tmp',import.meta.url),serialize(catalog));await rename(new URL('../data/catalog.js.tmp',import.meta.url),out);
const path=new URL('../index.html',import.meta.url);let html=await readFile(path,'utf8');
const fallback=catalog.projects.map(p=>`<a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.title)}<small>${escapeHTML(p.summary)}</small></a>`).join('\n');
html=html.replace(/<!-- FALLBACK_PROJECTS -->[\s\S]*?<!-- END_FALLBACK_PROJECTS -->|<!-- FALLBACK_PROJECTS -->/,'<!-- FALLBACK_PROJECTS -->\n'+fallback+'\n<!-- END_FALLBACK_PROJECTS -->');await writeFile(path,html);
console.log(`Catalog refreshed: ${catalog.projects.length} public projects, ${catalog.featured.length} favorites.`);

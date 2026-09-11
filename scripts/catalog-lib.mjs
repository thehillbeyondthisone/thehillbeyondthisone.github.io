export function safeURL(value){if(typeof value!=='string')return null;try{const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password ? u.href : null;}catch{return null;}}
export function makeCatalog(repos,curation,generatedAt=new Date().toISOString()){
  if(!Array.isArray(repos)||!repos.length)throw new Error('Refusing to replace the catalog with an empty API response.');
  if(!/^[A-Za-z0-9-]+$/.test(curation.owner))throw new Error('Invalid owner.');
  const projects=repos.filter(r=>r.private===false && r.owner?.login?.toLowerCase()===curation.owner.toLowerCase() && !curation.exclude.includes(r.name)).map(r=>{
    if(!/^[A-Za-z0-9_.-]+$/.test(r.name))throw new Error('Invalid repository name.');
    const override=curation.projects[r.name] || {};
    const expected=`https://github.com/${curation.owner}/${r.name}`;
    if(r.html_url!==expected)throw new Error('Unexpected repository URL.');
    return {id:r.id,name:r.name,title:override.title || r.name,category:override.category || (r.fork?'Forks':'Projects'),summary:override.summary || r.description || 'Explore the source and project documentation.',description:override.description || override.summary || r.description || '',requirement:override.requirement || null,url:expected,language:r.language || null,fork:!!r.fork,archived:!!r.archived,updated:r.pushed_at || r.updated_at || null,demo:safeURL(override.demo),embed:override.embed===true && !!safeURL(override.demo),image:safeURL(override.image),imageAlt:override.imageAlt || null};
  }).sort((a,b)=>a.title.localeCompare(b.title));
  const names=new Set(projects.map(p=>p.name));if(curation.featured.some(name=>!names.has(name)))throw new Error('A featured repository is missing; review visibility or curation before publishing.');
  if(!projects.length)throw new Error('No eligible public repositories.');
  const audio=curation.audio;
  if(audio && (audio.split('/').includes('..') || !(safeURL(audio) || /^assets\/audio\/[A-Za-z0-9_./-]+\.(mp3|ogg|wav|m4a)$/.test(audio))))throw new Error('Audio must be an HTTPS URL or an assets/audio file.');
  return {generatedAt,featured:curation.featured,audio:audio || null,projects};
}
export function serialize(catalog){return 'window.OBSERVATORY_DATA = '+JSON.stringify(catalog,null,2).replace(/</g,'\\u003c')+';\n';}
export function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

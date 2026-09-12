import { createWorld } from './world.js';
const $ = id => document.getElementById(id);
const data = window.OBSERVATORY_DATA;
const mediaPreference = matchMedia('(prefers-reduced-motion: reduce)');
let world = null, selection = null, mode = 'featured', stopped = mediaPreference.matches, inDemo = false;
let toastTimer, viewerTimer, restoreScroll = 0, lastFocus = null;
const notify = text => {clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);};
const textElement = (tag,text,className) => {const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
const safeHTTPS = value => {try{const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password ? u.href : null;}catch{return null;}};
function link(label,url,className){const a=textElement('a',label,className);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function updateMotion(){
  $('motion').textContent=stopped?'Resume motion':'Pause motion';$('motion').setAttribute('aria-pressed',String(stopped));
  world?.setPaused(stopped || inDemo || document.hidden);
}
$('motion').addEventListener('click',()=>{stopped=!stopped;updateMotion();});
mediaPreference.addEventListener('change',e=>{stopped=e.matches;updateMotion();});
document.addEventListener('visibilitychange',updateMotion);
function renderProjects(){
  const projects = mode==='featured' ? data.featured.map(name=>data.projects.find(p=>p.name===name)).filter(Boolean) : data.projects;
  $('show-featured').setAttribute('aria-pressed',String(mode==='featured'));$('show-all').setAttribute('aria-pressed',String(mode==='all'));
  $('catalog-count').textContent=`${projects.length} projects`;
  const fragment=document.createDocumentFragment();
  projects.forEach((project,i)=>{
    const button=textElement('button','', 'project-card');button.type='button';
    const top=textElement('div','','project-top');top.append(textElement('span',project.category || (project.fork?'Forks':'Projects'),'project-category'),textElement('span',String(i+1).padStart(2,'0'),'number'));
    button.append(top,textElement('h3',project.title || project.name),textElement('p',project.summary || 'Explore the source and project documentation.'));
    const meta=textElement('div','','project-meta');if(project.language)meta.append(textElement('span',project.language));
    if(project.demo)meta.append(textElement('span','Live project ↗','demo-mark'));if(project.fork)meta.append(textElement('span','Fork'));if(project.archived)meta.append(textElement('span','Archived'));
    const arrow=textElement('span','↗','arrow');arrow.setAttribute('aria-hidden','true');meta.append(arrow);button.append(meta);
    button.addEventListener('click',()=>showProject(project,button));fragment.append(button);
  });
  $('project-list').replaceChildren(fragment);
}
function showProject(project,opener){
  selection=project;lastFocus=opener || document.activeElement;
  $('detail-title').textContent=project.title || project.name;
  $('detail-category').textContent=project.category || 'Project';
  $('detail-description').textContent=project.description || project.summary || 'Project source and documentation are available on GitHub.';
  const meta=$('detail-meta');meta.replaceChildren();
  [project.language, project.fork?'Fork':null, project.archived?'Archived':null].filter(Boolean).forEach(t=>meta.append(textElement('span',t,'chip')));
  if(project.updated){const date=new Date(project.updated);if(!isNaN(date))meta.append(textElement('span',`Updated ${date.toLocaleDateString(undefined,{month:'short',year:'numeric',timeZone:'UTC'})}`,'chip'));}
  $('detail-requirement').hidden=!project.requirement;$('detail-requirement').textContent=project.requirement || '';
  const media=$('detail-media');media.replaceChildren();
  if(safeHTTPS(project.image)){
    if(mediaPreference.matches && /\.gif(?:\?|$)/i.test(project.image))media.append(link('View existing animation ↗',project.image,'secondary'));
    else {const img=document.createElement('img');img.className='project-image';img.alt=project.imageAlt || `${project.title || project.name} screenshot`;img.loading='lazy';img.src=project.image;img.addEventListener('error',()=>img.remove(),{once:true});media.append(img);}
  }
  const actions=$('detail-actions');actions.replaceChildren();
  if(project.demo && safeHTTPS(project.demo)){
    if(project.embed){const open=textElement('button','Explore here','primary');open.type='button';open.addEventListener('click',()=>openDemo(project));actions.append(open);}
    actions.append(link('Open project in new tab ↗',project.demo,project.embed?'secondary':'primary'));
  }
  if(safeHTTPS(project.url))actions.append(link('View source & README ↗',project.url,'secondary'));
  if(!$('project-dialog').open){$('project-dialog').showModal();document.body.style.overflow='hidden';}
}
function closeDetail(){if($('project-dialog').open)$('project-dialog').close();}
$('close-detail').addEventListener('click',closeDetail);
$('project-dialog').addEventListener('close',()=>{if(!inDemo)document.body.style.overflow='';if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});});
$('project-dialog').addEventListener('click',e=>{if(e.target!==$('project-dialog'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();});
function openDemo(project){
  if(!project.embed || !safeHTTPS(project.demo))return;
  restoreScroll=window.scrollY;inDemo=true;closeDetail();document.body.style.overflow='hidden';
  $('viewer-title').textContent=project.title || project.name;$('external-demo').href=project.demo;
  $('demo-frame').title=`${project.title || project.name} — live project`;$('demo-frame').src=project.demo;
  $('viewer-help').hidden=true;$('viewer').hidden=false;
  document.querySelector('.topbar').inert=true;document.querySelector('main').inert=true;
  $('viewer').setAttribute('role','dialog');$('viewer').setAttribute('aria-modal','true');
  $('back-world').focus();updateMotion();clearTimeout(viewerTimer);viewerTimer=setTimeout(()=>$('viewer-help').hidden=false,9000);
}
function leaveDemo(){
  if(!inDemo)return;inDemo=false;clearTimeout(viewerTimer);$('viewer').hidden=true;$('demo-frame').removeAttribute('src');
  document.querySelector('.topbar').inert=false;document.querySelector('main').inert=false;document.body.style.overflow='';updateMotion();
  window.scrollTo({top:restoreScroll,behavior:'instant'});if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
}
$('back-world').addEventListener('click',leaveDemo);
$('switch-project').addEventListener('click',()=>{leaveDemo();$('projects').scrollIntoView({behavior:mediaPreference.matches?'instant':'smooth'});$('projects').focus({preventScroll:true});});
document.addEventListener('keydown',e=>{if(e.key==='Escape' && inDemo){e.preventDefault();leaveDemo();}});
let audio=null, audioPending=false;
function radioState(on){$('radio').setAttribute('aria-pressed',String(on));$('radio').textContent=on?'♫ ♪ Radio on':'♫ Radio off';world?.setRadio(on);}
async function toggleRadio(){
  if(!data?.audio){notify('The radio is waiting for its first record.');return;}
  if(audioPending)return;
  if(!audio){audio=new Audio(data.audio);audio.loop=true;audio.volume=.35;audio.addEventListener('pause',()=>radioState(false));audio.addEventListener('error',()=>{radioState(false);notify('The radio could not load its record.');});}
  if(!audio.paused){audio.pause();return;}
  audioPending=true;try{await audio.play();radioState(true);}catch{radioState(false);notify('The radio could not start. Tap to try again.');}finally{audioPending=false;}
}
$('radio').addEventListener('click',toggleRadio);
$('telescope').addEventListener('click',()=>world?.toggleSky());
$('lamp').addEventListener('click',()=>world?.toggleLights());
function startWorld(){
  if(!window.THREE){$('world-status').textContent='The collection is open, even when the observatory is resting.';return;}
  try{
    world=createWorld(window.THREE,$('world-canvas'),{
      onRadio:toggleRadio,
      onSky:on=>{$('telescope').setAttribute('aria-pressed',String(on));$('telescope').textContent=on?'✧ Back to terrace':'✧ Telescope';document.body.classList.toggle('sky-open',on);},
      onLights:on=>{$('lamp').setAttribute('aria-pressed',String(on));$('lamp').textContent=on?'☼ Warm lights':'☼ Lights off';},
      onProject:()=>{$('projects').scrollIntoView({behavior:mediaPreference.matches?'instant':'smooth'});$('projects').focus({preventScroll:true});},
      onError:()=>{document.querySelector('.world').classList.remove('ready');$('telescope').disabled=true;$('lamp').disabled=true;$('world-status').textContent='The collection is open, even when the observatory is resting.';}
    });
    document.querySelector('.world').classList.add('ready');$('telescope').disabled=false;$('lamp').disabled=false;updateMotion();
  }catch{document.querySelector('.world').classList.remove('ready');$('world-status').textContent='The collection is open, even when the observatory is resting.';}
}
if(data && Array.isArray(data.projects) && data.projects.length){
  renderProjects();$('filters').hidden=false;$('fallback-list').hidden=true;
  $('show-featured').addEventListener('click',()=>{mode='featured';renderProjects();});$('show-all').addEventListener('click',()=>{mode='all';renderProjects();});
  const date=new Date(data.generatedAt);if(!isNaN(date))$('updated').textContent=`Collection refreshed ${date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})}.`;
}
updateMotion();
if(document.readyState==='complete')startWorld();else window.addEventListener('load',startWorld,{once:true});

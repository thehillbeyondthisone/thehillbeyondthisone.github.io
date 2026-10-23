import {safeHTTPS} from './catalog-view.mjs';
import {wrapIndex, normalizeDiscoveries, nextUnseenIndex, nearestProject} from './exploration.mjs';
export {wrapIndex} from './exploration.mjs';

// Imagined figures, not astronomical claims. The work stays readable at every scale.
const figures = {
  'seven-hunters': {name:'The keeper',color:'238 207 147',position:[23,29],points:[[28,76],[38,38],[44,22],[56,22],[62,38],[72,76],[28,76],[36,59],[64,59],[38,38],[62,38],[50,12],[17,26],[44,22],[56,22],[83,26]],edges:[[0,1,2,3,4,5,6],[7,8],[9,10],[2,11,3],[12,13],[14,15]]},
  theGame: {name:'The orbit',color:'206 175 244',position:[70,25],points:[[23,25],[77,25],[66,48],[56,60],[50,79],[44,60],[34,48],[23,25],[38,37],[50,32],[62,37],[50,46],[38,37]],edges:[[0,1,2,3,4,5,6,7],[8,9,10,11,12]]},
  GolfProbably: {name:'The wanderer',color:'196 224 154',position:[45,61],points:[[20,69],[34,58],[47,67],[60,50],[69,31],[69,15],[86,23],[69,31]],edges:[[0,1,2,3,4,5,6,7]]},
  Kinwild: {name:'The living form',color:'151 222 201',position:[18,77],points:[[15,51],[30,35],[45,44],[58,24],[72,34],[85,18],[80,51],[69,67],[47,74],[31,60],[18,74],[30,35],[36,20]],edges:[[0,1,2,3,4,5],[4,6,7,8,9,0],[9,10],[1,12]]},
  Hydra: {name:'The observer',color:'148 205 249',position:[80,72],points:[[18,74],[32,60],[47,65],[59,50],[58,34],[46,21],[34,26],[69,31],[79,16],[87,23],[77,47],[90,43]],edges:[[0,1,2,3,4,5,6],[4,7,8,9],[3,10,11]]}
};
const genericFigure={name:'The explorer',color:'190 210 229',points:[[24,60],[39,28],[58,48],[77,25],[71,72],[24,60]],edges:[[0,1,2,3,4,5]]};
const ns='http://www.w3.org/2000/svg';
const storageKey='observatory.field-notes.v1';
const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
const svgNode=(tag,attrs)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));return el;};

function constellation(figure, miniature=false) {
  const svg=svgNode('svg',{viewBox:'0 0 100 100',class:miniature?'mini-constellation':'hero-constellation','aria-hidden':'true',focusable:'false'});
  figure.edges.forEach((edge,i)=>{
    const d=edge.map((p,n)=>(n?'L':'M')+figure.points[p].join(' ')).join(' ');
    const path=svgNode('path',{d,class:'constellation-thread',pathLength:1});
    path.style.animationDelay=(i*.06)+'s';svg.append(path);
  });
  figure.points.forEach(([x,y],i)=>{
    if(figure.points.findIndex(p=>p[0]===x&&p[1]===y)!==i)return;
    const star=svgNode('g',{class:'celestial-star',transform:`translate(${x} ${y})`});
    star.append(svgNode('circle',{r:3.4,class:'star-aura'}),svgNode('circle',{r:i===3?.9:.6,class:'star-core'}));
    if(i%4===0)star.append(svgNode('path',{d:'M-3 0H3M0-3V3',class:'star-spike'}));
    svg.append(star);
  });
  return svg;
}

export function mountTelescope(data,onJournal) {
  const projects=data.featured.map(name=>data.projects.find(p=>p.name===name)).filter(Boolean);
  if(!projects.length)return;
  const $=id=>document.getElementById(id);
  const dialog=$('sky-dialog'),display=$('constellations'),detail=$('star-detail');
  let saved;
  try{saved=localStorage.getItem(storageKey);}catch{/* Field notes are optional. */}
  let seen=normalizeDiscoveries(saved,projects.map(p=>p.name));
  let index=-1,view='map';

  function remember(project){
    seen.add(project.name);
    try{localStorage.setItem(storageKey,JSON.stringify([...seen]));}catch{/* Browsing works without storage. */}
  }
  function link(label,url,cls){const a=node('a',label,cls);a.href=safeHTTPS(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
  function select(next,{focus=false}={}){
    const mobile=matchMedia('(max-width:760px)').matches;
    const restoreDetailFocus=detail.contains(document.activeElement);
    index=wrapIndex(next,projects.length);remember(projects[index]);render();
    if(focus&&!mobile)display.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
    else if(restoreDetailFocus||mobile){
      const heading=detail.querySelector('.scope-project-title');
      if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
    }
    if(mobile)detail.scrollIntoView({block:'start',behavior:'instant'});
  }
  function drawMap(){
    const map=node('div','','scope-map');
    const trail=svgNode('svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none',class:'scope-trail','aria-hidden':'true'});
    const positions=projects.map((p,i)=>figures[p.name]?.position || [20+(i%3)*28,25+Math.floor(i/3)*42]);
    // The trail follows the visitor's own order of discovery.
    const observations=[...seen].map(name=>positions[projects.findIndex(p=>p.name===name)]);
    observations.slice(1).forEach((point,i)=>{
      trail.append(svgNode('path',{d:`M${observations[i].join(' ')} L${point.join(' ')}`}));
    });
    map.append(trail);
    projects.forEach((project,i)=>{
      const figure=figures[project.name] || genericFigure;
      const button=node('button','','sky-object');button.type='button';button.dataset.project=project.name;
      button.style.setProperty('--object-color',figure.color);
      button.style.setProperty('--x',positions[i][0]+'%');button.style.setProperty('--y',positions[i][1]+'%');
      button.setAttribute('aria-pressed',String(i===index));
      button.setAttribute('aria-label',`${project.title}, ${seen.has(project.name)?'observed':'unexplored'} constellation`);
      button.classList.toggle('observed',seen.has(project.name));
      button.append(constellation(figure,true),node('span',project.title,'sky-object-title'),node('span',seen.has(project.name)?'✦ Observed':figure.name,'sky-object-note'));
      button.addEventListener('click',()=>select(i,{focus:true}));map.append(button);
    });
    display.replaceChildren(map);
  }
  function drawFocus(){
    const figure=figures[projects[index].name] || genericFigure;
    const lens=node('div','','scope-lens');
    lens.append(node('span','N','lens-north'),constellation(figure));
    display.replaceChildren(lens);
  }
  function renderDetail(){
    detail.replaceChildren();
    if(index<0){
      detail.classList.add('scope-welcome');
      detail.append(node('p','YOUR NEXT SMALL DISCOVERY','scope-kicker'),node('span','✦','scope-welcome-star'),node('h3',seen.size?'Welcome back to the sky.':'Curiosity looks good from here.','scope-project-title'),node('p',`${projects.length} points of light. Games, living worlds, and tools from the workshop. Choose any constellation, or let the telescope find your next stop.`,'scope-description'));
      const start=node('button',seen.size===projects.length?'Revisit a constellation ↗':seen.size?'Find something new ↗':'Follow the first signal ↗','scope-primary');start.type='button';start.addEventListener('click',()=>select(nextUnseenIndex(projects,-1,seen)));
      detail.append(start,node('p','Stay for one project, or follow your curiosity.','scope-gentle-note'));
      return;
    }
    detail.classList.remove('scope-welcome');
    const project=projects[index],figure=figures[project.name] || genericFigure;
    detail.append(node('p',`${figure.name} / ${String(index+1).padStart(2,'0')}`,'scope-kicker'));
    if(safeHTTPS(project.image)&&!(/\.gif(?:\?|$)/i.test(project.image))){
      const image=node('img','','scope-project-image');image.src=project.image;image.alt=project.imageAlt || project.title+' screenshot';image.loading='lazy';image.addEventListener('error',()=>image.remove(),{once:true});detail.append(image);
    }
    detail.append(node('p',project.category || 'From the workshop','scope-category'),node('h3',project.title,'scope-project-title'),node('p',project.summary,'scope-description'));
    if(project.requirement)detail.append(node('p',project.requirement,'scope-requirement'));
    const actions=node('div','','scope-actions');
    if(safeHTTPS(project.demo))actions.append(link('Step inside ↗',project.demo,'scope-primary'));
    const journal=node('button','Read field notes →','scope-secondary');journal.type='button';journal.addEventListener('click',()=>onJournal(project));actions.append(journal);
    if(!safeHTTPS(project.demo)&&safeHTTPS(project.url))actions.prepend(link('Explore the source ↗',project.url,'scope-primary'));
    detail.append(actions);
    if(projects.length>1){
      const next=nearestProject(projects,index,seen),related=projects[next];
      const follow=node('button','','scope-related');follow.type='button';
      follow.append(node('span',seen.has(related.name)?'KEEP WANDERING':'A NEARBY SIGNAL','scope-related-label'),node('span',related.title+' ↗','scope-related-title'));
      follow.addEventListener('click',()=>select(next));detail.append(follow);
    }
  }
  function render(){
    dialog.dataset.view=view;
    dialog.style.setProperty('--star-color',index<0?'238 207 147':(figures[projects[index].name] || genericFigure).color);
    $('sky-map-view').setAttribute('aria-pressed',String(view==='map'));
    $('sky-focus-view').setAttribute('aria-pressed',String(view==='focus'));
    $('sky-progress').textContent=`${seen.size} / ${projects.length} observed`;
    $('sky-footnote').textContent=seen.size===projects.length?'The whole sky, for now. Every light is worth a second look.':'Your field notes stay in this browser.';
    $('reset-discoveries').hidden=seen.size===0;
    $('find-signal').firstChild.textContent=seen.size===projects.length?'Wander again ':'Find a signal ';
    $('sky-position').textContent=index<0?'Choose a constellation':`${String(index+1).padStart(2,'0')} / ${String(projects.length).padStart(2,'0')} · ${figures[projects[index].name]?.name || 'The explorer'}`;
    if(view==='focus')drawFocus();else drawMap();
    renderDetail();
  }
  function showStage(){if(matchMedia('(max-width:760px)').matches)$('scope-stage').scrollIntoView({block:'start',behavior:'instant'});}
  $('sky-map-view').addEventListener('click',()=>{view='map';render();showStage();});
  $('sky-focus-view').addEventListener('click',()=>{view='focus';if(index<0)select(nextUnseenIndex(projects,-1,seen));else render();showStage();$('sky-focus-view').focus({preventScroll:true});});
  $('find-signal').addEventListener('click',()=>select(nextUnseenIndex(projects,index,seen)));
  $('previous-star').addEventListener('click',()=>select(index<0?projects.length-1:index-1));
  $('next-star').addEventListener('click',()=>select(index<0?0:index+1));
  $('reset-discoveries').addEventListener('click',()=>{seen=new Set();index=-1;view='map';try{localStorage.removeItem(storageKey);}catch{}render();showStage();$('find-signal').focus({preventScroll:true});});
  // Keep keyboard paging available without stealing arrows from form controls.
  dialog.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();const delta=event.key==='ArrowRight'?1:-1;
      select(index<0?(delta>0?0:projects.length-1):index+delta,{focus:event.target.classList.contains('sky-object')});
    }
  });
  render();
}

import {safeHTTPS} from './catalog-view.mjs';

// Deliberately imagined figures, drawn in one common celestial coordinate space.
const figures = {
  GolfProbably: {name:'The wanderer',color:'237 208 147',points:[[20,69],[34,58],[47,67],[60,50],[69,31],[69,15],[86,23],[69,31]],edges:[[0,1,2,3,4,5,6,7]]},
  Kinwild: {name:'The living form',color:'159 229 205',points:[[15,51],[30,35],[45,44],[58,24],[72,34],[85,18],[80,51],[69,67],[47,74],[31,60],[18,74],[30,35],[36,20]],edges:[[0,1,2,3,4,5],[4,6,7,8,9,0],[9,10],[1,12]]},
  RubiKit: {name:'The architect',color:'191 180 249',points:[[25,29],[48,17],[75,31],[75,62],[51,79],[25,62],[49,46]],edges:[[0,1,2,3,4,5,0],[0,6,2],[6,4],[1,6],[5,6,3]]},
  Hydra: {name:'The many-headed observer',color:'148 205 249',points:[[18,74],[32,60],[47,65],[59,50],[58,34],[46,21],[34,26],[69,31],[79,16],[87,23],[77,47],[90,43]],edges:[[0,1,2,3,4,5,6],[4,7,8,9],[3,10,11]]}
};
const ns='http://www.w3.org/2000/svg';
const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
const svgNode=(tag,attrs)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));return el;};
export const wrapIndex=(index,length)=>length?((index%length)+length)%length:0;
export function mountTelescope(data,onJournal) {
  const projects=data.featured.map(name=>data.projects.find(p=>p.name===name)).filter(Boolean);
  if(!projects.length)return;
  const dialog=document.getElementById('sky-dialog'),display=document.getElementById('constellations'),detail=document.getElementById('star-detail');
  let index=0;
  function link(label,url,cls){const a=node('a',label,cls);a.href=safeHTTPS(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
  function render(){
    const project=projects[index],figure=figures[project.name] || figures.RubiKit;
    dialog.style.setProperty('--star-color',figure.color);
    const svg=svgNode('svg',{viewBox:'0 0 100 100',class:'hero-constellation',role:'img','aria-label':project.title+' — '+figure.name});
    const group=svgNode('g',{});
    figure.edges.forEach((edge,i)=>{
      const d=edge.map((p,n)=>(n?'L':'M')+figure.points[p].join(' ')).join(' ');
      group.append(svgNode('path',{d,class:'constellation-haze'}));
      const path=svgNode('path',{d,class:'constellation-thread',pathLength:1});path.style.animationDelay=(i*.09)+'s';group.append(path);
    });
    figure.points.forEach(([x,y],i)=>{
      // Deduplicate repeated path vertices so each star has exactly one core.
      if(figure.points.findIndex(p=>p[0]===x&&p[1]===y)!==i)return;
      const star=svgNode('g',{class:'celestial-star',transform:`translate(${x} ${y})`});star.style.animationDelay=(i*.04)+'s';
      star.append(svgNode('circle',{r:i===3?4:2.8,class:'star-aura'}),svgNode('circle',{r:i===3?.85:.55,class:'star-core'}));
      if(i%3===0){star.append(svgNode('path',{d:'M-3 0H3M0-3V3',class:'star-spike'}),svgNode('circle',{r:1.4,class:'star-ring'}));}
      group.append(star);
    });
    svg.append(group); display.replaceChildren(svg);
    const title=node('h2',project.title,'scope-project-title');title.id='sky-title';
    const kicker=node('p',figure.name+' / '+String(index+1).padStart(2,'0'),'scope-kicker');
    const description=node('p',project.summary,'scope-description');
    const actions=node('div','','scope-actions');
    if(safeHTTPS(project.demo)) actions.append(link('Explore live project ↗',project.demo,'scope-primary'));
    const journal=node('button','Read journal entry','scope-secondary');journal.type='button';journal.addEventListener('click',()=>onJournal(project));actions.append(journal);
    if(safeHTTPS(project.url))actions.append(link('GitHub ↗',project.url,'scope-source'));
    detail.replaceChildren(kicker,title,description,actions);
    const position=document.getElementById('sky-position');position.replaceChildren();
    projects.forEach((p,i)=>{const dot=node('span','','scope-position-dot');dot.classList.toggle('current',i===index);dot.setAttribute('aria-hidden','true');position.append(dot);});
    position.append(node('span',`${String(index+1).padStart(2,'0')} / ${String(projects.length).padStart(2,'0')}`));
  }
  function move(delta){index=wrapIndex(index+delta,projects.length);render();}
  document.getElementById('previous-star').addEventListener('click',()=>move(-1));
  document.getElementById('next-star').addEventListener('click',()=>move(1));
  dialog.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
  render();
}

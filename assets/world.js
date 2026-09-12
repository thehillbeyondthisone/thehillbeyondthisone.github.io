// Small, fixed-camera world. Project identity is deliberately kept out of the scene.
export function createWorld(T, canvas, actions){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputEncoding=T.sRGBEncoding;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.fog=new T.FogExp2('#243b51',.018);
  const camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);
  const materials=new Map();
  const mat=(color,extra={})=>{const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.86,...extra}));return materials.get(key);};
  function mesh(geo,color,x=0,y=0,z=0,parent=scene,extra={}){const m=new T.Mesh(geo,mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const box=(w,h,d,color,x,y,z,parent=scene,extra={})=>mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent,extra);
  const cylinder=(a,b,h,color,x,y,z,parent=scene,n=24)=>mesh(new T.CylinderGeometry(a,b,h,n),color,x,y,z,parent);
  const sphere=(r,color,x,y,z,parent=scene,extra={})=>mesh(new T.SphereGeometry(r,24,16),color,x,y,z,parent,extra);
  function rod(a,b,r,color,parent=scene){const from=new T.Vector3(...a),to=new T.Vector3(...b);const m=cylinder(r,r,from.distanceTo(to),color,0,0,0,parent,10);m.position.copy(from).add(to).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());return m;}
  const targets=[];
  function interactive(group,action){group.userData.action=action;targets.push(group);return group;}
  scene.add(new T.HemisphereLight('#c6dfff','#253536',.9));
  const moonlight=new T.DirectionalLight('#c5d9fa',.9);moonlight.position.set(-4,10,6);moonlight.castShadow=true;moonlight.shadow.mapSize.set(1024,1024);Object.assign(moonlight.shadow.camera,{left:-6,right:6,top:6,bottom:-6});moonlight.shadow.bias=-.001;scene.add(moonlight);
  const warm=new T.PointLight('#ffc979',1.15,12,2);warm.position.set(-1,2.6,2);scene.add(warm);
  // Floating hill and a timber terrace.
  const earth=cylinder(3.9,2.7,1.2,'#273d43',0,-.8,0,scene,44);
  cylinder(3.9,3.85,.23,'#526f64',0,-.12,0,scene,44);
  const rim=mesh(new T.TorusGeometry(3.85,.05,8,64),'#91a18a',0,-.01,0);rim.rotation.x=Math.PI/2;
  for(let i=-8;i<=8;i++){const z=i*.32;const width=Math.sqrt(Math.max(0,3.55**2-z*z))*2;box(width,.1,.30,i%3===0?'#7f7660':'#706953',0,.03,z);}
  for(let i=0;i<19;i++){const a=i/19*Math.PI*1.44+.12,x=Math.cos(a)*3.5,z=Math.sin(a)*3.5;if(z>1.8 && x>0)continue;cylinder(.055,.055,.6,'#b3a186',x,.37,z,scene,8);}
  const rail=new T.CatmullRomCurve3(Array.from({length:36},(_,i)=>{const a=i/35*Math.PI*1.44+.12;return new T.Vector3(Math.cos(a)*3.5,.66,Math.sin(a)*3.5);}));mesh(new T.TubeGeometry(rail,60,.035,8,false),'#c4b69a');
  // Small observatory: a softly colored drum, segmented dome, and a lit doorway.
  const building=new T.Group();building.position.set(-1.05,0,-.75);scene.add(building);
  cylinder(1.15,1.24,1.65,'#bbc4b9',0,.95,0,building,32);
  cylinder(1.25,1.25,.12,'#2b4854',0,1.83,0,building,40);
  const dome=new T.Group();dome.position.y=1.9;building.add(dome);
  mesh(new T.SphereGeometry(1.22,32,18,0,Math.PI*2,0,Math.PI/2),'#547e86',0,0,0,dome,{metalness:.18,roughness:.55});
  for(let i=0;i<8;i++){const points=[];const a=i*Math.PI/4;for(let j=0;j<=20;j++){const b=j/20*Math.PI/2;points.push(new T.Vector3(Math.cos(a)*Math.sin(b)*1.23,Math.cos(b)*1.23,Math.sin(a)*Math.sin(b)*1.23));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.013,5,false),'#96afb0',0,0,0,dome);}
  const slot=box(.23,1.07,.06,'#1a3448',.02,.5,1.11,dome);slot.rotation.x=-.38;
  const door=box(.55,1.15,.09,'#293f4a',.25,.63,1.13,building);
  const windowMat={emissive:'#ffc774',emissiveIntensity:.45};
  const doorGlass=box(.38,.63,.03,'#ffd895',.25,.82,1.19,building,windowMat);
  box(.42,.035,.04,'#445359',.25,.8,1.22,building);box(.025,.66,.04,'#445359',.25,.82,1.22,building);
  sphere(.035,'#ddb56d',.43,.43,1.21,building,{metalness:.5});
  box(.9,.13,.6,'#b0a48a',.25,.12,1.39,building);box(.95,.1,.34,'#a39983',.25,.035,1.76,building);
  const sideWindow=cylinder(.25,.25,.07,'#ffda96',1.08,1.03,.1,building,32);sideWindow.rotation.z=Math.PI/2;sideWindow.material=mat('#ffda96',windowMat);
  // Telescope is an independent toy, not a repository shortcut.
  const telescope=interactive(new T.Group(),'telescope');telescope.position.set(1.4,.1,.4);scene.add(telescope);
  for(const a of [0,2.094,4.188])rod([0,1.05,0],[Math.cos(a)*.55,0,Math.sin(a)*.55],.035,'#d8cbb0',telescope);
  cylinder(.065,.065,.38,'#c4ab78',0,1.2,0,telescope);
  const tubeGroup=new T.Group();tubeGroup.position.set(0,1.53,0);tubeGroup.rotation.z=-.95;tubeGroup.rotation.y=.12;telescope.add(tubeGroup);
  cylinder(.18,.15,1.1,'#e6d9b4',0,0,0,tubeGroup,28);
  cylinder(.2,.2,.11,'#314451',0,.54,0,tubeGroup,28);
  cylinder(.161,.161,.015,'#244c71',0,.606,0,tubeGroup,28);
  cylinder(.075,.075,.28,'#314451',0,-.67,0,tubeGroup,20);
  rod([.19,-.2,0],[.4,-.2,0],.025,'#b2bac0',tubeGroup);
  // Radio on a tiny stool, right beside the telescope.
  const radio=interactive(new T.Group(),'radio');radio.position.set(2.26,.12,1.2);scene.add(radio);
  cylinder(.4,.4,.09,'#bd9c65',0,.43,0,radio,24);
  for(const x of [-.25,.25])for(const z of [-.23,.23])rod([x,.4,z],[x*1.12,0,z*1.12],.034,'#796747',radio);
  box(.59,.4,.27,'#c39560',0,.67,0,radio);
  const grill=box(.3,.26,.013,'#3b3c3d',-.09,.69,.146,radio);
  for(let i=0;i<7;i++)box(.26,.01,.018,'#b7a987',-.09,.58+i*.034,.157,radio);
  box(.13,.065,.012,'#e9d9a3',.2,.77,.15,radio,{emissive:'#e2c57d',emissiveIntensity:0});
  const dial=cylinder(.045,.045,.04,'#e1ca93',.19,.61,.18,radio,18);dial.rotation.x=Math.PI/2;
  rod([.13,.85,-.05],[.38,1.55,-.05],.009,'#c1c8c0',radio);
  // Warm yellow umbrella and a bench to sit awhile.
  const umbrella=new T.Group();umbrella.position.set(-2.2,.1,1.55);scene.add(umbrella);
  cylinder(.025,.025,1.9,'#cebc8c',0,.95,0,umbrella,10);
  const canopy=mesh(new T.ConeGeometry(.88,.38,8,1,true),'#ffc61a',0,2.03,0,umbrella,{side:T.DoubleSide});
  for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([0,2.22,0],[Math.cos(a)*.88,1.84,Math.sin(a)*.88],.013,'#d5a540',umbrella);}
  sphere(.04,'#ffdc6b',0,2.25,0,umbrella);
  const bench=new T.Group();bench.position.set(-1.85,.1,1.65);bench.rotation.y=.1;scene.add(bench);
  box(1.3,.11,.45,'#aa8558',0,.42,0,bench);box(1.3,.37,.07,'#b38c5d',0,.72,-.25,bench);
  for(const x of [-.5,.5])box(.08,.42,.35,'#344c50',x,.18,0,bench);
  // The reusable project board can point to any number of projects.
  const board=interactive(new T.Group(),'projects');board.position.set(.05,.1,2.35);board.rotation.y=.18;scene.add(board);
  for(const x of [-.42,.42])rod([x,0,0],[x,1.14,0],.035,'#b9a579',board);
  box(1.12,.72,.075,'#b99c65',0,1.06,0,board);box(.99,.6,.025,'#2e4e50',0,1.06,.05,board);
  for(let i=0;i<4;i++)box(.37,.21,.013,i===0?'#f2ca63':'#e5d9bd',i%2===0?-.23:.23,i<2?1.2:.94,.075,board);
  // A few plants and rocks keep the scene bounded and inexpensive.
  for(const [x,z,scale] of [[-2.7,-1.35,1],[-1.9,-2.4,.85],[1.35,-2.65,1.25],[2.55,-1.3,.72]]){
    cylinder(.05,.08,.9,'#5a604e',x,.38,z);
    for(let i=0;i<3;i++)mesh(new T.ConeGeometry((.5-i*.09)*scale,.9*scale,7),'#375951',x,(.72+i*.38)*scale,z);
  }
  for(const [x,z] of [[2.8,.1],[-2.7,2.25],[1.2,2.9],[-.15,-2.9]]){
    const stone=mesh(new T.DodecahedronGeometry(.2),'#8b9584',x,.18,z);stone.scale.set(1.3,.6,1);
    for(let i=0;i<4;i++){const dx=(i-1.5)*.08;rod([x+dx,.12,z+.2],[x+dx,.35+(i%2)*.1,z+.2],.012,'#7c9570');sphere(.055,'#b0a5cb',x+dx,.38+(i%2)*.1,z+.2);}
  }
  // Warm lanterns share one light source.
  const lanterns=[];
  for(const [x,z] of [[-.7,2.9],[2.7,-.5],[-2.7,-.6]]){box(.19,.26,.19,'#394f50',x,.2,z);lanterns.push(box(.14,.16,.14,'#ffe0a0',x,.24,z,scene,{emissive:'#ffba5b',emissiveIntensity:.8}));}
  // Sky: stable stars, an occasional shooting star, and one moon.
  let seed=42;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const starPositions=new Float32Array(180*3);for(let i=0;i<180;i++){starPositions[i*3]=(rnd()-.5)*40;starPositions[i*3+1]=3+rnd()*22;starPositions[i*3+2]=-7-rnd()*18;}
  const starsGeometry=new T.BufferGeometry();starsGeometry.setAttribute('position',new T.BufferAttribute(starPositions,3));
  const stars=new T.Points(starsGeometry,new T.PointsMaterial({color:'#f4e7c8',size:.045,transparent:true,opacity:.8,sizeAttenuation:true}));scene.add(stars);
  const moon=sphere(.38,'#f4e5bb',-4.3,6,-6,scene,{emissive:'#c5c1a2',emissiveIntensity:.7});moon.castShadow=false;
  const shooting=mesh(new T.SphereGeometry(.035,8,6),'#fff0c5',0,8,-10,scene,{emissive:'#ffe3aa',emissiveIntensity:1});shooting.visible=false;
  const motes=[];for(let i=0;i<16;i++){const m=sphere(.017,'#ffd996',(rnd()-.5)*7,.3+rnd()*1.5,(rnd()-.5)*6,scene,{emissive:'#ffd996',emissiveIntensity:.9});m.castShadow=false;motes.push({mesh:m,x:m.position.x,y:m.position.y,z:m.position.z,phase:rnd()*7});}
  // Tiny musical notes are rendered only while the supplied audio plays.
  const notes=[];for(let i=0;i<3;i++){const g=new T.Group();radio.add(g);const head=sphere(.045,'#ffe39d',0,0,0,g,{emissive:'#e8c769',emissiveIntensity:.5});head.scale.set(1.3,.75,.55);rod([.04,0,0],[.04,.17,0],.009,'#ffe39d',g);rod([.04,.17,0],[.12,.14,0],.012,'#ffe39d',g);g.visible=false;notes.push(g);}
  let paused=false, visible=true, contextLost=false, raf=0, time=0,lastTime=null,sky=false,lights=true,radioOn=false,transition=0;
  const basePosition=new T.Vector3(7,6.5,9),skyPosition=new T.Vector3(0,4,12),look=new T.Vector3();
  const ray=new T.Raycaster(),pointer=new T.Vector2();let down=null;
  function pick(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,true)[0];if(!hit)return null;let object=hit.object;while(object && !object.userData.action)object=object.parent;return object?.userData.action;}
  canvas.addEventListener('pointerdown',e=>{if(e.isPrimary && e.button===0)down={x:e.clientX,y:e.clientY,id:e.pointerId};},{passive:true});
  canvas.addEventListener('pointermove',e=>{if(down && Math.hypot(e.clientX-down.x,e.clientY-down.y)>10)down=null;if(e.pointerType==='mouse')canvas.style.cursor=pick(e)?'pointer':'default';},{passive:true});
  canvas.addEventListener('pointercancel',()=>down=null);
  canvas.addEventListener('pointerup',e=>{if(!down || down.id!==e.pointerId)return;down=null;const hit=pick(e);if(hit==='telescope')toggleSky();else if(hit==='radio')actions.onRadio();else if(hit==='projects')actions.onProject();else if(sky){shooting.position.set(-4,10,-10);shooting.visible=true;time=0;request();}},{passive:true});
  function size(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const half=w<560?4.5:4.7;camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();request();}
  function request(){if(!raf && visible && !contextLost && !document.hidden)raf=requestAnimationFrame(frame);}
  function frame(stamp){raf=0;if(!visible||contextLost||document.hidden){lastTime=null;return;}const dt=lastTime===null?0:Math.min((stamp-lastTime)/1000,.05);lastTime=stamp;
    if(!paused)time+=dt;
    transition=paused?Number(sky):transition+(Number(sky)-transition)*Math.min(1,dt*3.5);
    camera.position.copy(basePosition).lerp(skyPosition,transition);look.set(0,.85,0).lerp(new T.Vector3(0,9,-10),transition);camera.lookAt(look);
    telescope.rotation.y=Math.sin(time*.16)*.06;
    motes.forEach((m,i)=>{m.mesh.position.set(m.x+Math.sin(time*.4+m.phase)*.1,m.y+Math.sin(time*.65+m.phase)*.12,m.z);m.mesh.material.emissiveIntensity=.65+Math.sin(time+m.phase)*.25;});
    stars.material.opacity=.78+Math.sin(time*.25)*.08;
    notes.forEach((note,i)=>{note.visible=radioOn;const t=(time*.5+i/3)%1;note.position.set(Math.sin(t*3+i)*.15,1+t*.8,.05);note.scale.setScalar(1-t*.45);});
    if(shooting.visible){shooting.position.x+=dt*4;shooting.position.y-=dt*.8;if(shooting.position.x>7)shooting.visible=false;}
    renderer.render(scene,camera);if(!paused)request();
  }
  function toggleSky(){sky=!sky;actions.onSky(sky);if(paused)transition=Number(sky);request();}
  function toggleLights(){lights=!lights;warm.intensity=lights?1.15:0;doorGlass.material.emissiveIntensity=lights?.45:0;lanterns.forEach(l=>l.material.emissiveIntensity=lights?.8:0);actions.onLights(lights);request();}
  const resizeObserver=new ResizeObserver(size);resizeObserver.observe(canvas);
  const visibilityObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible && raf){cancelAnimationFrame(raf);raf=0;lastTime=null;}else request();});visibilityObserver.observe(canvas);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;if(raf)cancelAnimationFrame(raf);raf=0;actions.onError();});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;canvas.parentElement.classList.add('ready');document.getElementById('telescope').disabled=false;document.getElementById('lamp').disabled=false;request();});
  size();
  return {toggleSky,toggleLights,setRadio(on){radioOn=on;request();},setPaused(value){paused=value;if(raf)cancelAnimationFrame(raf);raf=0;lastTime=null;request();}};
}

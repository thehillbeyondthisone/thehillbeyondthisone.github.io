export function createSky(canvas) {
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  const fog=document.createElement('canvas'),nebula=fog.getContext('2d');
  let seed=81723;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const clouds=Array.from({length:80},(_,i)=>({x:.12+random()*.78,y:.15+random()*.58,r:.04+random()*.2,h:i%3}));
  const stars=Array.from({length:680},()=>({x:random(),y:random(),r:.2+random()**6*1.6,a:.12+random()*.7,depth:random()}));
  let active=false,motion=true,timer=0,time=0,last=0,width=0,height=0;
  function atmosphere(){
    fog.width=850;fog.height=Math.max(450,Math.round(850*height/Math.max(width,1)));
    nebula.fillStyle='#030915';nebula.fillRect(0,0,fog.width,fog.height);
    for(const c of clouds){
      const x=c.x*fog.width,y=(c.y+Math.sin(c.x*9)*.12)*fog.height,r=c.r*fog.width;
      const g=nebula.createRadialGradient(x,y,0,x,y,r);
      const color=['50,110,142','85,61,135','113,85,67'][c.h];
      g.addColorStop(0,`rgba(${color},.075)`);g.addColorStop(.5,`rgba(${color},.025)`);g.addColorStop(1,`rgba(${color},0)`);
      nebula.fillStyle=g;nebula.fillRect(x-r,y-r,r*2,r*2);
    }
    // A fine dust band adds scale without a moving wallpaper effect.
    let dustSeed=927;const dust=()=>{dustSeed=(1664525*dustSeed+1013904223)>>>0;return dustSeed/4294967296;};
    for(let i=0;i<4200;i++){const x=dust()*fog.width,y=(.61-.28*x/fog.width+(dust()-.5)*.27)*fog.height;nebula.fillStyle=`rgba(178,193,214,${dust()*.13})`;nebula.fillRect(x,y,dust()<.95?.6:1.1,.6);}
  }
  function draw(){
    if(!width||!height)return;
    ctx.drawImage(fog,0,0,width,height);
    for(const [i,s] of stars.entries()){
      const x=(s.x+Math.sin(time*.015+i)*.002*s.depth)*width,y=(s.y+Math.cos(time*.012+i)*.002*s.depth)*height;
      const a=s.a*(.82+.18*Math.sin(time*.5+i));
      if(s.r>1.2){const glow=ctx.createRadialGradient(x,y,0,x,y,s.r*7);glow.addColorStop(0,`rgba(183,216,244,${a*.3})`);glow.addColorStop(1,'rgba(183,216,244,0)');ctx.fillStyle=glow;ctx.fillRect(x-s.r*7,y-s.r*7,s.r*14,s.r*14);}
      ctx.fillStyle=`rgba(221,231,246,${a})`;ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();
    }
  }
  function frame(){timer=0;if(!active||!motion||document.hidden)return;const now=performance.now();time+=last?Math.min(now-last,100)/1000:0;last=now;draw();timer=setTimeout(frame,50);}
  function wake(){clearTimeout(timer);timer=0;last=0;if(active){draw();if(motion&&!document.hidden)frame();}}
  function resize(){const ratio=Math.min(devicePixelRatio||1,1.5);width=Math.round(canvas.clientWidth*ratio);height=Math.round(canvas.clientHeight*ratio);canvas.width=width;canvas.height=height;atmosphere();draw();}
  new ResizeObserver(resize).observe(canvas);document.addEventListener('visibilitychange',wake);
  return {setActive(value){active=value;if(value)resize();wake();},setMotion(value){motion=value;wake();}};
}

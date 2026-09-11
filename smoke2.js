const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
function boot(reduced){
  const errors=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
    url:'https://thehillbeyondthisone.github.io/#hydra',
    beforeParse(win){
      win.matchMedia=q=>({matches:reduced&&/reduced-motion/.test(q),media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
      win.AudioContext=function(){return{state:'running',currentTime:0,destination:{},resume(){},
        createOscillator(){return{connect(){},start(){},stop(){},frequency:{value:0},type:''};},
        createGain(){return{connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}};}};};
      win.addEventListener('error',e=>errors.push(String(e.error&&e.error.stack||e.message)));
    }});
  return {dom,errors};
}
(async()=>{
  const tick=ms=>new Promise(r=>setTimeout(r,ms));
  const out=[];const ok=(l,c,e='')=>out.push(`${c?'PASS':'FAIL'}  ${l}${e?'  — '+e:''}`);

  // reduced motion: boot must be skipped and the deep link still honoured
  let {dom,errors}=boot(true); await tick(300);
  let d=dom.window.document;
  ok('reduced: boot hidden', d.getElementById('boot').style.display==='none');
  ok('reduced: deep link opened', d.getElementById('ins-title').textContent==='Hydra', d.getElementById('ins-title').textContent);
  ok('reduced: at most 1 bloom', dom.window.eval('blooms.length')<=1, 'n='+dom.window.eval('blooms.length'));
  ok('reduced: density capped', dom.window.eval('nums.length')<=40, 'n='+dom.window.eval('nums.length'));
  ok('reduced: no errors', errors.length===0, errors[0]||'');
  dom.window.close();

  // normal: deep link resolves after the boot sequence
  ({dom,errors}=boot(false)); await tick(3200);
  d=dom.window.document;
  ok('normal: deep link opened after boot', d.getElementById('inspector').classList.contains('open'));
  ok('normal: unlock persists', (()=>{
    dom.window.eval('unlockSettings(true); saveSettings();');
    const g=d.getElementById('gear-btn');
    const st=JSON.parse(dom.window.localStorage.getItem('thbo_settings_v2'));
    return g.classList.contains('unlocked') && st.unlocked===true;
  })());
  ok('normal: hidden tab stops timers', (()=>{
    Object.defineProperty(d,'hidden',{value:true,configurable:true});
    d.dispatchEvent(new dom.window.Event('visibilitychange'));
    return dom.window.eval('rafId===null && drip===null && hexTick===null');
  })());
  ok('normal: visible tab restarts', (()=>{
    Object.defineProperty(d,'hidden',{value:false,configurable:true});
    d.dispatchEvent(new dom.window.Event('visibilitychange'));
    return dom.window.eval('rafId!==null && drip!==null && hexTick!==null');
  })());
  ok('normal: no errors', errors.length===0, errors[0]||'');
  dom.window.close();

  console.log(out.join('\n'));
  const f=out.filter(l=>l.startsWith('FAIL')).length;
  console.log(`\n${out.length-f}/${out.length} passed`);
  process.exit(f?1:0);
})();

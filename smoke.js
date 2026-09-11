const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');
const errors = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://thehillbeyondthisone.github.io/',
  beforeParse(win) {
    win.matchMedia = q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
    win.AudioContext = function(){ return { state:'running', currentTime:0, destination:{}, resume(){},
      createOscillator(){return {connect(){},start(){},stop(){},frequency:{value:0},type:''};},
      createGain(){return {connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}};} }; };
    win.addEventListener('error', e => errors.push('ERROR: ' + (e.error && e.error.stack || e.message)));
    const vc = win.console;
    win.console = Object.assign({}, vc, { error: (...a) => errors.push('console.error: ' + a.join(' ')) });
  }
});

const { window } = dom;
const doc = window.document;

function tick(ms){ return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await tick(300);

  const out = [];
  const ok = (label, cond, extra='') => out.push(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  — ' + extra : ''}`);

  // 1. slider defaults baked in
  const want = {'sl-density':'42','sl-rate':'48','sl-shim':'47','sl-bcount':'75','sl-bspeed':'36',
                'sl-bsize':'50','sl-jelly':'100','sl-wr':'50','sl-ws':'62','sl-wsc':'62'};
  for (const [id, v] of Object.entries(want)) {
    const el = doc.getElementById(id);
    ok(`slider ${id} = ${v}`, el && el.value === v, el ? 'got ' + el.value : 'missing');
  }

  // 2. numerals rendered
  for (const [id, v] of Object.entries(want)) {
    const vid = 'vl-' + id.slice(3);
    const el = doc.getElementById(vid);
    const num = el ? el.firstChild.nodeValue : null;
    const unit = doc.getElementById(vid + '-u');
    ok(`readout ${vid}`, num === v && unit && unit.textContent.length > 0,
       el ? `num=${num} unit="${unit && unit.textContent}"` : 'missing');
  }

  // 3. toggles
  const togs = doc.querySelectorAll('#repo-toggles .tog');
  ok('5 repo toggles, all on', togs.length === 5 && [...togs].every(t => t.classList.contains('on')));
  const nr = doc.getElementById('tog-nodereact');
  ok('node reactive on', nr.classList.contains('on') && nr.getAttribute('aria-checked') === 'true');

  // 4. nodes + bins
  ok('5 repo nodes placed', doc.querySelectorAll('.rnode').length === 5);
  ok('nodes are buttons', [...doc.querySelectorAll('.rnode')].every(n => n.tagName === 'BUTTON'));
  ok('5 bins', doc.querySelectorAll('.bin').length === 5);

  // 5. interactions
  doc.getElementById('gear-btn').dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
  await tick(20);
  ok('gear opens settings', doc.getElementById('settings').classList.contains('open'));
  doc.dispatchEvent(new window.KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
  await tick(20);
  ok('escape closes settings', !doc.getElementById('settings').classList.contains('open'));

  doc.querySelector('.rnode').dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
  await tick(150);
  ok('node opens inspector', doc.getElementById('inspector').classList.contains('open'));
  ok('inspector title set', doc.getElementById('ins-title').textContent === 'RubiKit',
     doc.getElementById('ins-title').textContent);
  ok('deep link hash written', window.location.hash === '#rubikit', window.location.hash);
  doc.getElementById('ins-next').dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
  await tick(50);
  ok('next advances', doc.getElementById('ins-title').textContent === 'NotumHUD',
     doc.getElementById('ins-title').textContent);
  doc.getElementById('ins-close').dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
  await tick(20);
  ok('close clears hash', window.location.hash === '');

  // 6. slider drag updates state + storage
  const sl = doc.getElementById('sl-density');
  sl.value = '100';
  sl.dispatchEvent(new window.Event('input', {bubbles:true}));
  await tick(20);
  ok('density readout updates', doc.getElementById('vl-density').firstChild.nodeValue === '100');
  ok('density unit updates', /230 gl/.test(doc.getElementById('vl-density-u').textContent),
     doc.getElementById('vl-density-u').textContent);
  const stored = JSON.parse(window.localStorage.getItem('thbo_settings_v2') || '{}');
  ok('settings persisted', stored['sl-density'] === 100, JSON.stringify(stored).slice(0,120));

  // 7. reset
  doc.getElementById('btn-reset').dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
  await tick(20);
  ok('reset restores default', doc.getElementById('sl-density').value === '42',
     doc.getElementById('sl-density').value);

  // 8. sound opt-in
  ok('sound starts off', doc.getElementById('snd-btn').textContent.includes('OFF'));

  // 9. repo toggle hides a node and persists
  togs[2].dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
  await tick(20);
  const hidden = JSON.parse(window.localStorage.getItem('thbo_settings_v2')).hidden;
  ok('hidden repo persisted', Array.isArray(hidden) && hidden.includes(2), JSON.stringify(hidden));

  // 10. meta + fallback
  ok('og:image present', !!doc.querySelector('meta[property="og:image"]'));
  ok('description present', !!doc.querySelector('meta[name="description"]'));
  ok('noscript has 6 links', (html.match(/<noscript>[\s\S]*?<\/noscript>/)[0].match(/<a /g) || []).length === 6);
  ok('github link in header', !!doc.getElementById('gh-btn'));

  console.log(out.join('\n'));
  console.log('\nRuntime errors: ' + (errors.length ? '\n' + errors.join('\n') : 'none'));
  const fails = out.filter(l => l.startsWith('FAIL')).length;
  console.log(`\n${out.length - fails}/${out.length} checks passed`);
  process.exit(fails || errors.length ? 1 : 0);
})();

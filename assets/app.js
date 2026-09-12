import {createScene} from './world.js';
import {createSky} from './sky.js';
import {safeHTTPS, journalProjects} from './catalog-view.mjs';

const $ = id => document.getElementById(id);
const data = window.OBSERVATORY_DATA;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let scene = null, sky = null, selected = null, mode = 'featured';
let listScroll = 0, lastEntry = null, toastTimer = 0, viewerTimer = 0;
let audio = null, audioPending = false;
const dialogs = ['journal', 'time-dialog', 'sky-dialog', 'viewer'].map($);

function element(tag, text, className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function externalLink(label, url, className = '') {
  const a = element('a', label, className);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function notify(text) {
  clearTimeout(toastTimer);
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5500);
}
function syncScene() {
  scene?.setSuspended($('journal').open || $('sky-dialog').open || $('viewer').open);
  sky?.setActive($('sky-dialog').open);
}
function openDialog(id) {
  dialogs.forEach(d => { if (d.id !== id && d.open) d.close(); });
  if (!$(id).open) $(id).showModal();
  syncScene();
}
function returnFocus() {
  if (!dialogs.some(d => d.open)) document.querySelector('.journal-launch').focus({preventScroll: true});
}

function renderProjects() {
  const projects = journalProjects(data, mode, $('project-search').value);
  $('show-featured').setAttribute('aria-pressed', String(mode === 'featured'));
  $('show-all').setAttribute('aria-pressed', String(mode === 'all'));
  $('catalog-count').textContent = `${projects.length} ${projects.length === 1 ? 'entry' : 'entries'}`;
  $('no-results').hidden = projects.length > 0;
  const fragment = document.createDocumentFragment();
  projects.forEach((project, index) => {
    const button = element('button', '', 'project-entry');
    button.type = 'button';
    button.dataset.project = project.name;
    const number = element('span', String(index + 1).padStart(2, '0'), 'entry-number');
    number.setAttribute('aria-hidden', 'true');
    const content = element('span', '', 'entry-content');
    content.append(element('span', project.title || project.name, 'entry-title'));
    content.append(element('span', project.summary || 'Source and documentation on GitHub.', 'entry-summary'));
    const meta = [project.category, project.demo ? 'Live project' : project.language, project.fork ? 'Fork' : '', project.archived ? 'Archived' : ''].filter(Boolean);
    content.append(element('span', meta.join(' · '), 'entry-meta'));
    const arrow = element('span', '↗', 'entry-arrow');
    arrow.setAttribute('aria-hidden', 'true');
    button.append(number, content, arrow);
    button.addEventListener('click', () => showProject(project, button));
    fragment.append(button);
  });
  $('project-list').replaceChildren(fragment);
}

function showCollection({focus = true} = {}) {
  $('detail-view').hidden = true;
  $('collection-view').hidden = false;
  $('journal').setAttribute('aria-labelledby', 'journal-title');
  $('journal-scroll').scrollTop = listScroll;
  if (focus) {
    if (lastEntry?.isConnected) lastEntry.focus({preventScroll: true});
    else $('journal-title').focus({preventScroll: true});
  }
}
function openJournal(event) {
  event?.preventDefault();
  showCollection({focus: false});
  openDialog('journal');
  $('journal-title').focus({preventScroll: true});
}
function showProject(project, opener) {
  selected = project;
  lastEntry = opener;
  listScroll = $('journal-scroll').scrollTop;
  $('detail-category').textContent = project.category || 'From the collection';
  $('detail-title').textContent = project.title || project.name;
  $('detail-description').textContent = project.description || project.summary || 'Explore the source and documentation on GitHub.';
  $('detail-requirement').textContent = project.requirement || '';
  $('detail-requirement').hidden = !project.requirement;
  const meta = [project.language, project.fork ? 'Fork' : '', project.archived ? 'Archived' : ''].filter(Boolean);
  if (project.updated) {
    const date = new Date(project.updated);
    if (!isNaN(date)) meta.push(`Updated ${date.toLocaleDateString(undefined, {month: 'short', year: 'numeric', timeZone: 'UTC'})}`);
  }
  $('detail-meta').replaceChildren(...meta.map(text => element('span', text)));
  $('detail-media').replaceChildren();
  const imageURL = safeHTTPS(project.image);
  if (imageURL) {
    if (preference.matches && /\.gif(?:\?|$)/i.test(imageURL)) {
      $('detail-media').append(externalLink('View existing animation ↗', imageURL, 'secondary'));
    } else {
      const image = document.createElement('img');
      image.alt = project.imageAlt || `${project.title || project.name} screenshot`;
      image.className = 'project-image';
      image.loading = 'lazy';
      image.src = imageURL;
      image.addEventListener('error', () => image.remove(), {once: true});
      $('detail-media').append(image);
    }
  }
  const actions = $('detail-actions');
  actions.replaceChildren();
  const demo = safeHTTPS(project.demo);
  if (demo) {
    if (project.embed) {
      const button = element('button', 'Explore here', 'primary');
      button.type = 'button';
      button.addEventListener('click', () => openDemo(project));
      actions.append(button);
    }
    actions.append(externalLink('Open project in a new tab ↗', demo, project.embed ? 'secondary' : 'primary'));
  }
  const source = safeHTTPS(project.url);
  if (source) actions.append(externalLink('Source & README ↗', source, 'secondary'));
  $('collection-view').hidden = true;
  $('detail-view').hidden = false;
  $('journal').setAttribute('aria-labelledby', 'detail-title');
  $('journal-scroll').scrollTop = 0;
  $('detail-title').focus({preventScroll: true});
}

function openDemo(project) {
  const url = safeHTTPS(project.demo);
  if (!project.embed || !url) return;
  $('viewer-title').textContent = project.title || project.name;
  $('external-demo').href = url;
  $('viewer-fallback').href = url;
  $('demo-frame').title = `${project.title || project.name} — live project`;
  $('demo-frame').src = url;
  $('viewer-help').hidden = true;
  clearTimeout(viewerTimer);
  viewerTimer = setTimeout(() => { if ($('viewer').open) $('viewer-help').hidden = false; }, 10000);
  openDialog('viewer');
  $('back-world').focus();
}
function clearViewer() {
  clearTimeout(viewerTimer);
  $('demo-frame').removeAttribute('src');
  $('viewer-help').hidden = true;
  returnFocus();
}

function updateTime(state) {
  $('phase-label').textContent = state.name;
  $('phase-state').textContent = state.paused ? 'Staying here' : 'Time is passing';
  $('time-output').textContent = state.name;
  $('time-range').setAttribute('aria-valuetext', state.name);
  if (document.activeElement !== $('time-range')) $('time-range').value = String(Math.round(state.phase * 1000));
  $('pause-time').textContent = state.paused ? 'Let time wander' : 'Pause time';
  $('pause-time').setAttribute('aria-pressed', String(state.paused));
  $('pause-time').disabled = !state.dayReady;
  $('time-range').disabled = !state.dayReady;
  document.querySelectorAll('[data-phase]').forEach(button => {
    button.disabled = !state.dayReady;
    const chosen = state.paused && Math.abs(Number(button.dataset.phase) - state.phase) < 0.006;
    button.setAttribute('aria-pressed', String(chosen));
  });
  sky?.setMotion(!preference.matches && !state.paused);
}
function setRadioState(playing) {
  $('scene').classList.toggle('radio-playing', playing);
  $('radio-label').textContent = playing ? 'Radio on' : 'Radio off';
  document.querySelectorAll('[data-radio]').forEach(button => {
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Turn radio off' : 'Turn radio on');
  });
}
async function toggleRadio() {
  if (!data.audio) { notify('A quiet radio for now. The first recording is on its way.'); return; }
  if (audioPending) return;
  if (!audio) {
    audio = new Audio(data.audio);
    audio.loop = true;
    audio.volume = 0.35;
    audio.addEventListener('playing', () => setRadioState(true));
    for (const event of ['pause', 'waiting', 'stalled', 'ended']) audio.addEventListener(event, () => setRadioState(false));
    audio.addEventListener('error', () => { setRadioState(false); notify('The recording could not load. Try the radio again in a moment.'); });
  }
  if (!audio.paused) { audio.pause(); return; }
  audioPending = true;
  try { await audio.play(); }
  catch { setRadioState(false); notify('The radio could not start. Tap again to retry.'); }
  finally { audioPending = false; }
}

function init() {
  if (!data || !Array.isArray(data.projects) || !data.projects.length || !Array.isArray(data.featured)) return;
  if (typeof $('journal').showModal !== 'function') return;
  renderProjects();
  $('favorite-total').textContent = String(data.featured.length);
  $('all-total').textContent = String(data.projects.length);
  $('featured-count').textContent = `${data.featured.length} selected projects`;
  const date = new Date(data.generatedAt);
  if (!isNaN(date)) $('updated').textContent = `Collection refreshed ${date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'})}.`;

  document.querySelectorAll('[data-journal]').forEach(button => button.addEventListener('click', openJournal));
  document.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => openDialog('time-dialog')));
  document.querySelectorAll('[data-sky]').forEach(button => button.addEventListener('click', () => {
    if (!sky) { notify('The telescope is resting. The journal is still open to explore.'); return; }
    openDialog('sky-dialog'); $('sky-canvas').focus();
  }));
  document.querySelectorAll('[data-radio]').forEach(button => button.addEventListener('click', toggleRadio));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  dialogs.forEach(dialog => {
    dialog.addEventListener('close', syncScene);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog || dialog.id === 'viewer' || dialog.id === 'sky-dialog') return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  });
  $('show-featured').addEventListener('click', () => { mode = 'featured'; listScroll = 0; renderProjects(); });
  $('show-all').addEventListener('click', () => { mode = 'all'; listScroll = 0; renderProjects(); });
  $('project-search').addEventListener('input', renderProjects);
  $('back-collection').addEventListener('click', () => showCollection());
  $('back-world').addEventListener('click', () => $('viewer').close());
  $('switch-project').addEventListener('click', openJournal);
  $('viewer').addEventListener('close', clearViewer);
  $('dismiss-help').addEventListener('click', () => { $('viewer-help').hidden = true; });
  $('pause-time').addEventListener('click', () => scene?.setPaused(!scene.paused));
  $('time-range').addEventListener('input', event => scene?.choosePhase(Number(event.target.value) / 1000, {immediate: true}));
  document.querySelectorAll('[data-phase]').forEach(button => button.addEventListener('click', () => scene?.choosePhase(Number(button.dataset.phase))));
  preference.addEventListener('change', event => {
    scene?.setReducedMotion(event.matches);
    sky?.setMotion(!event.matches && !scene?.paused);
    $('motion-explanation').textContent = event.matches ? 'Motion is held still to match your device preference. You can start the cycle here.' : 'One gentle cycle takes about 20 minutes.';
    if (selected && $('detail-view').hidden === false) showProject(selected, lastEntry);
  });
  if (preference.matches) $('motion-explanation').textContent = 'Motion is held still to match your device preference. You can start the cycle here.';

  // Enhance after navigation is wired; the source links survive script/data failure.
  document.documentElement.classList.add('enhanced');
  try {
    scene = createScene({element: $('scene'), plane: $('art-plane'), canvas: $('ambience'), onChange: updateTime, reducedMotion: preference.matches});
  } catch {
    $('scene-error').hidden = false;
    $('scene-error').textContent = 'The scene is resting. Your journal is ready to explore.';
    document.querySelectorAll('[data-time]').forEach(button => { button.disabled = true; });
  }
  try { sky = createSky($('sky-canvas')); sky?.setMotion(!preference.matches && !scene?.paused); } catch { sky = null; }
}

init();

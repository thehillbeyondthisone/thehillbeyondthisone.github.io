// These helpers deliberately avoid the DOM so exploration can be tested in Node.
export function wrapIndex(index, length) {
  if (!Number.isFinite(length) || length < 1) return 0;
  const count = Math.floor(length);
  const position = Number.isFinite(index) ? Math.trunc(index) : 0;
  return ((position % count) + count) % count;
}

/** Restore only known project names, accepting either parsed or serialized storage. */
export function normalizeDiscoveries(saved, names) {
  const known = new Set(
    Array.from(names instanceof Set || Array.isArray(names) ? names : [])
      .filter(name => typeof name === 'string')
  );
  let entries = saved;
  if (typeof saved === 'string') {
    try { entries = JSON.parse(saved); } catch { entries = []; }
  }
  if (!Array.isArray(entries)) return new Set();
  return new Set(entries.filter(name => typeof name === 'string' && known.has(name)));
}

const seenNames = seen => seen instanceof Set ? seen : new Set(Array.isArray(seen) ? seen : []);
const projectList = projects => Array.isArray(projects) ? projects : [];

/** Move forward through unseen work, returning to the next project after completion. */
export function nextUnseenIndex(projects, currentIndex, seen) {
  const list = projectList(projects);
  if (!list.length) return 0;
  const current = wrapIndex(currentIndex, list.length);
  const discovered = seenNames(seen);
  for (let distance = 1; distance <= list.length; distance += 1) {
    const candidate = wrapIndex(current + distance, list.length);
    if (!discovered.has(list[candidate]?.name)) return candidate;
  }
  return wrapIndex(current + 1, list.length);
}

/** Recommend unseen work in the current category, breaking ties in forward order. */
export function nearestProject(projects, currentIndex, seen) {
  const list = projectList(projects);
  if (!list.length) return 0;
  const current = wrapIndex(currentIndex, list.length);
  const category = list[current]?.category;
  const discovered = seenNames(seen);
  let firstUnseen = null;
  for (let distance = 1; distance < list.length; distance += 1) {
    const candidate = wrapIndex(current + distance, list.length);
    const project = list[candidate];
    if (discovered.has(project?.name)) continue;
    if (firstUnseen === null) firstUnseen = candidate;
    if (typeof category === 'string' && category.length && project?.category === category) {
      return candidate;
    }
  }
  return firstUnseen ?? wrapIndex(current + 1, list.length);
}

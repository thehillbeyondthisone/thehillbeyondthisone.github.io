export function safeHTTPS(value) {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch { return null; }
}

export function journalProjects(data, mode = 'featured', query = '') {
  const projects = mode === 'featured'
    ? data.featured.map(name => data.projects.find(p => p.name === name)).filter(Boolean)
    : data.projects;
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return projects.filter(p => {
    const text = [p.title, p.name, p.summary, p.category, p.language].filter(Boolean).join(' ').toLocaleLowerCase();
    return words.every(word => text.includes(word));
  });
}

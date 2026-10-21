function buildActivityCard(activity, options = {}) {
  const card = document.createElement('div');
  card.className = 'activity-card';

  const title = document.createElement('div');
  title.className = 'activity-card-title';
  title.textContent = activity.title;

  const meta = document.createElement('div');
  meta.className = 'activity-card-meta';

  const metaParts = [];
  if (options.showGroup && activity.groups) metaParts.push(activity.groups.name);
  if (options.showSubject && activity.subjects) metaParts.push(activity.subjects.name);
  meta.textContent = metaParts.join(' — ');

  card.appendChild(title);
  if (metaParts.length > 0) card.appendChild(meta);

  const badge = buildUrgencyBadge(activity.due_at, options.isCompleted || false);
  if (badge) card.appendChild(badge);

  card.addEventListener('click', () => {
    window.location.href = `activity-detail.html?id=${activity.id}`;
  });

  return card;
}

function buildGroupCard(group) {
  const card = document.createElement('div');
  card.className = 'group-card';
  card.textContent = group.name;

  card.addEventListener('click', () => {
    window.location.href = `group-overview.html?id=${group.id}`;
  });

  return card;
}

function buildUrgencyBadge(dueDateIso, isCompleted) {
  if (!dueDateIso) return null;

  const status = getUrgencyStatus(dueDateIso, isCompleted);
  const label = formatUrgencyLabel(dueDateIso, isCompleted);

  const badge = document.createElement('span');
  badge.className = `urgency-badge ${status.toLowerCase().replace('_', '-')}`;
  badge.textContent = label;

  return badge;
}k
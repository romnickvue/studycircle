function buildActivityCard(activity, options = {}) {
  if (options.neo) {
    const row = document.createElement('div');
    row.className = 'neo-row';

    if (options.sectionBorder) {
      row.classList.add(`border-${options.sectionBorder}`);
    }

    const checkbox = document.createElement('div');
    checkbox.className = 'neo-checkbox';

    const textWrap = document.createElement('div');
    textWrap.style.flex = '1';

    const title = document.createElement('div');
    title.className = 'neo-row-title';
    title.textContent = activity.title;

    const meta = document.createElement('div');
    meta.className = 'neo-row-meta';
    const metaParts = [];
    if (options.showGroup && activity.groups) metaParts.push(activity.groups.name);
    if (options.showSubject && activity.subjects) metaParts.push(activity.subjects.name);
    meta.textContent = metaParts.join(' — ');

    textWrap.appendChild(title);
    if (metaParts.length > 0) textWrap.appendChild(meta);

    row.appendChild(checkbox);
    row.appendChild(textWrap);

    const badge = buildUrgencyBadge(activity.due_at, options.isCompleted || false);
    if (badge) {
      badge.classList.add('neo-row-badge');
      row.appendChild(badge);
    }

    row.addEventListener('click', () => {
      window.location.href = `activity-detail.html?id=${activity.id}`;
    });

    return row;
  }

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

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function buildGroupCard(group, options = {}) {
  if (options.neo) {
    const row = document.createElement('div');
    row.className = 'neo-row';

    const avatar = document.createElement('div');
    avatar.className = 'neo-avatar';
    avatar.textContent = getInitials(group.name);

    const textWrap = document.createElement('div');
    textWrap.style.flex = '1';

    const title = document.createElement('div');
    title.className = 'neo-row-title';
    title.textContent = group.name;

    const meta = document.createElement('div');
    meta.className = 'neo-row-meta';
    const memberLabel = options.memberCount != null ? `${options.memberCount} member${options.memberCount === 1 ? '' : 's'}` : '';
    const activeLabel = options.activeCount != null ? `${options.activeCount} active task${options.activeCount === 1 ? '' : 's'}` : '';
    meta.textContent = [memberLabel, activeLabel].filter(Boolean).join(' · ');

    textWrap.appendChild(title);
    if (meta.textContent) textWrap.appendChild(meta);

    const chevron = document.createElement('span');
    chevron.className = 'neo-row-chevron';
    chevron.textContent = '›';

    row.appendChild(avatar);
    row.appendChild(textWrap);
    row.appendChild(chevron);

    row.addEventListener('click', () => {
      window.location.href = `group-overview.html?id=${group.id}`;
    });

    return row;
  }

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
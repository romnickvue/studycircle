function buildActivityCard(activity, options = {}) {
  if (options.neo) {
    const row = document.createElement('div');
    row.className = 'neo-row';

    if (options.sectionBorder) {
      row.classList.add(`border-${options.sectionBorder}`);
    }

    const checkbox = document.createElement('div');
    checkbox.className = 'neo-checkbox' + (options.isCompleted ? ' checked' : '');
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute('aria-checked', options.isCompleted ? 'true' : 'false');
    checkbox.tabIndex = 0;
    checkbox.innerHTML = options.isCompleted ? '<i class="bi bi-check-lg"></i>' : '';

    let busy = false;
    const toggleStatus = async (e) => {
      e.stopPropagation();
      if (busy) return;
      busy = true;

      const nextStatus = options.isCompleted ? 'NOT_STARTED' : 'COMPLETED';
      const { error } = await ProgressService.setStatus(activity.id, nextStatus);
      busy = false;

      if (error) {
        if (typeof showToast === 'function') showToast('Could not update task.', 'error');
        return;
      }

      if (typeof options.onStatusChange === 'function') {
        options.onStatusChange(activity, nextStatus);
      }
    };

    checkbox.addEventListener('click', toggleStatus);
    checkbox.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleStatus(e);
      }
    });

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

    if (options.menu) {
      row.classList.add('has-menu');
      row.appendChild(buildRowMenu(options.menu));
    }

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
}

function pickGroupIcon(groupId) {
  const icons = ['bi-book', 'bi-code-slash', 'bi-flask', 'bi-mortarboard', 'bi-calculator', 'bi-globe'];
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) hash = (hash + groupId.charCodeAt(i)) % icons.length;
  return icons[hash];
}

function buildGroupCardDetailed(group, memberCount) {
  const card = document.createElement('div');
  card.className = 'neo-card group-detail-card';

  const iconBox = document.createElement('div');
  iconBox.className = 'group-icon-box';
  const icon = group.icon_name || 'bi-people-fill';
  iconBox.innerHTML = `<i class="bi ${icon}"></i>`;

  const textWrap = document.createElement('div');
  textWrap.className = 'group-detail-text';

  const title = document.createElement('h3');
  title.textContent = group.name;

  const desc = document.createElement('p');
  desc.className = 'group-detail-desc';
  desc.textContent = group.description || '';

  textWrap.appendChild(title);
  if (group.description) textWrap.appendChild(desc);

  const arrowBtn = document.createElement('button');
  arrowBtn.className = 'group-arrow-btn';
  arrowBtn.innerHTML = '<i class="bi bi-arrow-right"></i>';
  arrowBtn.setAttribute('aria-label', 'Open group');

  const metaCol = document.createElement('div');
  metaCol.className = 'group-meta-col';
  metaCol.innerHTML = `<p><i class="bi bi-people"></i> ${memberCount} member${memberCount === 1 ? '' : 's'}</p>`;

  card.appendChild(iconBox);
  card.appendChild(textWrap);
  card.appendChild(arrowBtn);
  card.appendChild(metaCol);

  card.addEventListener('click', () => {
    window.location.href = `group-overview.html?id=${group.id}`;
  });

  return card;
}

function buildRowMenu(menu) {
  const wrap = document.createElement('div');
  wrap.className = 'subject-menu row-menu';
  wrap.innerHTML = `
    <button type="button" class="menu-btn" aria-label="Task options"><i class="bi bi-three-dots"></i></button>
    <div class="menu-dropdown" hidden>
      <button type="button" class="menu-item" data-action="edit"><i class="bi bi-pencil"></i> Edit Task</button>
      <button type="button" class="menu-item menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Remove Task</button>
    </div>`;

  const dropdown = wrap.querySelector('.menu-dropdown');
  wrap.addEventListener('click', (e) => e.stopPropagation());

  wrap.querySelector('.menu-btn').addEventListener('click', () => {
    const wasHidden = dropdown.hidden;
    document.querySelectorAll('.menu-dropdown').forEach((m) => { m.hidden = true; });
    dropdown.hidden = !wasHidden;
  });

  wrap.querySelector('[data-action="edit"]').addEventListener('click', () => {
    dropdown.hidden = true;
    menu.onEdit();
  });

  wrap.querySelector('[data-action="delete"]').addEventListener('click', () => {
    dropdown.hidden = true;
    menu.onDelete();
  });

  return wrap;
}

document.addEventListener('click', () => {
  document.querySelectorAll('.menu-dropdown').forEach((m) => { m.hidden = true; });
});
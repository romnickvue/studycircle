const loadingEl = document.getElementById('loading-state');
const listEl = document.getElementById('tasks-list');
const emptyEl = document.getElementById('empty-state');

async function loadTasks() {
  const { activities, error } = await ActivitiesService.listMine();

  loadingEl.hidden = true;

  if (error) {
    emptyEl.hidden = false;
    return;
  }

  if (activities.length === 0) {
    emptyEl.hidden = false;
    listEl.hidden = true;
    return;
  }

  listEl.hidden = false;
  listEl.innerHTML = '';

  activities.forEach((activity) => {
    const card = document.createElement('div');
    card.style.padding = 'var(--space-2)';
    card.style.marginBottom = 'var(--space-1)';
    card.style.background = 'var(--color-sage-light)';
    card.style.borderRadius = 'var(--radius-sm)';
    card.style.cursor = 'pointer';

    const groupLabel = activity.groups ? ` — ${activity.groups.name}` : '';
    const dueLabel = activity.due_at ? formatUrgencyLabel(activity.due_at, false) : 'No due date';
    card.textContent = `${activity.title}${groupLabel} (${dueLabel})`;

    card.addEventListener('click', () => {
      window.location.href = `activity-detail.html?id=${activity.id}`;
    });

    listEl.appendChild(card);
  });
}

loadTasks();
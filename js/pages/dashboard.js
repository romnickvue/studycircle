const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('dashboard-content');
const greetingEl = document.getElementById('greeting');

const overdueSection = document.getElementById('overdue-section');
const overdueList = document.getElementById('overdue-list');
const todayList = document.getElementById('today-list');
const soonList = document.getElementById('soon-list');
const allCaughtUpEl = document.getElementById('all-caught-up');

const groupsListEl = document.getElementById('groups-list');
const noGroupsEl = document.getElementById('no-groups-state');

function buildActivityCard(activity) {
  const card = document.createElement('div');
  card.style.padding = 'var(--space-1)';
  card.style.cursor = 'pointer';
  const groupLabel = activity.groups ? ` — ${activity.groups.name}` : '';
  card.textContent = `${activity.title}${groupLabel}`;
  card.addEventListener('click', () => {
    window.location.href = `activity-detail.html?id=${activity.id}`;
  });
  return card;
}

async function loadDashboard() {
  const { session } = await AuthService.getSession();
  const name = session.user.user_metadata?.display_name || 'there';
  greetingEl.textContent = `Hi, ${name}!`;

  const { activities } = await ActivitiesService.listMine();
  const { groups } = await GroupsService.listMine();

  loadingEl.hidden = true;
  contentEl.hidden = false;

  const withDueDate = activities.filter((a) => a.due_at);

  const overdue = [];
  const today = [];
  const soon = [];

  withDueDate.forEach((activity) => {
    const status = getUrgencyStatus(activity.due_at, false);
    if (status === 'OVERDUE') overdue.push(activity);
    else if (status === 'DUE_TODAY' || status === 'DUE_TOMORROW') today.push(activity);
    else soon.push(activity);
  });

  overdueList.innerHTML = '';
  todayList.innerHTML = '';
  soonList.innerHTML = '';

  if (overdue.length > 0) {
    overdueSection.hidden = false;
    overdue.forEach((a) => overdueList.appendChild(buildActivityCard(a)));
  } else {
    overdueSection.hidden = true;
  }

  today.forEach((a) => todayList.appendChild(buildActivityCard(a)));
  soon.forEach((a) => soonList.appendChild(buildActivityCard(a)));

  if (overdue.length === 0 && today.length === 0 && soon.length === 0) {
    allCaughtUpEl.hidden = false;
  } else {
    allCaughtUpEl.hidden = true;
  }

  groupsListEl.innerHTML = '';

  if (groups.length === 0) {
    noGroupsEl.hidden = false;
  } else {
    noGroupsEl.hidden = true;
    groups.forEach((group) => {
      const card = document.createElement('div');
      card.textContent = group.name;
      card.style.cursor = 'pointer';
      card.style.padding = 'var(--space-2)';
      card.style.marginBottom = 'var(--space-1)';
      card.style.background = 'var(--color-sage-light)';
      card.style.borderRadius = 'var(--radius-sm)';
      card.addEventListener('click', () => {
        window.location.href = `group-overview.html?id=${group.id}`;
      });
      groupsListEl.appendChild(card);
    });
  }
}

document.getElementById('create-group-btn').addEventListener('click', () => {
  window.location.href = 'groups.html';
});

loadDashboard();
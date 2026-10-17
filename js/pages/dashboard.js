const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('dashboard-content');
const greetingEl = document.getElementById('greeting');

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

  const thisWeekActivities = activities.filter((a) => a.due_at && isWithinCurrentWeek(a.due_at));
  const activityIds = thisWeekActivities.map((a) => a.id);
  const { statusMap } = await ProgressService.getManyMine(activityIds);

  loadingEl.hidden = true;
  contentEl.hidden = false;

  const todayList2 = [];
  const soon = [];
  const completed = [];
  const overdue = [];

  thisWeekActivities.forEach((activity) => {
    const status = statusMap[activity.id] || 'NOT_STARTED';

    if (status === 'COMPLETED') {
      completed.push(activity);
      return;
    }

    const urgency = getUrgencyStatus(activity.due_at, false);

    if (urgency === 'OVERDUE') overdue.push(activity);
    else if (urgency === 'DUE_TODAY') todayList2.push(activity);
    else soon.push(activity);
  });

  todayList.innerHTML = '';
  soonList.innerHTML = '';
  document.getElementById('completed-list').innerHTML = '';
  overdueList.innerHTML = '';

  todayList2.forEach((a) => todayList.appendChild(buildActivityCard(a)));
  soon.forEach((a) => soonList.appendChild(buildActivityCard(a)));
  completed.forEach((a) => document.getElementById('completed-list').appendChild(buildActivityCard(a)));
  overdue.forEach((a) => overdueList.appendChild(buildActivityCard(a)));

  if (todayList2.length === 0 && soon.length === 0 && completed.length === 0 && overdue.length === 0) {
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
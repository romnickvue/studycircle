const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('tasks-content');
const todayList = document.getElementById('today-list');
const soonList = document.getElementById('soon-list');
const completedList = document.getElementById('completed-list');
const overdueList = document.getElementById('overdue-list');
const allCaughtUpEl = document.getElementById('all-caught-up');

async function loadTasks() {
  const { activities, error } = await ActivitiesService.listMine();

  if (error) {
    loadingEl.hidden = true;
    return;
  }

  const thisWeekActivities = activities.filter((a) => a.due_at && isWithinCurrentWeek(a.due_at));
  const activityIds = thisWeekActivities.map((a) => a.id);
  const { statusMap } = await ProgressService.getManyMine(activityIds);

  loadingEl.hidden = true;
  contentEl.hidden = false;

  const today = [];
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
    else if (urgency === 'DUE_TODAY') today.push(activity);
    else soon.push(activity);
  });

  document.getElementById('stat-today').textContent = today.length;
  document.getElementById('stat-soon').textContent = soon.length;
  document.getElementById('stat-completed').textContent = completed.length;

  document.getElementById('today-count').textContent = today.length;
  document.getElementById('soon-count').textContent = soon.length;
  document.getElementById('completed-count').textContent = completed.length;
  document.getElementById('overdue-count').textContent = overdue.length;

  todayList.innerHTML = '';
  soonList.innerHTML = '';
  completedList.innerHTML = '';
  overdueList.innerHTML = '';

  today.forEach((a) => todayList.appendChild(buildActivityCard(a, { showGroup: true, neo: true, sectionBorder: 'today', onStatusChange: loadTasks })));
  soon.forEach((a) => soonList.appendChild(buildActivityCard(a, { showGroup: true, neo: true, sectionBorder: 'soon', onStatusChange: loadTasks })));
  completed.forEach((a) => completedList.appendChild(buildActivityCard(a, { showGroup: true, isCompleted: true, neo: true, sectionBorder: 'completed', onStatusChange: loadTasks })));
  overdue.forEach((a) => overdueList.appendChild(buildActivityCard(a, { showGroup: true, neo: true, sectionBorder: 'overdue', onStatusChange: loadTasks })));

  if (today.length === 0 && soon.length === 0 && completed.length === 0 && overdue.length === 0) {
    allCaughtUpEl.hidden = false;
  } else {
    allCaughtUpEl.hidden = true;
  }
}

const personalLists = {
  overdue: document.getElementById('p-overdue-list'),
  today: document.getElementById('p-today-list'),
  soon: document.getElementById('p-soon-list'),
  completed: document.getElementById('p-completed-list')
};

async function loadPersonalTasks() {
  const { activities, error } = await ActivitiesService.listPersonal();

  if (error) {
    showToast('Could not load personal tasks.', 'error');
    return;
  }

  const { statusMap } = await ProgressService.getManyMine(activities.map((a) => a.id));

  const buckets = { overdue: [], today: [], soon: [], completed: [] };

  activities.forEach((a) => {
    const done = ((statusMap || {})[a.id] || 'NOT_STARTED') === 'COMPLETED';

    if (done) {
      if (a.due_at && isWithinCurrentWeek(a.due_at)) buckets.completed.push(a);
      return;
    }

    if (!a.due_at) {
      buckets.soon.push(a);
      return;
    }

    const urgency = getUrgencyStatus(a.due_at, false);
    if (urgency === 'OVERDUE') buckets.overdue.push(a);
    else if (urgency === 'DUE_TODAY') buckets.today.push(a);
    else buckets.soon.push(a);
  });

  const byDue = (x, y) => new Date(x.due_at || 0) - new Date(y.due_at || 0);
  buckets.overdue.sort(byDue);
  buckets.today.sort(byDue);
  buckets.soon.sort(byDue);
  buckets.completed.sort((x, y) => byDue(y, x));

  let total = 0;

  Object.keys(buckets).forEach((key) => {
    const listEl = personalLists[key];
    listEl.innerHTML = '';

    buckets[key].forEach((a) => {
      listEl.appendChild(buildActivityCard(a, {
        neo: true,
        isCompleted: key === 'completed',
        sectionBorder: key,
        onStatusChange: loadPersonalTasks
      }));
    });

    total += buckets[key].length;
    document.getElementById(`p-${key}-count`).textContent = buckets[key].length;
    document.getElementById(`p-${key}-section`).hidden = buckets[key].length === 0;
  });

  document.getElementById('personal-empty').hidden = total > 0;
}

document.querySelectorAll('.view-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const view = pill.dataset.view;
    document.querySelectorAll('.view-pill').forEach((p) => p.classList.toggle('active', p === pill));
    document.getElementById('group-tasks-view').hidden = view !== 'group';
    document.getElementById('personal-tasks-view').hidden = view !== 'personal';
  });
});

document.getElementById('add-personal-btn').addEventListener('click', () => {
  showToast('Add Task coming soon!');
});

loadTasks();
loadPersonalTasks();

loadTasks();
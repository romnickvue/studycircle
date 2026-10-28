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

document.getElementById('add-task-btn').addEventListener('click', () => {
  showToast('Add Task coming soon!');
});

loadTasks();
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

  todayList.innerHTML = '';
  soonList.innerHTML = '';
  completedList.innerHTML = '';
  overdueList.innerHTML = '';

  today.forEach((a) => todayList.appendChild(buildActivityCard(a, { showGroup: true })));
  soon.forEach((a) => soonList.appendChild(buildActivityCard(a, { showGroup: true })));
  completed.forEach((a) => document.getElementById('completed-list').appendChild(buildActivityCard(a, { showGroup: true, isCompleted: true })));
  overdue.forEach((a) => overdueList.appendChild(buildActivityCard(a, { showGroup: true })));

  if (today.length === 0 && soon.length === 0 && completed.length === 0 && overdue.length === 0) {
    allCaughtUpEl.hidden = false;
  } else {
    allCaughtUpEl.hidden = true;
  }
}

loadTasks();
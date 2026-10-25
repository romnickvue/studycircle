const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('dashboard-content');
const greetingEl = document.getElementById('greeting-name');

const overdueList = document.getElementById('overdue-list');
const todayList = document.getElementById('today-list');
const soonList = document.getElementById('soon-list');
const allCaughtUpEl = document.getElementById('all-caught-up');

const groupsListEl = document.getElementById('groups-list');
const noGroupsEl = document.getElementById('no-groups-state');


async function loadDashboard() {
  const { session } = await AuthService.getSession();

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('display_name')
    .eq('id', session.user.id)
    .single();

  const name = profile?.display_name
    || session.user.user_metadata?.display_name
    || 'there';
  greetingEl.textContent = `${name}!`;

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

  todayList2.forEach((a) => todayList.appendChild(buildActivityCard(a, { showGroup: true, neo: true, sectionBorder: 'today' })));
  soon.forEach((a) => soonList.appendChild(buildActivityCard(a, { showGroup: true, neo: true, sectionBorder: 'soon' })));
  completed.forEach((a) => document.getElementById('completed-list').appendChild(buildActivityCard(a, { showGroup: true, isCompleted: true, neo: true, sectionBorder: 'completed' })));
  overdue.forEach((a) => overdueList.appendChild(buildActivityCard(a, { showGroup: true, neo: true, sectionBorder: 'overdue' })));

  document.getElementById('today-section').hidden = todayList2.length === 0;
  document.getElementById('soon-section').hidden = soon.length === 0;
  document.getElementById('completed-section').hidden = completed.length === 0;
  document.getElementById('overdue-section').hidden = overdue.length === 0;
  
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

    for (const group of groups) {
      const { count: memberCount } = await GroupsService.getMemberCount(group.id);
      const { count: activeCount } = await ActivitiesService.countThisWeek(group.id);
      groupsListEl.appendChild(buildGroupCard(group, { neo: true, memberCount, activeCount }));
    }
  }
}

loadDashboard();
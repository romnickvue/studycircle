const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);
document.getElementById('add-subject-link').href = `subjects.html?id=${groupId}&add=1`;
document.getElementById('add-activity-link').href = `activities.html?id=${groupId}&add=1`;

const loadingEl = document.getElementById('loading-state');
const headerEl = document.getElementById('group-header');
const nameEl = document.getElementById('group-name');
const descriptionEl = document.getElementById('group-description');

async function loadGroup() {
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { group, error } = await GroupsService.getById(groupId);

  loadingEl.hidden = true;

  if (error || !group) {
    window.location.href = 'unauthorized.html';
    return;
  }

  nameEl.textContent = group.name;
  descriptionEl.textContent = group.description || '';
  const icon = (group.icon_name || 'people').replace(/^bi-/, '');
  document.getElementById('group-icon').className = `bi bi-${icon}`;

  const { count } = await GroupsService.getMemberCount(groupId);
  document.getElementById('group-member-count').textContent =
    `${count} ${count === 1 ? 'member' : 'members'}`;

  const { session } = await AuthService.getSession();

  const { data: membership } = await supabaseClient
    .from('group_memberships')
    .select('joined_at')
    .eq('group_id', groupId)
    .eq('user_id', session.user.id)
    .single();

  if (membership?.joined_at) {
    document.getElementById('group-joined').textContent =
      new Date(membership.joined_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
  }
  headerEl.hidden = false;

  loadSubjects();
  loadActivities();
}

const subjectsSection = document.getElementById('subjects-section');
const subjectsListEl = document.getElementById('subjects-list');
const subjectsEmptyEl = document.getElementById('subjects-empty');

async function loadSubjects() {
  const { subjects, error } = await SubjectsService.listByGroup(groupId);

  if (error) {
    showToast('Could not load subjects.', 'error');
    return;
  }

  const { activities: allActs } = await ActivitiesService.listByGroup(groupId);
  const countBySubject = {};
  (allActs || []).forEach((a) => {
    if (a.subject_id) countBySubject[a.subject_id] = (countBySubject[a.subject_id] || 0) + 1;
  });

  subjectsListEl.innerHTML = '';

  if (subjects.length === 0) {
    subjectsEmptyEl.hidden = false;
  } else {
    subjectsEmptyEl.hidden = true;
      subjects.forEach((subject) => {
      const count = countBySubject[subject.id] || 0;

      const item = document.createElement('a');
      item.className = 'subject-card-row';
      item.href = `subjects.html?id=${groupId}`;
      item.innerHTML = `
        <span class="subject-icon-tile"><i class="bi bi-journal-bookmark"></i></span>
        <span class="subject-info">
          <span class="subject-name"></span>
          <span class="subject-code"></span>
        </span>
        <span class="subject-count-pill"></span>
        <i class="bi bi-chevron-right"></i>`;

      item.querySelector('.subject-name').textContent = subject.name;
      item.querySelector('.subject-code').textContent = subject.code || 'No code';
      item.querySelector('.subject-count-pill').textContent =
        `${count} ${count === 1 ? 'task' : 'tasks'}`;
      subjectsListEl.appendChild(item);
    });
  }

  subjectsSection.hidden = false;
}

const activitiesEmptyEl = document.getElementById('activities-empty');

async function loadActivities() {
  const { activities, error } = await ActivitiesService.listByGroup(groupId);

  if (error) {
    showToast('Could not load activities.', 'error');
    return;
  }

  const thisWeekActivities = activities.filter((a) => a.due_at && isWithinCurrentWeek(a.due_at));
  const activityIds = thisWeekActivities.map((a) => a.id);
  const { statusMap } = await ProgressService.getManyMine(activityIds);

  const todayArr = [];
  const soonArr = [];
  const completedArr = [];
  const overdueArr = [];

  thisWeekActivities.forEach((activity) => {
    const status = statusMap[activity.id] || 'NOT_STARTED';

    if (status === 'COMPLETED') {
      completedArr.push(activity);
      return;
    }

    const urgency = getUrgencyStatus(activity.due_at, false);

    if (urgency === 'OVERDUE') overdueArr.push(activity);
    else if (urgency === 'DUE_TODAY') todayArr.push(activity);
    else soonArr.push(activity);
  });

  const todayListEl = document.getElementById('today-list');
  const soonListEl = document.getElementById('soon-list');
  const completedListEl = document.getElementById('completed-list');
  const overdueListEl = document.getElementById('overdue-list');

  todayListEl.innerHTML = '';
  soonListEl.innerHTML = '';
  completedListEl.innerHTML = '';
  overdueListEl.innerHTML = '';

  todayArr.forEach((a) => todayListEl.appendChild(buildActivityCard(a, { showSubject: true, neo: true, sectionBorder: 'today' })));
  soonArr.forEach((a) => soonListEl.appendChild(buildActivityCard(a, { showSubject: true, neo: true, sectionBorder: 'soon' })));
  completedArr.forEach((a) => completedListEl.appendChild(buildActivityCard(a, { showSubject: true, isCompleted: true, neo: true, sectionBorder: 'completed' })));
  overdueArr.forEach((a) => overdueListEl.appendChild(buildActivityCard(a, { showSubject: true, neo: true, sectionBorder: 'overdue' })));

  document.getElementById('today-section').hidden = todayArr.length === 0;
  document.getElementById('soon-section').hidden = soonArr.length === 0;
  document.getElementById('completed-section').hidden = completedArr.length === 0;
  document.getElementById('overdue-section').hidden = overdueArr.length === 0;

  const totalShown = todayArr.length + soonArr.length + completedArr.length + overdueArr.length;
  activitiesEmptyEl.hidden = totalShown > 0;

  activitiesEmptyEl.hidden = activities.length > 0;
}


// These run last, after everything above has been declared
loadGroup();
const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

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

  subjectsListEl.innerHTML = '';

  if (subjects.length === 0) {
    subjectsEmptyEl.hidden = false;
  } else {
    subjectsEmptyEl.hidden = true;
    subjects.forEach((subject) => {
      const item = document.createElement('div');
      item.style.padding = 'var(--space-1)';
      item.textContent = subject.code ? `${subject.name} (${subject.code})` : subject.name;
      subjectsListEl.appendChild(item);
    });
  }

  subjectsSection.hidden = false;
}

const activitiesEmptyEl = document.getElementById('activities-empty');
const activityForm = document.getElementById('activity-form');
const activityError = document.getElementById('activity-error');
const activitySubjectSelect = document.getElementById('activity-subject');

async function populateSubjectDropdown() {
  const { subjects } = await SubjectsService.listByGroup(groupId);
  activitySubjectSelect.innerHTML = '<option value="">— None —</option>';
  subjects.forEach((subject) => {
    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = subject.name;
    activitySubjectSelect.appendChild(option);
  });
}

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

  todayArr.forEach((a) => todayListEl.appendChild(buildActivityCard(a, { showSubject: true })));
  soonArr.forEach((a) => soonListEl.appendChild(buildActivityCard(a, { showSubject: true })));
  completedArr.forEach((a) => completedListEl.appendChild(buildActivityCard(a, { showSubject: true })));
  overdueArr.forEach((a) => overdueListEl.appendChild(buildActivityCard(a, { showSubject: true })));

  activitiesEmptyEl.hidden = activities.length > 0;
}

document.getElementById('add-activity-btn').addEventListener('click', async () => {
  await populateSubjectDropdown();
  openModal('activity-modal');
});

activityForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  activityError.hidden = true;

  const title = document.getElementById('activity-title').value.trim();
  const activityType = document.getElementById('activity-type').value;
  const subjectId = activitySubjectSelect.value;
  const dueDateOnly = document.getElementById('activity-due').value;

  const submitButton = activityForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = await ActivitiesService.create(groupId, {
    subjectId,
    title,
    activityType,
    dueAt: dueDateOnly ? endOfDayManila(dueDateOnly) : null
  });

  submitButton.disabled = false;

  if (error) {
    activityError.textContent = error.message;
    activityError.hidden = false;
    return;
  }

  closeModal('activity-modal');
  activityForm.reset();
  showToast('Activity created.');
  loadActivities();
});

// These run last, after everything above has been declared
loadGroup();
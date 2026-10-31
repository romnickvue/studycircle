const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const panelEl = document.getElementById('tasks-panel');
const emptyEl = document.getElementById('activities-empty');
const activityForm = document.getElementById('activity-form');
const activityError = document.getElementById('activity-error');
const activitySubjectSelect = document.getElementById('activity-subject');

let editingActivityId = null;
let myUserId = null;
let canManageAll = false;

function manilaYearMonth(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(new Date(date));
  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  return `${year}-${month}`;
}

function isWithinCurrentMonth(dueAt) {
  if (manilaYearMonth(dueAt) === manilaYearMonth(new Date())) return true;
  // Also keep anything due within a week of today, so month boundaries never hide a task
  return isWithinCurrentWeek(dueAt);
}

document.getElementById('month-label').textContent = new Date().toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Manila'
});

async function openAddActivityModal(presetSubjectId) {
  editingActivityId = null;
  activityForm.reset();
  document.querySelector('#activity-modal h3').textContent = 'New Activity';
  await populateSubjectDropdown();
  if (typeof presetSubjectId === 'string' && presetSubjectId) {
    activitySubjectSelect.value = presetSubjectId;
  }
  openModal('activity-modal');
}

async function openEditActivityModal(activity) {
  editingActivityId = activity.id;
  await populateSubjectDropdown();
  document.getElementById('activity-title').value = activity.title;
  document.getElementById('activity-type').value = activity.activity_type;
  activitySubjectSelect.value = activity.subject_id || '';
  document.getElementById('activity-due').value = activity.due_at ? activity.due_at.split('T')[0] : '';
  document.querySelector('#activity-modal h3').textContent = 'Edit Activity';
  openModal('activity-modal');
}

async function handleDeleteActivity(activityId) {
  confirmAction('Delete this activity?', async () => {
    const { error } = await ActivitiesService.remove(activityId);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Activity deleted.');
    loadActivities();
  });
}

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

function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown').forEach((m) => { m.hidden = true; });
}

document.addEventListener('click', closeAllMenus);

function buildTaskRow(activity, isCompleted) {
  const row = document.createElement('div');
  row.className = 'task-row';

  const urgency = isCompleted ? 'COMPLETED' : (activity.due_at ? getUrgencyStatus(activity.due_at, false) : '');
  const dueLabel = activity.due_at ? formatUrgencyLabel(activity.due_at, isCompleted) : 'No due date';

  let borderKey = 'soon';
  if (!activity.due_at) borderKey = 'nodate';
  else if (isCompleted) borderKey = 'completed';
  else if (urgency === 'OVERDUE') borderKey = 'overdue';
  else if (urgency === 'DUE_TODAY') borderKey = 'today';
  row.classList.add(`border-${borderKey}`);

  row.innerHTML = `
    <div class="task-icon"><i class="bi bi-check2-square"></i></div>
    <div class="task-main">
      <p class="task-title"></p>
      <p class="task-subject"></p>
    </div>
    <span class="task-due"></span>
    <div class="subject-menu">
      <button type="button" class="menu-btn" aria-label="Task options"><i class="bi bi-three-dots"></i></button>
      <div class="menu-dropdown" hidden>
        <button type="button" class="menu-item" data-action="edit"><i class="bi bi-pencil"></i> Edit Task</button>
        <button type="button" class="menu-item menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Remove Task</button>
      </div>
    </div>`;

  row.querySelector('.task-title').textContent = activity.title;
  row.querySelector('.task-subject').textContent = activity.subjects ? activity.subjects.name : 'No subject';

  const dueEl = row.querySelector('.task-due');
  dueEl.textContent = dueLabel;
  if (urgency === 'OVERDUE') dueEl.classList.add('task-due-overdue');
  if (urgency === 'COMPLETED') dueEl.classList.add('task-due-done');

  const dropdown = row.querySelector('.menu-dropdown');
  const canManage = canManageAll || activity.created_by === myUserId;
  if (!canManage) {
    row.querySelector('.subject-menu').remove();
    return row;
  }

  row.querySelector('.menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const wasHidden = dropdown.hidden;
    closeAllMenus();
    dropdown.hidden = !wasHidden;
  });

  row.querySelector('[data-action="edit"]').addEventListener('click', () => {
    closeAllMenus();
    openEditActivityModal(activity);
  });

  row.querySelector('[data-action="delete"]').addEventListener('click', () => {
    closeAllMenus();
    handleDeleteActivity(activity.id);
  });

  return row;
}

async function loadActivities() {
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { activities, error } = await ActivitiesService.listByGroup(groupId);

  loadingEl.hidden = true;

  if (error) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { session } = await AuthService.getSession();
  myUserId = session.user.id;

  const { data: membership } = await supabaseClient
    .from('group_memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', myUserId)
    .maybeSingle();

  canManageAll = membership?.role === 'ADMIN';

  const thisMonth = activities.filter((a) => a.due_at && isWithinCurrentMonth(a.due_at));
  const noDate = activities
    .filter((a) => !a.due_at)
    .sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
  const { statusMap } = await ProgressService.getManyMine(thisMonth.map((a) => a.id));

  const overdue = [];
  const pending = [];
  const completed = [];

  thisMonth.forEach((activity) => {
    const status = (statusMap || {})[activity.id] || 'NOT_STARTED';

    if (status === 'COMPLETED') {
      completed.push(activity);
      return;
    }

    if (getUrgencyStatus(activity.due_at, false) === 'OVERDUE') overdue.push(activity);
    else pending.push(activity);
  });

  const byDueAsc = (a, b) => new Date(a.due_at) - new Date(b.due_at);
  overdue.sort(byDueAsc);
  pending.sort(byDueAsc);
  completed.sort((a, b) => new Date(b.due_at) - new Date(a.due_at));

  const fill = (listId, items, isCompleted) => {
    const listEl = document.getElementById(listId);
    listEl.innerHTML = '';
    items.forEach((a) => listEl.appendChild(buildTaskRow(a, isCompleted)));
  };

  fill('overdue-list', overdue, false);
  fill('pending-list', pending, false);
  fill('completed-list', completed, true);
  fill('nodate-list', noDate, false);
  document.getElementById('nodate-count').textContent = noDate.length;
  document.getElementById('nodate-section').hidden = noDate.length === 0;

  document.getElementById('overdue-count').textContent = overdue.length;
  document.getElementById('pending-count').textContent = pending.length;
  document.getElementById('completed-count').textContent = completed.length;

  document.getElementById('overdue-section').hidden = overdue.length === 0;
  document.getElementById('pending-section').hidden = pending.length === 0;
  document.getElementById('completed-section').hidden = completed.length === 0;

  emptyEl.hidden = thisMonth.length > 0 || noDate.length > 0;
  panelEl.hidden = false;
}

document.getElementById('add-activity-btn').addEventListener('click', openAddActivityModal);

activityForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  activityError.hidden = true;

  const title = document.getElementById('activity-title').value.trim();
  const activityType = document.getElementById('activity-type').value;
  const subjectId = activitySubjectSelect.value;
  const dueDateOnly = document.getElementById('activity-due').value;
  const dueAt = dueDateOnly ? endOfDayManila(dueDateOnly) : null;

  const submitButton = activityForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  let result;
  if (editingActivityId) {
    result = await ActivitiesService.update(editingActivityId, { subjectId, title, activityType, dueAt });
  } else {
    result = await ActivitiesService.create(groupId, { subjectId, title, activityType, dueAt });
  }

  submitButton.disabled = false;

  if (result.error) {
    activityError.textContent = result.error.message;
    activityError.hidden = false;
    return;
  }

  if (editingActivityId && !result.updated) {
    activityError.textContent = 'You do not have permission to edit this activity.';
    activityError.hidden = false;
    return;
  }

  closeModal('activity-modal');
  activityForm.reset();
  showToast(editingActivityId ? 'Activity updated.' : 'Activity created.');
  loadActivities();
});

loadActivities();

if (params.get('add') === '1') {
  openAddActivityModal(params.get('subject'));
  history.replaceState(null, '', `${window.location.pathname}?id=${groupId}`);
}
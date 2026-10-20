const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const listEl = document.getElementById('activities-list');
const emptyEl = document.getElementById('activities-empty');
const activityForm = document.getElementById('activity-form');
const activityError = document.getElementById('activity-error');
const activitySubjectSelect = document.getElementById('activity-subject');

let editingActivityId = null;

async function openAddActivityModal() {
  editingActivityId = null;
  activityForm.reset();
  document.querySelector('#activity-modal h3').textContent = 'New Activity';
  await populateSubjectDropdown();
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

  listEl.innerHTML = '';

  if (activities.length === 0) {
    emptyEl.hidden = false;
    listEl.hidden = true;
  } else {
    emptyEl.hidden = true;
    listEl.hidden = false;

        activities.forEach((activity) => {
      const card = document.createElement('div');
      card.style.padding = 'var(--space-2)';
      card.style.marginBottom = 'var(--space-1)';
      card.style.background = 'var(--color-sage-light)';
      card.style.borderRadius = 'var(--radius-sm)';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';

      const label = document.createElement('span');
      label.style.cursor = 'pointer';
      const subjectLabel = activity.subjects ? ` — ${activity.subjects.name}` : '';
      const dueLabel = activity.due_at ? formatUrgencyLabel(activity.due_at, false) : 'No due date';
      label.textContent = `${activity.title}${subjectLabel} (${dueLabel})`;
      label.addEventListener('click', () => {
        window.location.href = `activity-detail.html?id=${activity.id}`;
      });

      const actions = document.createElement('span');

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn-secondary';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditActivityModal(activity);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn-destructive';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteActivity(activity.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      card.appendChild(label);
      card.appendChild(actions);
      listEl.appendChild(card);
    });
  }
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
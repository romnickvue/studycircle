const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');

const loadingEl = document.getElementById('loading-state');
const listEl = document.getElementById('activities-list');
const emptyEl = document.getElementById('activities-empty');
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
      card.style.cursor = 'pointer';

      const subjectLabel = activity.subjects ? ` — ${activity.subjects.name}` : '';
      const dueLabel = activity.due_at ? formatUrgencyLabel(activity.due_at, false) : 'No due date';
      card.textContent = `${activity.title}${subjectLabel} (${dueLabel})`;

      card.addEventListener('click', () => {
        window.location.href = `activity-detail.html?id=${activity.id}`;
      });

      listEl.appendChild(card);
    });
  }
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

loadActivities();
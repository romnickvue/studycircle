const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');

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

  document.querySelector('a[href="members.html"]').href = `members.html?id=${groupId}`;
  document.querySelector('a[href="group-settings.html"]').href = `group-settings.html?id=${groupId}`;
}

const generateBtn = document.getElementById('generate-invite-btn');
const activeInviteEl = document.getElementById('active-invite');
const linkTextEl = document.getElementById('invite-link-text');
const expiryTextEl = document.getElementById('invite-expiry-text');

function buildInviteUrl(code) {
  return `${window.location.origin}/pages/accept-invitation.html?code=${code}`;
}

async function loadActiveInvite() {
  const { invitation, error } = await InvitationsService.getActive(groupId);

  if (error || !invitation) {
    activeInviteEl.hidden = true;
    return;
  }

  linkTextEl.textContent = buildInviteUrl(invitation.code);
  expiryTextEl.textContent = new Date(invitation.expires_at).toLocaleString();
  activeInviteEl.hidden = false;
}

async function handleGenerateOrRegenerate() {
  const { code, error } = await InvitationsService.generate(groupId);

  if (error) {
    showToast(error.message, 'error');
    return;
  }

  showToast('Invitation link generated.');
  loadActiveInvite();
}

generateBtn.addEventListener('click', handleGenerateOrRegenerate);

document.getElementById('regenerate-invite-btn').addEventListener('click', () => {
  confirmAction('Regenerating will invalidate the current link for anyone still holding it. Continue?', handleGenerateOrRegenerate);
});

document.getElementById('copy-invite-btn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(linkTextEl.textContent);
  showToast('Link copied.');
});

loadActiveInvite();
loadGroup();

const subjectsSection = document.getElementById('subjects-section');
const subjectsListEl = document.getElementById('subjects-list');
const subjectsEmptyEl = document.getElementById('subjects-empty');
const subjectForm = document.getElementById('subject-form');
const subjectError = document.getElementById('subject-error');

let editingSubjectId = null;

function openAddSubjectModal() {
  editingSubjectId = null;
  subjectForm.reset();
  document.querySelector('#subject-modal h3').textContent = 'Add Subject';
  openModal('subject-modal');
}

function openEditSubjectModal(subject) {
  editingSubjectId = subject.id;
  document.getElementById('subject-name').value = subject.name;
  document.getElementById('subject-code').value = subject.code || '';
  document.querySelector('#subject-modal h3').textContent = 'Edit Subject';
  openModal('subject-modal');
}

async function handleDeleteSubject(subjectId) {
  confirmAction('Delete this subject?', async () => {
    const { error } = await SubjectsService.remove(subjectId);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Subject deleted.');
    loadSubjects();
  });
}

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
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = 'var(--space-1)';

      const label = document.createElement('span');
      label.textContent = subject.code ? `${subject.name} (${subject.code})` : subject.name;

      const actions = document.createElement('span');

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openEditSubjectModal(subject));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn-destructive';
      deleteBtn.addEventListener('click', () => handleDeleteSubject(subject.id));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(label);
      item.appendChild(actions);
      subjectsListEl.appendChild(item);
    });
  }

  subjectsSection.hidden = false;
}

document.getElementById('add-subject-btn').addEventListener('click', openAddSubjectModal);

subjectForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  subjectError.hidden = true;

  const name = document.getElementById('subject-name').value.trim();
  const code = document.getElementById('subject-code').value.trim();

  const submitButton = subjectForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = editingSubjectId
    ? await SubjectsService.update(editingSubjectId, name, code, null)
    : await SubjectsService.create(groupId, name, code, null);

  submitButton.disabled = false;

  if (error) {
    subjectError.textContent = error.message;
    subjectError.hidden = false;
    return;
  }

  closeModal('subject-modal');
  subjectForm.reset();
  showToast(editingSubjectId ? 'Subject updated.' : 'Subject added.');
  loadSubjects();
});

const activitiesListEl = document.getElementById('activities-list');
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

  activitiesListEl.innerHTML = '';

  if (activities.length === 0) {
    activitiesEmptyEl.hidden = false;
  } else {
    activitiesEmptyEl.hidden = true;
    activities.forEach((activity) => {
      const item = document.createElement('div');
      item.style.padding = 'var(--space-1)';
      const subjectLabel = activity.subjects ? ` — ${activity.subjects.name}` : '';
      const dueLabel = activity.due_at ? formatUrgencyLabel(activity.due_at, false) : 'No due date';
      item.textContent = `${activity.title}${subjectLabel} (${dueLabel})`;
      activitiesListEl.appendChild(item);
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
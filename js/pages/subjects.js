const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
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
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { subjects, error } = await SubjectsService.listByGroup(groupId);

  loadingEl.hidden = true;

  if (error) {
    window.location.href = 'unauthorized.html';
    return;
  }

  document.getElementById('back-to-group-link').href = `group-overview.html?id=${groupId}`;

  subjectsListEl.innerHTML = '';

  if (subjects.length === 0) {
    subjectsEmptyEl.hidden = false;
    subjectsListEl.hidden = true;
  } else {
    subjectsEmptyEl.hidden = true;
    subjectsListEl.hidden = false;

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
      editBtn.className = 'btn-secondary';
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
          showToast(error.message, 'error');
          return;
        }

  closeModal('subject-modal');
  subjectForm.reset();
  showToast(editingSubjectId ? 'Subject updated.' : 'Subject added.');
  loadSubjects();
});

loadSubjects();
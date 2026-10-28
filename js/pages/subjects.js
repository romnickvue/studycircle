const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const subjectsListEl = document.getElementById('subjects-list');
const subjectsEmptyEl = document.getElementById('subjects-empty');
const subjectForm = document.getElementById('subject-form');
const subjectError = document.getElementById('subject-error');
const subjectsSectionEl = document.getElementById('subjects-section');

let editingSubjectId = null;

let allSubjects = [];
let allActivities = [];
let activityStatus = {};

function borderKeyFor(activity, isDone) {
  if (isDone) return 'completed';
  if (!activity.due_at) return 'soon';

  const urgency = getUrgencyStatus(activity.due_at, false);
  if (urgency === 'OVERDUE') return 'overdue';
  if (urgency === 'DUE_TODAY') return 'today';
  return 'soon';
}

function buildSubjectSection(title, subtitle, items, subjectId) {
  const section = document.createElement('div');
  section.className = 'neo-card group-panel subject-activity-section';
  section.innerHTML = `
    <div class="panel-header">
      <div class="neo-icon-circle"><i class="bi bi-journal-bookmark"></i></div>
      <div class="panel-heading">
        <h2></h2>
        <p class="panel-sub"></p>
      </div>
    </div>
    <div class="section-activities"></div>`;

  section.querySelector('h2').textContent = title;
  section.querySelector('.panel-sub').textContent = subtitle;

  if (subjectId) {
    const addLink = document.createElement('a');
    addLink.className = 'pill-btn';
    addLink.href = `activities.html?id=${groupId}&add=1&subject=${subjectId}`;
    addLink.innerHTML = '<i class="bi bi-plus-lg"></i> Add Activity';
    section.querySelector('.panel-header').appendChild(addLink);
  }

  const listEl = section.querySelector('.section-activities');

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'section-empty';
    empty.textContent = 'No activities yet.';
    listEl.appendChild(empty);
  } else {
    items.forEach((a) => {
      const done = activityStatus[a.id] === 'COMPLETED';
      listEl.appendChild(buildActivityCard(a, {
        showSubject: false,
        isCompleted: done,
        neo: true,
        sectionBorder: borderKeyFor(a, done),
        onStatusChange: loadSubjects
      }));
    });
  }

  return section;
}

function renderActivities() {
  const wrap = document.getElementById('activities-by-subject');
  const emptyEl = document.getElementById('activities-empty');
  wrap.innerHTML = '';

  const byDue = (a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  };

  emptyEl.hidden = allSubjects.length > 0 || allActivities.length > 0;

  allSubjects.forEach((subject) => {
    const items = allActivities.filter((a) => a.subject_id === subject.id).sort(byDue);
    const subtitle = `${subject.code || 'No code'} · ${items.length} ${items.length === 1 ? 'activity' : 'activities'}`;
    wrap.appendChild(buildSubjectSection(subject.name, subtitle, items, subject.id));
  });

  const unassigned = allActivities.filter((a) => !a.subject_id).sort(byDue);
  if (unassigned.length > 0) {
    wrap.appendChild(buildSubjectSection('No subject', 'Activities not tied to a subject', unassigned, null));
  }
}

document.querySelectorAll('.view-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const view = pill.dataset.view;
    document.querySelectorAll('.view-pill').forEach((p) => p.classList.toggle('active', p === pill));
    subjectsSectionEl.hidden = view !== 'subjects';
    document.getElementById('activities-section').hidden = view !== 'activities';
  });
});

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

function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown').forEach((m) => { m.hidden = true; });
}

document.addEventListener('click', closeAllMenus);

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

  const { activities } = await ActivitiesService.listByGroup(groupId);
  const countBySubject = {};
  (activities || []).forEach((a) => {
    if (a.subject_id) countBySubject[a.subject_id] = (countBySubject[a.subject_id] || 0) + 1;
  });

  allSubjects = subjects;
  allActivities = activities || [];
  const { statusMap } = await ProgressService.getManyMine(allActivities.map((a) => a.id));
  activityStatus = statusMap || {};
  renderActivities();
  document.getElementById('view-pills').hidden = false;

  subjectsListEl.innerHTML = '';
  subjectsSectionEl.hidden = document.querySelector('.view-pill.active').dataset.view !== 'subjects';
  subjectsEmptyEl.hidden = subjects.length > 0;

  subjects.forEach((subject) => {
    const count = countBySubject[subject.id] || 0;

    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <div class="subject-icon-tile"><i class="bi bi-journal-bookmark"></i></div>
      <div class="subject-main">
        <p class="subject-title"></p>
        <p class="subject-code-line"></p>
      </div>
      <div class="subject-stat"><i class="bi bi-list-task"></i> <span class="subject-count"></span></div>
      <div class="subject-menu">
        <button type="button" class="menu-btn" aria-label="Subject options"><i class="bi bi-three-dots"></i></button>
        <div class="menu-dropdown" hidden>
          <button type="button" class="menu-item" data-action="edit"><i class="bi bi-pencil"></i> Edit Subject</button>
          <button type="button" class="menu-item menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Remove Subject</button>
        </div>
      </div>`;

    card.querySelector('.subject-title').textContent = subject.name;
    card.querySelector('.subject-code-line').textContent = subject.code || 'No code';
    card.querySelector('.subject-count').textContent = `${count} ${count === 1 ? 'activity' : 'activities'}`;

    const dropdown = card.querySelector('.menu-dropdown');

    card.querySelector('.menu-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const wasHidden = dropdown.hidden;
      closeAllMenus();
      dropdown.hidden = !wasHidden;
    });

    card.querySelector('[data-action="edit"]').addEventListener('click', () => {
      closeAllMenus();
      openEditSubjectModal(subject);
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      closeAllMenus();
      handleDeleteSubject(subject.id);
    });

    subjectsListEl.appendChild(card);
  });
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

if (params.get('add') === '1') {
  openAddSubjectModal();
  history.replaceState(null, '', `${window.location.pathname}?id=${groupId}`);
}
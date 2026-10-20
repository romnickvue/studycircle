const loadingEl = document.getElementById('loading-state');
const gridEl = document.getElementById('groups-grid');
const emptyEl = document.getElementById('empty-state');

async function loadGroups() {
  const { groups, error } = await GroupsService.listMine();

  loadingEl.hidden = true;

  if (error) {
    gridEl.hidden = true;
    emptyEl.hidden = true;
    showToast('Could not load your groups.', 'error');
    return;
  }

  if (groups.length === 0) {
    emptyEl.hidden = false;
    gridEl.hidden = true;
    return;
  }

  gridEl.hidden = false;

  emptyEl.hidden = true;
  gridEl.innerHTML = '';

  groups.forEach((group) => {
    gridEl.appendChild(buildGroupCard(group));
  });
}

function openCreateGroupModal() {
  openModal('create-group-modal');
}

document.getElementById('create-group-btn-main').addEventListener('click', openCreateGroupModal);
document.getElementById('create-group-btn').addEventListener('click', openCreateGroupModal);

const createGroupForm = document.getElementById('create-group-form');
const createGroupError = document.getElementById('create-group-error');

createGroupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  createGroupError.hidden = true;

  const name = document.getElementById('new-group-name').value.trim();
  const description = document.getElementById('new-group-description').value.trim();

  const submitButton = createGroupForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { groupId, error } = await GroupsService.create(name, description || null);

  submitButton.disabled = false;

  if (error) {
    createGroupError.textContent = error.message;
    createGroupError.hidden = false;
    return;
  }

  closeModal('create-group-modal');
  window.location.href = `group-overview.html?id=${groupId}`;
});

loadGroups();
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
  document.getElementById('groups-count').textContent = groups.length;

  const listEl = document.getElementById('groups-list');
  listEl.innerHTML = '';

  for (const group of groups) {
    const { count: memberCount } = await GroupsService.getMemberCount(group.id);
    listEl.appendChild(buildGroupCardDetailed(group, memberCount));
  }
}

function openCreateGroupModal() {
  openModal('create-group-modal');
}

document.getElementById('create-group-btn-main').addEventListener('click', openCreateGroupModal);
document.getElementById('create-group-btn').addEventListener('click', openCreateGroupModal);
document.getElementById('join-group-btn').addEventListener('click', () => openJoinGroupModal());

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

const trashListEl = document.getElementById('trash-list');
const trashEmptyEl = document.getElementById('trash-empty');

async function loadTrash() {
  const { groups, error } = await TrashService.listGroups();

  if (error) {
    showToast('Could not load trash.', 'error');
    return;
  }

  trashListEl.innerHTML = '';
  trashEmptyEl.hidden = groups.length > 0;

  groups.forEach((group) => {
    const row = document.createElement('div');
    row.className = 'trash-row';
    row.innerHTML = `
      <span class="trash-icon"><i class="bi ${group.icon_name || 'bi-people-fill'}"></i></span>
      <span class="trash-info">
        <span class="trash-name"></span>
        <span class="trash-date"></span>
      </span>
      <span class="trash-actions">
        <button type="button" class="trash-restore">Restore</button>
        <button type="button" class="btn-destructive trash-delete">Delete</button>
      </span>`;

    row.querySelector('.trash-name').textContent = group.name;
    row.querySelector('.trash-date').textContent = `Deleted ${new Date(group.trashed_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })}`;

    const restoreBtn = row.querySelector('.trash-restore');
    restoreBtn.addEventListener('click', async () => {
      restoreBtn.disabled = true;
      const { error: restoreError } = await TrashService.restoreGroup(group.id);

      if (restoreError) {
        restoreBtn.disabled = false;
        showToast(restoreError.message, 'error');
        return;
      }

      showToast('Group restored.');
      loadTrash();
      loadGroups();
    });

    row.querySelector('.trash-delete').addEventListener('click', () => {
      confirmAction(`Permanently delete "${group.name}"? Its tasks, subjects, and members are removed for good. This cannot be undone.`, async () => {
        const { error: deleteError } = await TrashService.permanentlyDeleteGroup(group.id);

        if (deleteError) {
          showToast(deleteError.message, 'error');
          return;
        }

        showToast('Group permanently deleted.');
        loadTrash();
      });
    });

    trashListEl.appendChild(row);
  });
}

document.getElementById('open-trash-btn').addEventListener('click', async () => {
  openModal('trash-modal');
  await loadTrash();
});

loadGroups();
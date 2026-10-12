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
    const card = document.createElement('div');
    card.textContent = group.name;
    card.style.cursor = 'pointer';
    card.style.padding = 'var(--space-2)';
    card.style.marginBottom = 'var(--space-1)';
    card.style.background = 'var(--color-sage-light)';
    card.style.borderRadius = 'var(--radius-sm)';
    card.addEventListener('click', () => {
      window.location.href = `group-overview.html?id=${group.id}`;
    });
    gridEl.appendChild(card);
  });
}

function openCreateGroupPlaceholder() {
  showToast('Create Group coming next!');
}

document.getElementById('create-group-btn-main').addEventListener('click', openCreateGroupPlaceholder);
document.getElementById('create-group-btn').addEventListener('click', openCreateGroupPlaceholder);

loadGroups();
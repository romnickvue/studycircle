const resultEl = document.getElementById('result');
const listEl = document.getElementById('groups-list');

async function loadGroups() {
  const { groups, error } = await GroupsService.listMine();
  listEl.innerHTML = '';

  if (error) {
    listEl.innerHTML = `<li>Error: ${error.message}</li>`;
    return;
  }

  groups.forEach((g) => {
    const li = document.createElement('li');
    li.textContent = `${g.name} — ${g.id}`;
    listEl.appendChild(li);
  });
}

document.getElementById('create-group-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('group-name').value.trim();
  const description = document.getElementById('group-description').value.trim();

  const { groupId, error } = await GroupsService.create(name, description || null);

  if (error) {
    resultEl.textContent = `Error: ${error.message}`;
    return;
  }

  resultEl.textContent = `Created group with id: ${groupId}`;
  loadGroups();
});

loadGroups();
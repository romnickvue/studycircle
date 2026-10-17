const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const formEl = document.getElementById('settings-form');
const nameInput = document.getElementById('group-name');
const descriptionInput = document.getElementById('group-description');
const errorEl = document.getElementById('form-error');

async function loadGroup() {
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { session } = await AuthService.getSession();

  const { data: membership } = await supabaseClient
    .from('group_memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!membership || membership.role !== 'ADMIN') {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { group, error } = await GroupsService.getById(groupId);

  loadingEl.hidden = true;

  if (error || !group) {
    window.location.href = 'unauthorized.html';
    return;
  }

  nameInput.value = group.name;
  descriptionInput.value = group.description || '';
  formEl.hidden = false;
}

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  errorEl.hidden = true;

  const submitButton = formEl.querySelector('button[type="submit"]');
  submitButton.disabled = true;

    const { updated, error } = await GroupsService.update(
    groupId,
    nameInput.value.trim(),
    descriptionInput.value.trim() || null
  );

  submitButton.disabled = false;

  if (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
    return;
  }

  if (!updated) {
    showToast('You do not have permission to edit this group.', 'error');
    return;
  }

  showToast('Group settings saved.');
});

loadGroup();
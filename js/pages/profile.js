const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('profile-content');
const nameEl = document.getElementById('profile-name');
const emailEl = document.getElementById('profile-email');
const memberSinceEl = document.getElementById('profile-member-since');

async function loadProfile() {
  const { session } = await AuthService.getSession();

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('display_name')
    .eq('id', session.user.id)
    .single()
    .select('display_name, created_at');

  loadingEl.hidden = true;

  if (error || !profile) {
    nameEl.textContent = session.user.user_metadata?.display_name || 'Unknown';
  } else {
    nameEl.textContent = profile.display_name;
  }

  emailEl.textContent = session.user.email;
  const joined = profile?.created_at || session.user.created_at;
  memberSinceEl.textContent = new Date(joined).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  contentEl.hidden = false;
}

document.getElementById('sign-out-btn').addEventListener('click', async () => {
  await AuthService.signOut();
  window.location.href = 'sign-in.html';
});

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editInput = document.getElementById('edit-display-name');
const editError = document.getElementById('edit-error');
const editSaveBtn = document.getElementById('edit-save-btn');

function closeEditModal() {
  editModal.hidden = true;
}

document.getElementById('edit-info-btn').addEventListener('click', () => {
  editInput.value = nameEl.textContent;
  editError.hidden = true;
  editModal.hidden = false;
  editInput.focus();
});

document.getElementById('edit-close-btn').addEventListener('click', closeEditModal);

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = editInput.value.trim();

  if (!newName) {
    editError.textContent = 'Display name cannot be empty.';
    editError.hidden = false;
    return;
  }

  editSaveBtn.disabled = true;
  const { session } = await AuthService.getSession();

  const { error } = await supabaseClient
    .from('profiles')
    .update({ display_name: newName })
    .eq('id', session.user.id);

  editSaveBtn.disabled = false;

  if (error) {
    editError.textContent = 'Could not save. Please try again.';
    editError.hidden = false;
    return;
  }

  nameEl.textContent = newName;
  closeEditModal();
});

loadProfile();
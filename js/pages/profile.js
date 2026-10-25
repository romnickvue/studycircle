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

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = type === 'error' ? 'toast toast-error' : 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

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
  showToast('Name updated successfully!');
});

const passwordModal = document.getElementById('password-modal');
const passwordForm = document.getElementById('password-form');
const passwordError = document.getElementById('password-error');
const passwordSaveBtn = document.getElementById('password-save-btn');

function closePasswordModal() {
  passwordModal.hidden = true;
  passwordForm.reset();
  passwordError.hidden = true;
}

function showPasswordError(message) {
  passwordError.textContent = message;
  passwordError.hidden = false;
}

document.getElementById('change-password-btn').addEventListener('click', () => {
  passwordModal.hidden = false;
  document.getElementById('current-password').focus();
});

document.getElementById('password-close-btn').addEventListener('click', closePasswordModal);

passwordModal.addEventListener('click', (e) => {
  if (e.target === passwordModal) closePasswordModal();
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  passwordError.hidden = true;

  const current = document.getElementById('current-password').value;
  const next = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;

  if (next.length < 8) {
    showPasswordError('New password must be at least 8 characters.');
    return;
  }
  if (next !== confirm) {
    showPasswordError('New passwords do not match.');
    return;
  }
  if (next === current) {
    showPasswordError('New password must be different from your current one.');
    return;
  }

  passwordSaveBtn.disabled = true;
  const { session } = await AuthService.getSession();

  // Verify the current password first
  const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
    email: session.user.email,
    password: current
  });

  if (verifyError) {
    passwordSaveBtn.disabled = false;
    showPasswordError('Current password is incorrect.');
    return;
  }

  const { error: updateError } = await supabaseClient.auth.updateUser({ password: next });
  passwordSaveBtn.disabled = false;

  if (updateError) {
    showPasswordError('Could not update password. Please try again.');
    return;
  }

  closePasswordModal();
  showToast('Password updated successfully.');
});

loadProfile();
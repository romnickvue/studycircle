const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('profile-content');
const nameEl = document.getElementById('profile-name');
const emailEl = document.getElementById('profile-email');

async function loadProfile() {
  const { session } = await AuthService.getSession();

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('display_name')
    .eq('id', session.user.id)
    .single();

  loadingEl.hidden = true;

  if (error || !profile) {
    nameEl.textContent = session.user.user_metadata?.display_name || 'Unknown';
  } else {
    nameEl.textContent = profile.display_name;
  }

  emailEl.textContent = session.user.email;
  contentEl.hidden = false;
}

document.getElementById('sign-out-btn').addEventListener('click', async () => {
  await AuthService.signOut();
  window.location.href = 'sign-in.html';
});

loadProfile();
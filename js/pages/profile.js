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

loadProfile();
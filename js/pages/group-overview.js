const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');

const loadingEl = document.getElementById('loading-state');
const headerEl = document.getElementById('group-header');
const nameEl = document.getElementById('group-name');
const descriptionEl = document.getElementById('group-description');

async function loadGroup() {
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { group, error } = await GroupsService.getById(groupId);

  loadingEl.hidden = true;

  if (error || !group) {
    window.location.href = 'unauthorized.html';
    return;
  }

  nameEl.textContent = group.name;
  descriptionEl.textContent = group.description || '';
  headerEl.hidden = false;

  document.querySelector('a[href="members.html"]').href = `members.html?id=${groupId}`;
  document.querySelector('a[href="group-settings.html"]').href = `group-settings.html?id=${groupId}`;
}

const generateBtn = document.getElementById('generate-invite-btn');
const activeInviteEl = document.getElementById('active-invite');
const linkTextEl = document.getElementById('invite-link-text');
const expiryTextEl = document.getElementById('invite-expiry-text');

function buildInviteUrl(code) {
  return `${window.location.origin}/pages/accept-invitation.html?code=${code}`;
}

async function loadActiveInvite() {
  const { invitation, error } = await InvitationsService.getActive(groupId);

  if (error || !invitation) {
    activeInviteEl.hidden = true;
    return;
  }

  linkTextEl.textContent = buildInviteUrl(invitation.code);
  expiryTextEl.textContent = new Date(invitation.expires_at).toLocaleString();
  activeInviteEl.hidden = false;
}

async function handleGenerateOrRegenerate() {
  const { code, error } = await InvitationsService.generate(groupId);

  if (error) {
    showToast(error.message, 'error');
    return;
  }

  showToast('Invitation link generated.');
  loadActiveInvite();
}

generateBtn.addEventListener('click', handleGenerateOrRegenerate);

document.getElementById('regenerate-invite-btn').addEventListener('click', () => {
  confirmAction('Regenerating will invalidate the current link for anyone still holding it. Continue?', handleGenerateOrRegenerate);
});

document.getElementById('copy-invite-btn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(linkTextEl.textContent);
  showToast('Link copied.');
});

loadActiveInvite();
loadGroup();


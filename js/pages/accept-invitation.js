const params = new URLSearchParams(window.location.search);
const code = params.get('code');

const loadingEl = document.getElementById('loading-state');
const invalidEl = document.getElementById('invalid-state');
const previewEl = document.getElementById('preview-state');
const groupNameEl = document.getElementById('preview-group-name');
const signedOutEl = document.getElementById('signed-out-actions');
const signedInEl = document.getElementById('signed-in-actions');

async function init() {
  if (!code) {
    loadingEl.hidden = true;
    invalidEl.hidden = false;
    return;
  }

  const { result, error } = await InvitationsService.preview(code);

  loadingEl.hidden = true;

  if (error || !result.valid) {
    invalidEl.hidden = false;
    return;
  }

  groupNameEl.textContent = result.group_name;
  previewEl.hidden = false;

  const { session } = await AuthService.getSession();

  if (session) {
    signedOutEl.hidden = true;
    signedInEl.hidden = false;
  } else {
    signedOutEl.hidden = false;
    signedInEl.hidden = true;
  }
}

init();

document.getElementById('join-btn').addEventListener('click', async () => {
  const { result, error } = await InvitationsService.accept(code);

  if (error) {
    showToast(error.message, 'error');
    return;
  }

  if (result.result === 'invalid') {
    invalidEl.hidden = false;
    previewEl.hidden = true;
    return;
  }

  window.location.href = `group-overview.html?id=${result.group_id}`;
});
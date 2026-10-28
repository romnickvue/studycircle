function openJoinGroupModal() {
  if (document.querySelector('.join-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay join-overlay';
  overlay.innerHTML = `
    <div class="modal join-modal">
      <div class="join-head">
        <h3>Join a Group</h3>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <p class="join-help">Enter the invitation code from your group admin.</p>
      <form class="join-form">
        <input type="text" class="join-input" placeholder="XXXX-XXXX" maxlength="9" autocomplete="off" autocapitalize="characters" spellcheck="false" />
        <p class="form-error join-error" hidden></p>
        <button type="submit">Join Group</button>
      </form>
    </div>`;

  const form = overlay.querySelector('.join-form');
  const input = overlay.querySelector('.join-input');
  const errorEl = overlay.querySelector('.join-error');
  const submit = overlay.querySelector('button[type="submit"]');

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };

  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.hidden = false;
  };

  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', onKey);

  input.addEventListener('input', () => {
    const raw = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    input.value = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
    errorEl.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const code = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (code.length !== 8) {
      showError('Enter the full 8-character code.');
      return;
    }

    submit.disabled = true;
    const { result, error } = await InvitationsService.accept(code);
    submit.disabled = false;

    if (error) {
      showError(error.message);
      return;
    }

    if (!result || result.result === 'invalid') {
      showError("That code isn't valid or has expired.");
      return;
    }

    window.location.href = `group-overview.html?id=${result.group_id}`;
  });

  document.body.appendChild(overlay);
  input.focus();
}
function openModal(modalId) {
  document.getElementById(modalId).hidden = false;
}

function closeModal(modalId) {
  document.getElementById(modalId).hidden = true;
}

function confirmAction(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay confirm-overlay';
  overlay.innerHTML = `
    <div class="modal confirm-modal" role="alertdialog" aria-modal="true">
      <div class="confirm-icon"><i class="bi bi-exclamation-circle"></i></div>
      <p class="confirm-message"></p>
      <div class="confirm-actions">
        <button type="button" class="confirm-cancel">Cancel</button>
        <button type="button" class="confirm-ok">Confirm</button>
      </div>
    </div>`;

  overlay.querySelector('.confirm-message').textContent = message;

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };

  overlay.querySelector('.confirm-cancel').addEventListener('click', close);
  overlay.querySelector('.confirm-ok').addEventListener('click', () => {
    close();
    onConfirm();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', onKey);

  document.body.appendChild(overlay);
  overlay.querySelector('.confirm-cancel').focus();
}
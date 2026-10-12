function openModal(modalId) {
  document.getElementById(modalId).hidden = false;
}

function closeModal(modalId) {
  document.getElementById(modalId).hidden = true;
}

function confirmAction(message, onConfirm) {
  const confirmed = window.confirm(message);
  if (confirmed) {
    onConfirm();
  }
}
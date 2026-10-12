const form = document.getElementById('sign-in-form');
const errorEl = document.getElementById('form-error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  errorEl.hidden = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = await AuthService.signIn(email, password);

  submitButton.disabled = false;

  if (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
    return;
  }

  window.location.href = '../index.html';
});
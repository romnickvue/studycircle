const form = document.getElementById('register-form');
const errorEl = document.getElementById('form-error');
const successEl = document.getElementById('success-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  errorEl.hidden = true;
  successEl.hidden = true;

  const displayName = document.getElementById('display-name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = await AuthService.register(email, password, displayName);

  submitButton.disabled = false;

  if (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
    return;
  }

  form.hidden = true;
  successEl.hidden = false;
});
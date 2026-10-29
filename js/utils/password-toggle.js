document.querySelectorAll('.toggle-password').forEach((button) => {
  button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input');
    const show = input.type === 'password';

    input.type = show ? 'text' : 'password';
    button.querySelector('i').className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
});
(async function requireAuth() {
  const { session } = await AuthService.getSession();

  if (!session) {
    window.location.href = 'sign-in.html';
  }
})();
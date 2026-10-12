const signOutBtn = document.getElementById('sign-out-btn');

if (signOutBtn) {
  signOutBtn.addEventListener('click', async () => {
    await AuthService.signOut();
    window.location.href = 'pages/sign-in.html';
  });
}
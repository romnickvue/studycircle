function initDrawer() {
  const sidebar = document.querySelector('.sidebar.group-mode');
  if (!sidebar) return;

  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger-btn';
  hamburger.textContent = '☰';
  hamburger.setAttribute('aria-label', 'Open menu');

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';

  document.body.appendChild(hamburger);
  document.body.appendChild(overlay);

  function openDrawer() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }

  function closeDrawer() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  hamburger.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);
}

document.addEventListener('DOMContentLoaded', initDrawer);
function buildGroupTabBar(groupId) {
  if (document.querySelector('.group-tab-bar')) return;

  const page = window.location.pathname.split('/').pop();
  const q = `?id=${groupId}`;

  const tabs = [
    { href: 'group-overview.html', icon: 'bi-grid', label: 'Overview' },
    { href: 'subjects.html', icon: 'bi-journal-bookmark', label: 'Subjects' },
    { href: 'activities.html', icon: 'bi-list-task', label: 'Tasks' }
  ];

  const moreItems = [
    { href: `group-calendar.html${q}`, icon: 'bi-calendar3', label: 'Calendar', page: 'group-calendar.html' },
    { href: `members.html${q}`, icon: 'bi-people', label: 'Members', page: 'members.html' },
    { href: `group-settings.html${q}`, icon: 'bi-gear', label: 'Group Settings', page: 'group-settings.html' }
  ];

  const nav = document.createElement('nav');
  nav.className = 'bottom-tab-bar group-tab-bar';
  const back = document.createElement('a');
  back.href = 'groups.html';
  back.className = 'tab-back';
  back.innerHTML = '<i class="bi bi-arrow-left"></i><span>Back</span>';
  nav.appendChild(back);

  tabs.forEach((tab) => {
    const link = document.createElement('a');
    link.href = tab.href + q;
    if (page === tab.href) link.classList.add('active');
    link.innerHTML = `<i class="bi ${tab.icon}"></i><span>${tab.label}</span>`;
    nav.appendChild(link);
  });

  const menu = document.createElement('div');
  menu.className = 'tab-more-menu';
  menu.hidden = true;

  moreItems.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.href;
    link.innerHTML = `<i class="bi ${item.icon}"></i> ${item.label}`;
    menu.appendChild(link);
  });

  const more = document.createElement('a');
  more.href = '#';
  more.innerHTML = '<i class="bi bi-three-dots"></i><span>More</span>';
  if (moreItems.some((item) => item.page && item.page === page)) more.classList.add('active');

  more.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  document.addEventListener('click', () => { menu.hidden = true; });

  nav.appendChild(more);
  document.body.appendChild(nav);
  document.body.appendChild(menu);
}

function wireGroupSidebarLinks(groupId) {
  const linkMap = {
    'group-overview.html': `group-overview.html?id=${groupId}`,
    'subjects.html': `subjects.html?id=${groupId}`,
    'activities.html': `activities.html?id=${groupId}`,
    'group-calendar.html': `group-calendar.html?id=${groupId}`,
    'members.html': `members.html?id=${groupId}`,
    'group-settings.html': `group-settings.html?id=${groupId}`
  };

  document.querySelectorAll('.sidebar nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (linkMap[href]) {
      link.href = linkMap[href];
    }
  });

  const navList = document.querySelector('.sidebar nav ul');
  if (navList && !navList.querySelector('.sidebar-back-link')) {
    const item = document.createElement('li');
    item.className = 'sidebar-back-item';
    item.innerHTML = '<a href="groups.html" class="sidebar-back-link"><i class="bi bi-arrow-left"></i> Back to My Groups</a>';
    navList.prepend(item);
  }

  buildGroupTabBar(groupId);
}
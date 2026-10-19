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
}
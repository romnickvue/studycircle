const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const panelEl = document.getElementById('members-panel');
const listEl = document.getElementById('members-list');
const emptyEl = document.getElementById('members-empty');
const countEl = document.getElementById('members-count');
const searchEl = document.getElementById('member-search');

let currentUserId = null;
let currentUserRole = null;
let allMembers = [];

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown').forEach((m) => { m.hidden = true; });
}

document.addEventListener('click', closeAllMenus);

function buildMemberRow(member, isAdmin) {
  const name = member.profiles?.display_name || '(unknown)';
  const isMe = member.user_id === currentUserId;
  const isMemberAdmin = member.role === 'ADMIN';

  const row = document.createElement('div');
  row.className = 'member-row';

  row.innerHTML = `
    <div class="member-cell-name">
      <span class="member-avatar"></span>
      <span class="member-text">
        <span class="member-name"></span>
        <span class="member-role-line"></span>
      </span>
    </div>
    <div><span class="member-role-pill"></span></div>
    <div class="col-joined member-joined"></div>
    <div class="col-actions"></div>`;

  row.querySelector('.member-avatar').textContent = initialsOf(name);
  row.querySelector('.member-name').textContent = isMe ? `${name} (You)` : name;
  row.querySelector('.member-role-line').textContent = isMemberAdmin ? 'Admin' : 'Member';

  const pill = row.querySelector('.member-role-pill');
  pill.classList.add(isMemberAdmin ? 'is-admin-role' : 'is-member-role');
  pill.innerHTML = isMemberAdmin ? '<i class="bi bi-gem"></i> Admin' : 'Member';

  row.querySelector('.member-joined').textContent = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const actionsCell = row.querySelector('.col-actions');

  if (isAdmin && !isMe) {
    actionsCell.innerHTML = `
      <div class="subject-menu">
        <button type="button" class="menu-btn" aria-label="Member options"><i class="bi bi-three-dots"></i></button>
        <div class="menu-dropdown" hidden>
          <button type="button" class="menu-item" data-action="role"></button>
          <button type="button" class="menu-item menu-item-danger" data-action="remove"><i class="bi bi-person-x"></i> Remove Member</button>
        </div>
      </div>`;

    const roleBtn = actionsCell.querySelector('[data-action="role"]');
    roleBtn.innerHTML = isMemberAdmin
      ? '<i class="bi bi-arrow-down-circle"></i> Demote to Member'
      : '<i class="bi bi-arrow-up-circle"></i> Promote to Admin';

    const dropdown = actionsCell.querySelector('.menu-dropdown');

    actionsCell.querySelector('.menu-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const wasHidden = dropdown.hidden;
      closeAllMenus();
      dropdown.hidden = !wasHidden;
    });

    roleBtn.addEventListener('click', () => {
      closeAllMenus();
      if (isMemberAdmin) handleDemote(member.user_id);
      else handlePromote(member.user_id);
    });

    actionsCell.querySelector('[data-action="remove"]').addEventListener('click', () => {
      closeAllMenus();
      handleRemove(member.user_id);
    });
  }

  return row;
}

function renderMembers() {
  const term = searchEl.value.trim().toLowerCase();
  const isAdmin = currentUserRole === 'ADMIN';

  panelEl.classList.toggle('is-admin', isAdmin);

  const shown = allMembers.filter((m) =>
    (m.profiles?.display_name || '').toLowerCase().includes(term)
  );

  listEl.innerHTML = '';
  shown.forEach((m) => listEl.appendChild(buildMemberRow(m, isAdmin)));
  emptyEl.hidden = shown.length > 0;
}

async function loadMembers() {
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { session } = await AuthService.getSession();
  currentUserId = session.user.id;

  const { members, error } = await MembersService.list(groupId);

  loadingEl.hidden = true;

  if (error) {
    window.location.href = 'unauthorized.html';
    return;
  }

  allMembers = members;

  const me = members.find((m) => m.user_id === currentUserId);
  currentUserRole = me ? me.role : null;

  countEl.textContent = `${members.length} ${members.length === 1 ? 'member' : 'members'}`;
  renderMembers();
  panelEl.hidden = false;
}

searchEl.addEventListener('input', renderMembers);

async function handlePromote(userId) {
  const { error } = await MembersService.promote(groupId, userId);
  if (error) {
    showToast(error.message, 'error');
    return;
  }
  showToast('Member promoted to Admin.');
  loadMembers();
}

async function handleDemote(userId) {
  const { error } = await MembersService.demote(groupId, userId);
  if (error) {
    showToast(error.message, 'error');
    return;
  }
  showToast('Member demoted.');
  loadMembers();
}

async function handleRemove(userId) {
  confirmAction('Remove this member from the group?', async () => {
    const { error } = await MembersService.remove(groupId, userId);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Member removed.');
    loadMembers();
  });
}

loadMembers();
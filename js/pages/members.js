const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const tableEl = document.getElementById('members-table');
const tbodyEl = document.getElementById('members-tbody');

let currentUserId = null;
let currentUserRole = null;

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

  const me = members.find((m) => m.user_id === currentUserId);
  currentUserRole = me ? me.role : null;

  tbodyEl.innerHTML = '';

  members.forEach((member) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = member.profiles?.display_name || '(unknown)';

    const roleCell = document.createElement('td');
    const roleBadge = document.createElement('span');
    roleBadge.className = `role-badge ${member.role === 'ADMIN' ? 'admin' : 'member'}`;
    roleBadge.textContent = member.role;
    roleCell.appendChild(roleBadge);

    const actionsCell = document.createElement('td');

    if (currentUserRole === 'ADMIN' && member.user_id !== currentUserId) {
      if (member.role === 'MEMBER') {
        const promoteBtn = document.createElement('button');
        promoteBtn.textContent = 'Promote';
        promoteBtn.className = 'btn-secondary';
        promoteBtn.addEventListener('click', () => handlePromote(member.user_id));
        actionsCell.appendChild(promoteBtn);
      } else {
        const demoteBtn = document.createElement('button');
        demoteBtn.textContent = 'Demote';
        demoteBtn.addEventListener('click', () => handleDemote(member.user_id));
        actionsCell.appendChild(demoteBtn);
      }

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'btn-destructive';
      removeBtn.addEventListener('click', () => handleRemove(member.user_id));
      actionsCell.appendChild(removeBtn);
    }

    row.appendChild(nameCell);
    row.appendChild(roleCell);
    row.appendChild(actionsCell);
    tbodyEl.appendChild(row);
  });

  tableEl.hidden = false;
}

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
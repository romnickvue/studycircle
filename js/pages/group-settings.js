const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const adminSection = document.getElementById('admin-section');
const formEl = document.getElementById('settings-form');
const nameInput = document.getElementById('group-name');
const descriptionInput = document.getElementById('group-description');
const errorEl = document.getElementById('form-error');
const saveBar = document.getElementById('save-bar');

const GROUP_ICONS = ['bi-journal-bookmark', 'bi-calculator', 'bi-lightning', 'bi-palette', 'bi-music-note-beamed', 'bi-globe', 'bi-translate', 'bi-bank', 'bi-heart-pulse', 'bi-tree', 'bi-stars', 'bi-trophy', 'bi-briefcase', 'bi-lightbulb', 'bi-camera', 'bi-film', 'bi-pencil', 'bi-mortarboard', 'bi-chat-dots', 'bi-code-slash', 'bi-terminal', 'bi-cpu'];

let selectedIcon = null;
let initial = null;

function checkDirty() {
  if (!initial) return;
  const changed =
    nameInput.value.trim() !== initial.name ||
    descriptionInput.value.trim() !== initial.description ||
    selectedIcon !== initial.icon;
  saveBar.hidden = !changed;
}

nameInput.addEventListener('input', checkDirty);
descriptionInput.addEventListener('input', checkDirty);

function renderIconPicker(currentIcon) {
  selectedIcon = currentIcon;
  const picker = document.getElementById('icon-picker');
  picker.innerHTML = '';
  picker.setAttribute('role', 'radiogroup');
  picker.setAttribute('aria-label', 'Group icon');

  GROUP_ICONS.forEach((icon) => {
    const btn = document.createElement('div');
    btn.className = `icon-option ${icon === currentIcon ? 'selected' : ''}`;
    btn.innerHTML = `<i class="bi ${icon}"></i>`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', icon.replace('bi-', '').replace(/-/g, ' '));
    btn.setAttribute('aria-checked', icon === currentIcon ? 'true' : 'false');

    const choose = () => {
      selectedIcon = icon;
      picker.querySelectorAll('.icon-option').forEach((el) => {
        el.classList.remove('selected');
        el.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
      checkDirty();
    };

    btn.addEventListener('click', choose);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose();
      }
    });

    picker.appendChild(btn);
  });
}

async function loadGroup() {
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { session } = await AuthService.getSession();

  const { data: membership } = await supabaseClient
    .from('group_memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!membership) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const isAdmin = membership.role === 'ADMIN';

  const { group, error } = await GroupsService.getById(groupId);

  loadingEl.hidden = true;

  if (error || !group) {
    window.location.href = 'unauthorized.html';
    return;
  }

  if (isAdmin) {
    nameInput.value = group.name;
    descriptionInput.value = group.description || '';
    renderIconPicker(group.icon_name);

    initial = {
      name: group.name,
      description: group.description || '',
      icon: group.icon_name || null
    };
    checkDirty();

    adminSection.hidden = false;
    loadActiveInvite();
  }
}

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  errorEl.hidden = true;

  const submitButton = document.getElementById('save-btn');
  submitButton.disabled = true;

  const { updated, error } = await GroupsService.update(
    groupId,
    nameInput.value.trim(),
    descriptionInput.value.trim() || null,
    selectedIcon
  );

  submitButton.disabled = false;

  if (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
    return;
  }

  if (!updated) {
    showToast('You do not have permission to edit this group.', 'error');
    return;
  }

  initial = {
    name: nameInput.value.trim(),
    description: descriptionInput.value.trim(),
    icon: selectedIcon
  };
  checkDirty();

  showToast('Group settings saved.');
});

const generateBtn = document.getElementById('generate-invite-btn');
const activeInviteEl = document.getElementById('active-invite');
const linkTextEl = document.getElementById('invite-link-text');
const expiryTextEl = document.getElementById('invite-expiry-text');

function formatInviteCode(code) {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

async function loadActiveInvite() {
  const { invitation, error } = await InvitationsService.getActive(groupId);

  if (error || !invitation) {
    activeInviteEl.hidden = true;
    generateBtn.hidden = false;
    return;
  }

  linkTextEl.textContent = formatInviteCode(invitation.code);
  expiryTextEl.textContent = new Date(invitation.expires_at).toLocaleString();
  activeInviteEl.hidden = false;
  generateBtn.hidden = true;
}

async function handleGenerateOrRegenerate() {
  const { code, error } = await InvitationsService.generate(groupId);

  if (error) {
    showToast(error.message, 'error');
    return;
  }

  showToast('Invitation link generated.');
  loadActiveInvite();
}

generateBtn.addEventListener('click', handleGenerateOrRegenerate);

document.getElementById('regenerate-invite-btn').addEventListener('click', () => {
  confirmAction('Regenerating will invalidate the current link for anyone still holding it. Continue?', handleGenerateOrRegenerate);
});

document.getElementById('copy-invite-btn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(linkTextEl.textContent);
  showToast('Link copied.');
});

document.getElementById('leave-group-btn').addEventListener('click', () => {
  confirmAction('Are you sure you want to leave this group?', async () => {
    const { error } = await MembersService.leave(groupId);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('You left the group.');
    window.location.href = 'groups.html';
  });
});

loadGroup();
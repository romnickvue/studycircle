const params = new URLSearchParams(window.location.search);
const activityId = params.get('id');

const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('detail-content');
const statusButtons = document.querySelectorAll('.status-btn');

function highlightActiveStatus(status) {
  statusButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
}

async function loadActivity() {
  if (!activityId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { activity, error } = await ActivitiesService.getById(activityId);

  if (error || !activity) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { status } = await ProgressService.getMine(activityId);

  loadingEl.hidden = true;

  document.getElementById('activity-title').textContent = activity.title;
  document.getElementById('activity-type').textContent = `Type: ${activity.activity_type}`;
  document.getElementById('activity-subject').textContent = activity.subjects
    ? `Subject: ${activity.subjects.name}`
    : 'Subject: None';
  document.getElementById('activity-due').textContent = activity.due_at
    ? `Due: ${formatUrgencyLabel(activity.due_at, status === 'COMPLETED')}`
    : 'No due date';
  document.getElementById('activity-description').textContent = activity.description || '';

  highlightActiveStatus(status);
  contentEl.hidden = false;
}

statusButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const newStatus = btn.dataset.status;
    const { error } = await ProgressService.setStatus(activityId, newStatus);

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    showToast('Status updated.');
    loadActivity();
  });
});

loadActivity();
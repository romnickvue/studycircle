const params = new URLSearchParams(window.location.search);
const activityId = params.get('id');

const loadingEl = document.getElementById('loading-state');
const contentEl = document.getElementById('detail-content');
const statusSelect = document.getElementById('status-select');

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

  statusSelect.value = status;
  contentEl.hidden = false;
}

statusSelect.addEventListener('change', async () => {
  const newStatus = statusSelect.value;
  const { error } = await ProgressService.setStatus(activityId, newStatus);

  if (error) {
    showToast(error.message, 'error');
    return;
  }

  showToast('Status updated.');
  loadActivity();
});

loadActivity();
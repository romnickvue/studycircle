const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
wireGroupSidebarLinks(groupId);

const loadingEl = document.getElementById('loading-state');
const gridEl = document.getElementById('cal-grid');
const titleEl = document.getElementById('calendar-title');

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let allActivities = [];

let viewYear, viewMonth; // viewMonth is 0-indexed, matches JS Date

function manilaDateKey(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // "YYYY-MM-DD"
}

function todayManilaKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

async function renderCalendar() {
  if (!groupId) {
    window.location.href = 'unauthorized.html';
    return;
  }

  const { activities, error } = await ActivitiesService.listByGroup(groupId);
  allActivities = activities;

  loadingEl.hidden = true;

  if (error) {
    window.location.href = 'unauthorized.html';
    return;
  }

  // Group activities by their due date (Manila calendar day)
  const eventsByDay = {};
  activities.forEach((activity) => {
    if (!activity.due_at) return;
    const key = manilaDateKey(activity.due_at);
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(activity);
  });

  titleEl.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayKey = todayManilaKey();

  gridEl.innerHTML = '';
  gridEl.hidden = false;

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';

    let dayNum, cellYear, cellMonth;

    if (i < startWeekday) {
      dayNum = daysInPrevMonth - (startWeekday - i - 1);
      cellMonth = viewMonth - 1;
      cellYear = viewYear;
      cell.classList.add('other-month');
    } else if (i >= startWeekday + daysInMonth) {
      dayNum = i - (startWeekday + daysInMonth) + 1;
      cellMonth = viewMonth + 1;
      cellYear = viewYear;
      cell.classList.add('other-month');
    } else {
      dayNum = i - startWeekday + 1;
      cellMonth = viewMonth;
      cellYear = viewYear;
    }

    const cellDate = new Date(cellYear, cellMonth, dayNum);
    const cellKey = cellDate.toLocaleDateString('en-CA');

    if (cellKey === todayKey) cell.classList.add('today');

    const dayLabel = document.createElement('div');
    dayLabel.textContent = dayNum;
    dayLabel.style.cursor = 'pointer';
    dayLabel.style.fontWeight = 'bold';
    dayLabel.addEventListener('click', () => openDayModal(cellKey, cellDate));
    cell.appendChild(dayLabel);

    const dayEvents = eventsByDay[cellKey] || [];
    dayEvents.forEach((activity) => {
      const eventEl = document.createElement('div');
      eventEl.className = 'cal-event';
      eventEl.textContent = activity.title;
      eventEl.addEventListener('click', () => {
        window.location.href = `activity-detail.html?id=${activity.id}`;
      });
      cell.appendChild(eventEl);
    });

    gridEl.appendChild(cell);
  }
}

let selectedDayKey = null;

function openDayModal(dateKey, dateObj) {
  selectedDayKey = dateKey;

  const dayEvents = allActivities.filter((a) => a.due_at && manilaDateKey(a.due_at) === dateKey);

  document.getElementById('day-modal-title').textContent = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const listEl = document.getElementById('day-modal-list');
  listEl.innerHTML = '';

  if (dayEvents.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'No activities due this day.';
    listEl.appendChild(emptyMsg);
  } else {
    dayEvents.forEach((activity) => {
      const item = document.createElement('div');
      item.style.padding = 'var(--space-1)';
      item.style.cursor = 'pointer';
      const subjectLabel = activity.subjects ? ` — ${activity.subjects.name}` : '';
      item.textContent = `${activity.title}${subjectLabel} (${activity.activity_type})`;
      item.addEventListener('click', () => {
        window.location.href = `activity-detail.html?id=${activity.id}`;
      });
      listEl.appendChild(item);
    });
  }

  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Add Activity';
  addBtn.addEventListener('click', async () => {
    closeModal('day-modal');
    await populateSubjectDropdown();
    document.getElementById('activity-due').value = selectedDayKey;
    openModal('activity-modal');
  });
  listEl.appendChild(addBtn);

  openModal('day-modal');
}

async function populateSubjectDropdown() {
  const { subjects } = await SubjectsService.listByGroup(groupId);
  const select = document.getElementById('activity-subject');
  select.innerHTML = '<option value="">— None —</option>';
  subjects.forEach((subject) => {
    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

document.getElementById('activity-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const errorEl = document.getElementById('activity-error');
  errorEl.hidden = true;

  const title = document.getElementById('activity-title').value.trim();
  const activityType = document.getElementById('activity-type').value;
  const subjectId = document.getElementById('activity-subject').value;
  const dueDateOnly = document.getElementById('activity-due').value;

  const submitButton = event.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = await ActivitiesService.create(groupId, {
    subjectId,
    title,
    activityType,
    dueAt: dueDateOnly ? endOfDayManila(dueDateOnly) : null
  });

  submitButton.disabled = false;

  if (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
    return;
  }

  closeModal('activity-modal');
  event.target.reset();
  showToast('Activity created.');
  renderCalendar();
});

document.getElementById('prev-month-btn').addEventListener('click', () => {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderCalendar();
});

document.getElementById('next-month-btn').addEventListener('click', () => {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCalendar();
});

const now = new Date();
viewYear = now.getFullYear();
viewMonth = now.getMonth();

renderCalendar();
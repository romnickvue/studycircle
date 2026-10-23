const loadingEl = document.getElementById('loading-state');
const gridEl = document.getElementById('cal-grid');
const titleEl = document.getElementById('calendar-title');

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let viewYear, viewMonth;
let allActivities = [];

function manilaDateKey(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function todayManilaKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

async function renderCalendar() {
  const { activities, error } = await ActivitiesService.listMine();

  allActivities = activities;
  loadingEl.hidden = true;

  if (error) {
    return;
  }

  const eventsByDay = {};
  activities.forEach((activity) => {
    if (!activity.due_at) return;
    const key = manilaDateKey(activity.due_at);
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(activity);
  });

  titleEl.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
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
    if (dayEvents.length > 0) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'cal-dots';

      dayEvents.forEach((activity) => {
        const dot = document.createElement('span');
        const status = getUrgencyStatus(activity.due_at, false).toLowerCase().replace('_', '-');
        dot.className = `cal-dot ${status}`;
        dot.title = activity.title;
        dotsContainer.appendChild(dot);
      });

      dotsContainer.addEventListener('click', () => openDayModal(cellKey, cellDate));

      cell.appendChild(dotsContainer);
    }

    gridEl.appendChild(cell);
  }
}

function openDayModal(dateKey, dateObj) {
  const dayEvents = allActivities.filter((a) => a.due_at && manilaDateKey(a.due_at) === dateKey);

  document.getElementById('day-modal-title').textContent = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const listEl = document.getElementById('day-modal-list');
  listEl.innerHTML = '';

  if (dayEvents.length === 0) {
    listEl.textContent = 'No activities due this day.';
  } else {
    dayEvents.forEach((activity) => {
      const item = document.createElement('div');
      item.style.padding = 'var(--space-1)';
      item.style.cursor = 'pointer';
      const groupLabel = activity.groups ? ` — ${activity.groups.name}` : '';
      item.textContent = `${activity.title}${groupLabel} (${activity.activity_type})`;
      item.addEventListener('click', () => {
        window.location.href = `activity-detail.html?id=${activity.id}`;
      });
      listEl.appendChild(item);
    });
  }

  openModal('day-modal');
}

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
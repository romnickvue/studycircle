const TIMEZONE = 'Asia/Manila';

// Returns start of "today" at 00:00 in Manila time, as a Date object.
function getManilaToday() {
  const now = new Date();
  const manilaString = now.toLocaleString('en-US', { timeZone: TIMEZONE });
  const manilaNow = new Date(manilaString);
  manilaNow.setHours(0, 0, 0, 0);
  return manilaNow;
}

// Returns the number of whole calendar days between "today" (Manila) and the due date.
// Negative = overdue, 0 = today, 1 = tomorrow, etc.
function daysUntilDue(dueDateIso) {
  const due = new Date(dueDateIso);
  const dueManilaString = due.toLocaleString('en-US', { timeZone: TIMEZONE });
  const dueManila = new Date(dueManilaString);
  dueManila.setHours(0, 0, 0, 0);

  const today = getManilaToday();
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((dueManila - today) / msPerDay);
}

// Returns one of: 'COMPLETED', 'OVERDUE', 'DUE_TODAY', 'DUE_TOMORROW', 'DUE_SOON'
// isCompleted always wins, regardless of the date — an activity marked COMPLETED
// must never show as overdue (UI_UX.md §1).
function getUrgencyStatus(dueDateIso, isCompleted) {
  if (isCompleted) return 'COMPLETED';

  const diff = daysUntilDue(dueDateIso);

  if (diff < 0) return 'OVERDUE';
  if (diff === 0) return 'DUE_TODAY';
  if (diff === 1) return 'DUE_TOMORROW';
  return 'DUE_SOON';
}

// Human-readable label for the urgency badge.
function formatUrgencyLabel(dueDateIso, isCompleted) {
  const status = getUrgencyStatus(dueDateIso, isCompleted);
  const diff = daysUntilDue(dueDateIso);

  switch (status) {
    case 'COMPLETED': return 'Completed';
    case 'OVERDUE': return 'Overdue';
    case 'DUE_TODAY': return 'Due today';
    case 'DUE_TOMORROW': return 'Due tomorrow';
    default: return `Due in ${diff} days`;
  }
}

// Given a date-only string like "2026-10-20", returns a full ISO timestamp
// set to 23:59:59 Manila time, per our Stage 0 decision.
function endOfDayManila(dateOnlyString) {
  return `${dateOnlyString}T23:59:59+08:00`;
}

// Returns { start, end } of the "task window" in Manila time.
// Rolling window: from 7 days before today up to 7 days after today.
// (Name kept as "week" so existing callers keep working.)
function getCurrentWeekWindow() {
  const todayManila = getManilaToday();

  const start = new Date(todayManila);
  start.setDate(start.getDate() - 7);

  const end = new Date(todayManila);
  end.setDate(end.getDate() + 8); // exclusive, so all of day +7 is included

  return { start, end };
}

// True if the given due date falls within the current week window.
function isWithinCurrentWeek(dueDateIso) {
  if (!dueDateIso) return false;

  const due = new Date(dueDateIso);
  const dueManilaString = due.toLocaleString('en-US', { timeZone: TIMEZONE });
  const dueManila = new Date(dueManilaString);

  const { start, end } = getCurrentWeekWindow();

  return dueManila >= start && dueManila < end;
}
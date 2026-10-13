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
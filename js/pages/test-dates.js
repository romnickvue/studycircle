const results = [];

function assertEqual(label, actual, expected) {
  const pass = actual === expected;
  results.push(`${pass ? 'PASS' : 'FAIL'} — ${label} (got: ${actual}, expected: ${expected})`);
}

function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Overdue: due date was 2 days ago
assertEqual('Overdue (2 days past)', getUrgencyStatus(isoDaysFromNow(-2), false), 'OVERDUE');

// Due today
assertEqual('Due today', getUrgencyStatus(isoDaysFromNow(0), false), 'DUE_TODAY');

// Due tomorrow
assertEqual('Due tomorrow', getUrgencyStatus(isoDaysFromNow(1), false), 'DUE_TOMORROW');

// Due in several days
assertEqual('Due in 5 days', getUrgencyStatus(isoDaysFromNow(5), false), 'DUE_SOON');
assertEqual('Due in 5 days (label)', formatUrgencyLabel(isoDaysFromNow(5), false), 'Due in 5 days');

// Completed overrides everything — even a wildly overdue date
assertEqual('Completed overrides overdue', getUrgencyStatus(isoDaysFromNow(-10), true), 'COMPLETED');

// Date-only deadline, stored as end of day Manila time — should count as "today" all day
const today = new Date();
const todayDateOnly = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
assertEqual('Date-only deadline = due today', getUrgencyStatus(endOfDayManila(todayDateOnly), false), 'DUE_TODAY');

// Week window tests
const { start: weekStart, end: weekEnd } = getCurrentWeekWindow();
assertEqual('Week window starts on a Sunday', weekStart.getDay(), 0);
assertEqual('Week window spans exactly 7 days', Math.round((weekEnd - weekStart) / (24 * 60 * 60 * 1000)), 7);

// Something due right now should be within the current week
assertEqual('Due right now is within current week', isWithinCurrentWeek(new Date().toISOString()), true);

// Something due 10 days from now should NOT be within the current week
assertEqual('Due in 10 days is NOT within current week', isWithinCurrentWeek(isoDaysFromNow(10)), false);

// Something due 10 days ago should NOT be within the current week
assertEqual('Due 10 days ago is NOT within current week', isWithinCurrentWeek(isoDaysFromNow(-10)), false);

// No due date at all should never count as "within the week"
assertEqual('No due date is NOT within current week', isWithinCurrentWeek(null), false);

document.getElementById('results').textContent = results.join('\n');
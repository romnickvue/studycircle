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

document.getElementById('results').textContent = results.join('\n');
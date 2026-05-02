const fs = require('fs');
let ctx = {};
try {
  ctx = JSON.parse(fs.readFileSync('/data/KAI_Context.json', 'utf8').replace(/^\uFEFF/, ''));
} catch(e) {
  ctx = {};
}
const rawDeadlines = ctx.deadlines || [];
const compliance = ctx.compliance_rules || [];
const today = new Date();
today.setHours(0, 0, 0, 0);

function sanitize(str) {
  if (!str) return str;
  return str
    .replace(/\u2013/g, '--')
    .replace(/\u2014/g, '--')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u00e2\u0080\u0093/g, '--')
    .replace(/\u00e2\u0080\u0094/g, '--')
    .replace(/\u00e2\u0080\u0099/g, "'")
    .replace(/\u00e2\u0080\u009c/g, '"')
    .replace(/\u00e2\u0080\u009d/g, '"')
    .replace(/â€"/g, '--')
    .replace(/â€˜/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/\uFFFD/g, '-')
    .replace(/[^\x00-\x7F]/g, function(c) {
      const code = c.charCodeAt(0);
      if (code >= 0x2013 && code <= 0x2014) return '--';
      if (code >= 0x2018 && code <= 0x201d) return '"';
      return '';
    });
}

function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return !isNaN(new Date(s).getTime());
}
function daysUntil(s) {
  return Math.ceil((new Date(s) - today) / (1000 * 60 * 60 * 24));
}

const deadlines = rawDeadlines.filter(function(d) {
  if (!d || !d.item || !d.date) return false;
  const st = (d.status || '').toUpperCase();
  if (st === 'FILED' || st === 'COMPLETE' || st === 'EXEMPT') return false;
  return isValidDate(d.date);
});

const overdue  = deadlines.filter(function(d) { return daysUntil(d.date) < 0; });
const critical = deadlines.filter(function(d) { const n = daysUntil(d.date); return n >= 0 && n <= 7; });
const urgent   = deadlines.filter(function(d) { const n = daysUntil(d.date); return n > 7 && n <= 21; });
const upcoming = deadlines.filter(function(d) { const n = daysUntil(d.date); return n > 21 && n <= 90; });

let report = 'IRIS COMPLIANCE MONITOR v3\n';
report += 'Generated: ' + today.toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' EST\n';
report += 'Active deadlines tracked: ' + deadlines.length + '\n\n';

if (overdue.length) {
  report += 'OVERDUE:\n';
  overdue.forEach(function(d) {
    report += '  * ' + sanitize(d.item) + ' -- ' + Math.abs(daysUntil(d.date)) + 'd overdue [' + (d.entity || '?') + ']\n';
    if (d.notes) report += '    Notes: ' + sanitize(d.notes) + '\n';
  });
  report += '\n';
}
if (critical.length) {
  report += 'CRITICAL (7 days or less):\n';
  critical.forEach(function(d) {
    report += '  * ' + sanitize(d.item) + ' -- ' + daysUntil(d.date) + 'd (' + d.date + ') [' + (d.entity || '?') + '] Owner: ' + (d.owner || 'Kevin') + '\n';
    if (d.notes) report += '    Notes: ' + sanitize(d.notes) + '\n';
  });
  report += '\n';
}
if (urgent.length) {
  report += 'URGENT (8-21 days):\n';
  urgent.forEach(function(d) {
    report += '  * ' + sanitize(d.item) + ' -- ' + daysUntil(d.date) + 'd (' + d.date + ') [' + (d.entity || '?') + ']\n';
    if (d.notes) report += '    Notes: ' + sanitize(d.notes) + '\n';
  });
  report += '\n';
}
if (upcoming.length) {
  report += 'UPCOMING (22-90 days):\n';
  upcoming.forEach(function(d) {
    report += '  * ' + sanitize(d.item) + ' -- ' + daysUntil(d.date) + 'd (' + d.date + ') [' + (d.entity || '?') + ']\n';
  });
  report += '\n';
}
if (!overdue.length && !critical.length && !urgent.length) {
  report += 'No overdue, critical, or urgent items.\n\n';
}
report += 'COMPLIANCE RULES:\n' + compliance.map(function(r) { return '* ' + sanitize(r); }).join('\n') + '\n\n';
report += 'REGULATORY WATCH:\n';
report += '* FAA Part 108 BVLOS final rule INCOMING\n';
report += '* OMB M-26-02 federal drone compliance deadline: 2026-05-20\n';

const outputPath = '/data/Aidan_Outputs/Iris/Iris_Report_' + today.toISOString().replace(/[:.]/g, '-') + '.txt';
fs.mkdirSync('/data/Aidan_Outputs/Iris', { recursive: true });
fs.writeFileSync(outputPath, report, 'utf8');

let whatsappMsg = 'IRIS COMPLIANCE v3\n';
whatsappMsg += today.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }) + ' | Tracking: ' + deadlines.length + ' items\n\n';

if (overdue.length) {
  whatsappMsg += 'OVERDUE (' + overdue.length + '):\n';
  overdue.forEach(function(d) { whatsappMsg += '* ' + sanitize(d.item) + ' -- ' + Math.abs(daysUntil(d.date)) + 'd ago\n'; });
  whatsappMsg += '\n';
}
if (critical.length) {
  whatsappMsg += 'CRITICAL (' + critical.length + '):\n';
  critical.forEach(function(d) { whatsappMsg += '* ' + sanitize(d.item) + ' -- ' + daysUntil(d.date) + 'd\n'; });
  whatsappMsg += '\n';
}
if (urgent.length) {
  whatsappMsg += 'URGENT (' + urgent.length + '):\n';
  urgent.forEach(function(d) { whatsappMsg += '* ' + sanitize(d.item) + ' -- ' + daysUntil(d.date) + 'd\n'; });
  whatsappMsg += '\n';
}
if (!overdue.length && !critical.length && !urgent.length) {
  whatsappMsg += 'All clear -- no critical or overdue items.\n\n';
}
whatsappMsg += 'Part 108 BVLOS: INCOMING -- Atlas flagged.';
whatsappMsg = sanitize(whatsappMsg);

const summary = 'IRIS v3 COMPLETE | Critical: ' + critical.length + ' | Urgent: ' + urgent.length + ' | Overdue: ' + overdue.length + ' | Saved: ' + outputPath;

const supabaseItems = [];
overdue.forEach(function(d) { supabaseItems.push({ item: d, severity: 'overdue', days: daysUntil(d.date) }); });
critical.forEach(function(d) { supabaseItems.push({ item: d, severity: 'critical', days: daysUntil(d.date) }); });
urgent.forEach(function(d) { supabaseItems.push({ item: d, severity: 'urgent', days: daysUntil(d.date) }); });

return [{
  json: {
    report: report,
    whatsappMsg: whatsappMsg,
    summary: summary,
    criticalCount: critical.length,
    urgentCount: urgent.length,
    overdueCount: overdue.length,
    activeCount: deadlines.length,
    savedTo: outputPath,
    supabaseItems: supabaseItems,
    runDate: today.toISOString().slice(0, 10)
  }
}];

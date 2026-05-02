const fs = require('fs');
const http = require('http');

let ctx = {};
try { ctx = JSON.parse(fs.readFileSync('/data/KAI_Context.json', 'utf8').replace(/^\uFEFF/, '')); } catch(e) { ctx = {}; }

const entities = ctx.entities || {};
const founder = ctx.founder || {};
const revenue = ctx.revenue_targets || {};
const activeDeadlines = (ctx.deadlines || []).filter(function(d) {
  const st = (d.status || '').toUpperCase();
  return st !== 'FILED' && st !== 'COMPLETE' && st !== 'EXEMPT';
});

const eafProfile = 'ORGANIZATION: ' + (entities.EAF && entities.EAF.name ? entities.EAF.name : 'KAI-Netics Equity & Autonomy Foundry') +
  '\nEIN: ' + (entities.EAF && entities.EAF.ein ? entities.EAF.ein : '41-4820296') +
  '\nTYPE: ' + (entities.EAF && entities.EAF.type ? entities.EAF.type : 'Maryland Nonstock Corp 501c3 pending') +
  '\nFOUNDER: ' + (founder.name || '') + ' -- ' + (founder.credentials || []).join(', ') +
  '\nPROGRAMS: CAKO | MONK | Talent Pipeline Agreement' +
  '\nSERVICE AREA: Maryland, DC Metro, Northern Virginia' +
  '\nREVENUE: Y1 ' + (revenue.year1_total || '') + ' Y2 ' + (revenue.year2_total || '') +
  '\nACTIVE DEADLINES: ' + activeDeadlines.map(function(d) { return d.item + ' | ' + d.date; }).join(' | ') +
  '\nCOMPLIANCE: NO funds flow FP to EAF. Talent Pipeline Agreement is only structural link.';

const dirPath = '/data/Maryland_Grants/';
let grantFiles = [];
try { grantFiles = fs.readdirSync(dirPath).filter(function(f) { return f.endsWith('.txt') || f.endsWith('.md'); }); } catch(e) { grantFiles = []; }

if (grantFiles.length === 0) {
  const msg = 'JORDAN: No grant files found in /data/Maryland_Grants/. Add grant files to analyze.';
  const mb = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: msg } });
  const wo = { hostname: 'host.docker.internal', port: 8081, path: '/message/sendText/Aidan', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(mb) } };
  await new Promise(function(r) { const req = http.request(wo, function(res) { res.on('data',function(){}); res.on('end',r); }); req.on('error',r); req.write(mb); req.end(); });
  return [];
}

// Deduplication -- skip files already analyzed today
const today = new Date().toISOString().slice(0, 10);
const reportDir = '/data/Aidan_Outputs/Jordan/';
let analyzedToday = [];
try {
  analyzedToday = fs.readdirSync(reportDir)
    .filter(function(f) { return f.startsWith('Grant_Report_' + today); })
    .map(function(f) {
      return f.replace('Grant_Report_' + today, '').replace(/^T[\d\-]+_/, '').replace(/_/g,' ').replace('.txt','').toLowerCase();
    });
} catch(e) { analyzedToday = []; }

const filesToProcess = grantFiles.filter(function(file) {
  const normalizedFile = file.replace(/_/g,' ').replace('.txt','').replace('.md','').toLowerCase();
  return !analyzedToday.some(function(done) {
    return done.indexOf(normalizedFile.substring(0,20)) !== -1;
  });
});

if (filesToProcess.length === 0) {
  const msg = 'JORDAN: All ' + grantFiles.length + ' grant files already analyzed today (' + today + ').\nFiles: ' + grantFiles.join(', ') + '\nSay Jordan grant tomorrow for fresh analysis.';
  const mb = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: msg } });
  const wo = { hostname: 'host.docker.internal', port: 8081, path: '/message/sendText/Aidan', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(mb) } };
  await new Promise(function(r) { const req = http.request(wo, function(res) { res.on('data',function(){}); res.on('end',r); }); req.on('error',r); req.write(mb); req.end(); });
  return [];
}

return filesToProcess.map(function(file) {
  let content = '';
  try { content = fs.readFileSync(dirPath + file, 'utf8'); } catch(e) { content = 'Could not read: ' + e.message; }
  return { json: { fileName: file, content: content, eafProfile: eafProfile, noFiles: false } };
});

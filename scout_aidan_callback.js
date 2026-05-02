const http = require('http');
const fs = require('fs');
const { summary = 'Scout complete.', fitScoreDisplay, query, mode, isScheduled, sourceLabel, confidence, supabaseLogged, supabaseStatus } = $input.first().json;

const modeLabel = mode?.toUpperCase() === 'GRANT' ? 'GRANT INTEL' : 'BD REPORT';

// Context-aware Supabase status -- check last successful log timestamp
let dbStatus = '';
const logPath = '/data/Aidan_Outputs/Scout/.supabase_last_success';
if (supabaseLogged) {
  // Write successful timestamp
  fs.mkdirSync('/data/Aidan_Outputs/Scout', { recursive: true });
  fs.writeFileSync(logPath, new Date().toISOString(), 'utf8');
  dbStatus = 'Logged to Supabase';
} else {
  // Check when it last succeeded
  let lastSuccess = null;
  try { lastSuccess = fs.readFileSync(logPath, 'utf8').trim(); } catch(e) {}
  if (lastSuccess) {
    const lastDate = new Date(lastSuccess);
    const now = new Date();
    const diffMin = Math.round((now - lastDate) / 60000);
    const timeLabel = diffMin < 60
      ? diffMin + 'm ago'
      : diffMin < 1440
        ? Math.round(diffMin/60) + 'h ago'
        : Math.round(diffMin/1440) + 'd ago';
    dbStatus = 'Supabase log skipped (last success: ' + timeLabel + ')';
  } else {
    dbStatus = 'Supabase log failed (no prior success today -- check service_role key)';
  }
}

const msgText = isScheduled
  ? 'SCOUT v5 MORNING SCAN LIVE\n' + (sourceLabel || 'Scheduled') + '\n\n' + summary + '\n\n' + dbStatus
  : 'SCOUT v5 ' + modeLabel + ' LIVE\nSource: ' + (sourceLabel || 'Manual') + '\n\n' + summary + '\n\n' + dbStatus;

const msgBody = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: msgText } });
const opts = { hostname: 'host.docker.internal', port: 8081, path: '/message/sendText/Aidan', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(msgBody) } };
await new Promise(function(r) { const req = http.request(opts, function(res) { res.on('data',function(){}); res.on('end',r); }); req.on('error',r); req.write(msgBody); req.end(); });

const cbBody = JSON.stringify({ agent: 'Scout', version: 'v5', summary, fitScore: fitScoreDisplay, query, mode, sourceLabel, confidence, isScheduled, liveSearch: true, supabaseLogged, timestamp: new Date().toISOString() });
const cbOpts = { hostname: 'host.docker.internal', port: 5678, path: '/webhook/aidan-callback', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(cbBody) } };
const cbReq = http.request(cbOpts, function(res) { res.on('data',function(){}); res.on('end',function(){}); });
cbReq.on('error',function(){});
cbReq.write(cbBody);
cbReq.end();

return [{ json: { success: true, agent: 'Scout', version: 'v5', summary, mode, sourceLabel, confidence, liveSearch: true, supabaseLogged, dbStatus } }];

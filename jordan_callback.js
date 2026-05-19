const http = require('http');
const input = $input.first().json;

const summary = input.summary || 'Jordan complete.';
const fitScoreDisplay = input.fitScoreDisplay || 'See report';
const fileName = input.fileName || 'Unknown';
const funder = input.funder || 'See report';
const action = input.action || 'Review report';
const deadline = input.deadline || 'UNCONFIRMED';
const loiDrafted = input.loiDrafted || false;
const supabaseLogged = input.supabaseLogged || false;
const outputPath = input.outputPath || '';

// ── PATCH: mission_path from trigger payload ──────────────────────────────────
// Nova Pursue v2 passes mission_path in the jordan payload.
// jordan_call_claude.js forwards it through. We use it to write chain update back.
const missionPath = input.mission_path || input.missionPath || null;
const pipelineId  = input.pipeline_id  || input.pipelineId  || null;

// Context-aware Supabase status
const fs = require('fs');
const logPath = '/data/Aidan_Outputs/Jordan/.supabase_last_success';
let dbStatus = '';
if (supabaseLogged) {
  fs.mkdirSync('/data/Aidan_Outputs/Jordan', { recursive: true });
  fs.writeFileSync(logPath, new Date().toISOString(), 'utf8');
  dbStatus = 'Logged to Supabase';
} else {
  let lastSuccess = null;
  try { lastSuccess = fs.readFileSync(logPath, 'utf8').trim(); } catch(e) {}
  if (lastSuccess) {
    const diffMin = Math.round((Date.now() - new Date(lastSuccess)) / 60000);
    const timeLabel = diffMin < 60 ? diffMin + 'm ago' : Math.round(diffMin/60) + 'h ago';
    dbStatus = 'Supabase log skipped (last success: ' + timeLabel + ')';
  } else {
    dbStatus = 'Supabase log failed';
  }
}

// ── PATCH: Write jordan_draft COMPLETE + nova_plan COMPLETE back to mission ──
// Fires against file server /mission/update. Fire-and-forget (non-blocking).
async function updateMissionChain(mPath) {
  if (!mPath) return { ok: false, reason: 'no mission_path' };
  const body = JSON.stringify({
    path: mPath,
    updates: {
      status: 'IN_PROGRESS',
      next_agent: 'Aidan',
      execution_chain: {
        nova_plan: 'COMPLETE',
        jordan_draft: 'COMPLETE',
      },
    },
    event: {
      agent: 'Jordan',
      action: 'JORDAN_DRAFT_COMPLETE',
      note: 'Capability statement/LOI drafted. File: ' + outputPath + ' | LOI: ' + (loiDrafted ? 'YES' : 'NO'),
    },
  });
  return new Promise(function(resolve) {
    const req = http.request(
      { hostname: '127.0.0.1', port: 3030, path: '/mission/update', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      function(res) {
        let d = '';
        res.on('data', function(c) { d += c; });
        res.on('end', function() {
          try { resolve({ ok: res.statusCode === 200, body: JSON.parse(d) }); }
          catch(e) { resolve({ ok: false, body: d }); }
        });
      }
    );
    req.on('error', function(e) { resolve({ ok: false, reason: e.message }); });
    req.setTimeout(5000, function() { req.destroy(); resolve({ ok: false, reason: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

// Attempt mission chain update — non-blocking
let chainUpdate = { ok: false, reason: 'not attempted' };
if (missionPath) {
  try { chainUpdate = await updateMissionChain(missionPath); } catch(e) { chainUpdate = { ok: false, reason: e.message }; }
} else {
  // Try to find mission by pipeline_id pattern if no explicit path
  // Fallback: scan Missions/ dir for matching pipeline_id (best-effort)
  chainUpdate = { ok: false, reason: 'no mission_path in payload — Nova must pass mission_path in jordan trigger' };
}

// FIX 2 -- Informative WhatsApp callback
const actionEmoji = action.toUpperCase().indexOf('APPLY') !== -1 ? 'APPLY' :
                    action.toUpperCase().indexOf('PASS') !== -1 ? 'PASS' : 'WATCH';

let msgText = 'JORDAN PIPELINE DRAFT COMPLETE\n\n';
msgText += 'Opportunity: ' + fileName + '\n';
msgText += 'Funder/Target: ' + funder + '\n';
msgText += 'Fit Score: ' + fitScoreDisplay + '\n';
msgText += 'Deadline: ' + deadline + '\n';
msgText += 'Action: ' + actionEmoji + '\n';
msgText += 'Draft: ' + (loiDrafted ? 'YES — ready for review' : 'Capability statement drafted') + '\n';
msgText += 'Mission chain: ' + (chainUpdate.ok ? 'UPDATED (jordan_draft=COMPLETE)' : 'NOT updated — ' + (chainUpdate.reason || 'see logs')) + '\n';
msgText += 'Next agent: Aidan\n';
msgText += 'Report: ' + outputPath + '\n';
msgText += dbStatus;

const msgBody = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: msgText } });
const msgOpts = {
  hostname: 'host.docker.internal', port: 8081,
  path: '/message/sendText/Aidan', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(msgBody) }
};
await new Promise(function(r) {
  const req = http.request(msgOpts, function(res) { res.on('data', function(){}); res.on('end', r); });
  req.on('error', r); req.write(msgBody); req.end();
});

// Aidan callback
const cbBody = JSON.stringify({
  agent: 'Jordan',
  summary: 'Opportunity: ' + fileName + ' | Fit: ' + fitScoreDisplay + ' | Action: ' + actionEmoji + ' | LOI: ' + (loiDrafted ? 'YES' : 'NO') + ' | Chain: ' + (chainUpdate.ok ? 'UPDATED' : 'PENDING'),
  fitScore: fitScoreDisplay,
  fileName: fileName,
  funder: funder,
  action: actionEmoji,
  loiDrafted: loiDrafted,
  supabaseLogged: supabaseLogged,
  missionChainUpdated: chainUpdate.ok,
  timestamp: new Date().toISOString()
});
const cbOpts = {
  hostname: 'host.docker.internal', port: 5678,
  path: '/webhook/aidan-callback', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(cbBody) }
};
const cbReq = http.request(cbOpts, function(res) { res.on('data', function(){}); res.on('end', function(){}); });
cbReq.on('error', function(){});
cbReq.write(cbBody);
cbReq.end();

return [{ json: {
  success: true, agent: 'Jordan', version: 'v3.2-chain',
  summary, supabaseLogged,
  missionChainUpdated: chainUpdate.ok,
  chainUpdateDetail: chainUpdate,
} }];

// AGENT EXECUTION LOGGER -- Reference Code
// Drop this at the START of each agent's first code node
// Change: agent name, trigger_type source, workflow_version
// Fields: id, created_at (auto), agent, trigger_type, status, duration_seconds,
//         items_processed, items_flagged, error_message, workflow_version,
//         output_file_path, whatsapp_delivered, email_delivered, notes

// ── SCOUT (Route + Build Task v5 node) ──────────────────────────────────────
const scout_exec = {
  agent: 'Scout',
  trigger_type: isScheduled ? 'scheduled' : 'manual',
  status: 'running',
  workflow_version: 'v5',
  notes: 'mode:' + mode
};

// ── JORDAN (Load Context + Grant Files node) ─────────────────────────────────
const jordan_exec = {
  agent: 'Jordan',
  trigger_type: isScheduled ? 'scheduled' : 'manual',
  status: 'running',
  workflow_version: 'v3',
  notes: 'grant_files:' + grantFiles.length
};

// ── IRIS (Iris Brain v3 node) ────────────────────────────────────────────────
const iris_exec = {
  agent: 'Iris',
  trigger_type: 'scheduled',
  status: 'running',
  workflow_version: 'v3',
  notes: 'tracking:' + deadlines.length
};

// ── ATLAS (Atlas node) ───────────────────────────────────────────────────────
const atlas_exec = {
  agent: 'Atlas',
  trigger_type: command ? 'manual' : 'scheduled',
  status: 'running',
  workflow_version: 'v3',
  notes: 'command:' + command
};

// ── NOVA (Parse RFP Input node) ──────────────────────────────────────────────
const nova_exec = {
  agent: 'Nova',
  trigger_type: 'manual',
  status: 'running',
  workflow_version: 'v1',
  notes: 'rfp:' + rfpName
};

// ── WRITE FUNCTION (same for all agents) ─────────────────────────────────────
async function logExecution(record) {
  const https = require('https');
  const SUPABASE_URL = $env.SUPABASE_URL || '';
  const SUPABASE_KEY = $env.SUPABASE_SERVICE_KEY || '';
  const hostname = SUPABASE_URL.replace('https://', '').replace('http://', '');
  try {
    const body = JSON.stringify(record);
    const result = await new Promise(function(resolve, reject) {
      const req = https.request({
        hostname: hostname, port: 443,
        path: '/rest/v1/agent_executions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Prefer': 'return=representation',
          'Content-Length': Buffer.byteLength(body)
        }
      }, function(res) {
        let d = '';
        res.on('data', function(c) { d += c; });
        res.on('end', function() { resolve({ status: res.statusCode, body: d }); });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    if (result.status === 201) {
      const rows = JSON.parse(result.body);
      return rows && rows[0] ? rows[0].id : null;
    }
    return null;
  } catch(e) {
    return null; // never break the workflow
  }
}

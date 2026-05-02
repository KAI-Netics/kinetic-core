const fs = require('fs'), http = require('http'), https = require('https');
const raw = $input.first().json;
const body = raw.body || raw;

const agentName = body.agent || 'Unknown';
const sessionId = body.sessionId || null;
const timestamp = body.timestamp || new Date().toISOString();

// Save this callback to disk
fs.mkdirSync('/data/Aidan_Outputs/Callbacks', { recursive: true });
const cbFile = `/data/Aidan_Outputs/Callbacks/${agentName}_${timestamp.replace(/[:.]/g,'-')}.json`;
fs.writeFileSync(cbFile, JSON.stringify(body, null, 2), 'utf8');

// ── SESSION-BASED MATCHING ───────────────────────────────────
// Find the most recent Orchestra session file
const orchDir = '/data/Aidan_Outputs/Orchestra/';
fs.mkdirSync(orchDir, { recursive: true });

let activeSessionId = null;
let sessionStartTime = null;

try {
  const sessionFiles = fs.readdirSync(orchDir)
    .filter(f => f.startsWith('session_') && f.endsWith('.json'))
    .map(f => ({ name: f, mtime: fs.statSync(orchDir + f).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (sessionFiles.length > 0) {
    const latestSession = JSON.parse(fs.readFileSync(orchDir + sessionFiles[0].name, 'utf8'));
    activeSessionId = latestSession.sessionId;
    sessionStartTime = new Date(latestSession.startTime).getTime();
  }
} catch(e) {}

// If no session file found, fall back to 10-minute time window
const useSessionMatching = activeSessionId !== null;
const fallbackCutoff = Date.now() - (10 * 60 * 1000);

// ── COLLECT MATCHING CALLBACKS ───────────────────────────────
const cbDir = '/data/Aidan_Outputs/Callbacks/';
const allFiles = fs.readdirSync(cbDir).filter(f => f.endsWith('.json'));
const matchedCallbacks = {};

allFiles.forEach(f => {
  try {
    const stat = fs.statSync(cbDir + f);
    const data = JSON.parse(fs.readFileSync(cbDir + f, 'utf8'));
    if (!data.agent) return;

    let isMatch = false;
    if (useSessionMatching) {
      // Match by sessionId — exact match only
      isMatch = data.sessionId === activeSessionId;
    } else {
      // Fallback: time window
      isMatch = stat.mtimeMs > fallbackCutoff;
    }

    if (isMatch) {
      // Keep most recent callback per agent for this session
      if (!matchedCallbacks[data.agent] || stat.mtimeMs > matchedCallbacks[data.agent]._mtime) {
        matchedCallbacks[data.agent] = { ...data, _mtime: stat.mtimeMs };
      }
    }
  } catch(e) {}
});

const required = ['Atlas', 'Scout', 'Jordan', 'Iris'];
const allFour = required.every(a => Object.keys(matchedCallbacks).includes(a));

if (!allFour) {
  const received = Object.keys(matchedCallbacks).filter(k => !k.startsWith('_'));
  const waiting = required.filter(a => !received.includes(a));
  return [{ json: {
    received: agentName,
    waiting: true,
    receivedSoFar: received,
    waitingFor: waiting,
    sessionId: activeSessionId,
    matchMode: useSessionMatching ? 'session' : 'time_window',
    allFour: false
  }}];
}

// ── ALL FOUR RECEIVED — SYNTHESIZE BRIEF ─────────────────────
const atlas  = matchedCallbacks['Atlas']  || {};
const scout  = matchedCallbacks['Scout']  || {};
const jordan = matchedCallbacks['Jordan'] || {};
const iris   = matchedCallbacks['Iris']   || {};

const systemMessage = `You are Aidan, Chief of Staff to Kevin Alexander Smith, CEO of KAI-Netics. Synthesize four agent reports into a single executive briefing for Kevin to READ and DECIDE -- not act on autonomously.

CRITICAL RULE: You are an intelligence and recommendation system only. You NEVER take outward action, send anything, file anything, submit anything, or contact anyone on Kevin's behalf. Every action item is a RECOMMENDATION for Kevin to approve. Never say "Aidan will file", "Aidan will send", "Aidan will submit", or any language implying autonomous outward action. Instead say "RECOMMENDED: Kevin to file", "RECOMMENDED: Kevin to send", "Pending Kevin approval".

STAFF CONTEXT:
- Atlas: Chief Architect -- platform intelligence, architecture, cost tracking
- Scout: BD Manager -- pipeline, targets, market intelligence
- Jordan: Grant Writer -- federal and state funding, LOIs, eligibility
- Iris: Compliance Officer -- deadlines, regulatory calendar, risk flags
- Kevin is the CEO. All recommendations go to him for approval.

Format: BLUF first. Entity-tagged action items. Decisive, concise. Priority: EAF compliance > FP revenue > MONK IP.

End every brief with an APPROVAL QUEUE listing any recommended outward actions that require Kevin explicit WhatsApp approval before anyone proceeds.`;

const userMessage = `Synthesize these four agent reports:\n\nATLAS:\n${atlas.summary||'No report'}\n\nSCOUT:\n${scout.summary||'No report'}\nFit: ${scout.fitScore||'N/A'}\n\nJORDAN:\n${jordan.summary||'No report'}\nFit: ${jordan.fitScore||'N/A'}\n\nIRIS:\n${iris.summary||'No report'}\nCritical: ${iris.criticalCount||0} | Urgent: ${iris.urgentCount||0}\n\nFormat:\n1. BLUF (3 sentences max)\n2. CRITICAL ACTIONS -- Kevin today\n3. RECOMMENDED ACTIONS -- Pending Kevin approval\n4. INTEL SUMMARY (key findings per agent)\n5. FLAGS & RISKS\n6. APPROVAL QUEUE (list anything needing Kevin WhatsApp approval to execute)`;

const requestBody = JSON.stringify({
  model: 'claude-opus-4-6',
  max_tokens: 2048,
  system: systemMessage,
  messages: [{ role: 'user', content: userMessage }]
});

const apiOptions = {
  hostname: 'api.anthropic.com',
  port: 443,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': $env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

const result = await new Promise((resolve, reject) => {
  const req = https.request(apiOptions, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => resolve({ status: res.statusCode, body: d }));
  });
  req.on('error', reject);
  req.write(requestBody);
  req.end();
});

let brief = '';
try {
  brief = JSON.parse(result.body).content?.[0]?.text || 'Consolidation failed.';
} catch(e) {
  brief = 'Parse error: ' + result.body.substring(0, 500);
}

// Save brief to disk
const briefPath = `/data/Aidan_Outputs/Orchestra/Brief_${new Date().toISOString().replace(/[:.]/g,'-')}.txt`;
fs.writeFileSync(briefPath, `SESSION: ${activeSessionId}\n\n${brief}`, 'utf8');

// Mark session as complete
if (activeSessionId) {
  try {
    const sessionFiles = fs.readdirSync(orchDir).filter(f => f.startsWith('session_') && f.endsWith('.json'));
    if (sessionFiles.length > 0) {
      const sessionFile = orchDir + sessionFiles.sort((a,b) => fs.statSync(orchDir+b).mtimeMs - fs.statSync(orchDir+a).mtimeMs)[0];
      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      sessionData.completed = true;
      sessionData.completedAt = new Date().toISOString();
      sessionData.briefPath = briefPath;
      fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2), 'utf8');
    }
  } catch(e) {}
}

// Deliver via WhatsApp
const fullMsg = `AIDAN CONSOLIDATED BRIEF\n${new Date().toLocaleString('en-US',{timeZone:'America/New_York'})} EST\nSession: ${activeSessionId}\n\n${brief}`;
const chunks = [];
for (let i = 0; i < fullMsg.length; i += 3800) chunks.push(fullMsg.substring(i, i + 3800));
for (const chunk of chunks) {
  const mb = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: chunk } });
  const wo = {
    hostname: 'host.docker.internal', port: 8081,
    path: '/message/sendText/Aidan', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(mb) }
  };
  await new Promise(r => {
    const req = http.request(wo, res => { res.on('data',()=>{}); res.on('end',r); });
    req.on('error',r); req.write(mb); req.end();
  });
  await new Promise(r => setTimeout(r, 1000));
}

return [{ json: { success: true, allFour: true, sessionId: activeSessionId, matchMode: useSessionMatching ? 'session' : 'time_window', briefPath } }];

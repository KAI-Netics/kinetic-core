const fs = require('fs'), http = require('http'), https = require('https');
const raw = $input.first().json;
const body = raw.body || raw;

const agentName = body.agent || 'Unknown';
const timestamp = body.timestamp || new Date().toISOString();
fs.mkdirSync('/data/Aidan_Outputs/Callbacks', { recursive: true });
fs.writeFileSync('/data/Aidan_Outputs/Callbacks/' + agentName + '_' + timestamp.replace(/[:.]/g,'-') + '.json', JSON.stringify(body, null, 2), 'utf8');

const cbDir = '/data/Aidan_Outputs/Callbacks/';
const allFiles = fs.readdirSync(cbDir).filter(function(f) { return f.endsWith('.json'); });
const cutoff = Date.now() - (5 * 60 * 1000);
const recentCallbacks = {};
allFiles.forEach(function(f) {
  try {
    const stat = fs.statSync(cbDir + f);
    if (stat.mtimeMs > cutoff) {
      const data = JSON.parse(fs.readFileSync(cbDir + f, 'utf8'));
      if (data.agent) recentCallbacks[data.agent] = data;
    }
  } catch(e) {}
});

const allFour = ['Atlas','Scout','Jordan','Iris'].every(function(a) { return Object.keys(recentCallbacks).includes(a); });
if (!allFour) {
  return [{ json: { received: agentName, waiting: true, receivedSoFar: Object.keys(recentCallbacks), allFour: false } }];
}

const atlas = recentCallbacks['Atlas'] || {};
const scout = recentCallbacks['Scout'] || {};
const jordan = recentCallbacks['Jordan'] || {};
const iris = recentCallbacks['Iris'] || {};

const systemMessage = `You are Aidan, Chief of Staff to Kevin Alexander Smith, CEO of KAI-Netics. Synthesize four agent reports into a single executive briefing for Kevin to READ and DECIDE -- not act on autonomously.

CRITICAL RULE: You are an intelligence and recommendation system only. You NEVER take outward action, send anything, file anything, submit anything, or contact anyone on Kevin's behalf. Every action item is a RECOMMENDATION for Kevin to approve. Never say "Aidan will file", "Aidan will send", "Aidan will submit", or any language implying autonomous outward action. Instead say "RECOMMENDED: Kevin to file", "RECOMMENDED: Kevin to send", "Pending Kevin approval".

STAFF CONTEXT:
- Atlas: Strategic Advisor -- big picture, SBIR, technology positioning
- Scout: BD Manager -- pipeline, targets, market intelligence
- Jordan: Grant Writer -- federal and state funding, LOIs, eligibility
- Iris: Compliance Officer -- deadlines, regulatory calendar, risk flags
- Kevin is the CEO. All recommendations go to him for approval.

Format: BLUF first. Entity-tagged action items. Decisive, concise. Priority: EAF compliance > FP revenue > MONK IP.

End every brief with an APPROVAL QUEUE listing any recommended outward actions that require Kevin's explicit WhatsApp approval before anyone proceeds.`;

const userMessage = 'Synthesize these four agent reports:\n\nATLAS:\n' + (atlas.summary||'No report') + '\n\nSCOUT:\n' + (scout.summary||'No report') + '\nFit: ' + (scout.fitScore||'N/A') + '\n\nJORDAN:\n' + (jordan.summary||'No report') + '\nFit: ' + (jordan.fitScore||'N/A') + '\n\nIRIS:\n' + (iris.summary||'No report') + '\nCritical: ' + (iris.criticalCount||0) + ' | Urgent: ' + (iris.urgentCount||0) + '\n\nFormat:\n1. BLUF (3 sentences max)\n2. CRITICAL ACTIONS -- Kevin today\n3. RECOMMENDED ACTIONS -- Pending Kevin approval\n4. INTEL SUMMARY (key findings per agent)\n5. FLAGS & RISKS\n6. APPROVAL QUEUE (list anything needing Kevin WhatsApp approval to execute)';

const ANTHROPIC_KEY = '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';
const requestBody = JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, system: systemMessage, messages: [{ role: 'user', content: userMessage }] });
const apiOptions = { hostname: 'api.anthropic.com', port: 443, path: '/v1/messages', method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(requestBody) } };

const result = await new Promise(function(resolve, reject) {
  const req = https.request(apiOptions, function(res) { let d = ''; res.on('data', function(c) { d += c; }); res.on('end', function() { resolve({ status: res.statusCode, body: d }); }); });
  req.on('error', reject); req.write(requestBody); req.end();
});

let brief = '';
try { brief = JSON.parse(result.body).content[0].text || 'Consolidation failed.'; } catch(e) { brief = 'Parse error: ' + result.body.substring(0,500); }

const briefPath = '/data/Aidan_Outputs/Orchestra/Brief_' + new Date().toISOString().replace(/[:.]/g,'-') + '.txt';
fs.mkdirSync('/data/Aidan_Outputs/Orchestra', { recursive: true });
fs.writeFileSync(briefPath, brief, 'utf8');

const fullMsg = 'AIDAN CONSOLIDATED BRIEF\n' + new Date().toLocaleString('en-US',{timeZone:'America/New_York'}) + ' EST\n\n' + brief;
const chunks = [];
for (let i = 0; i < fullMsg.length; i += 3800) chunks.push(fullMsg.substring(i, i + 3800));
for (let i = 0; i < chunks.length; i++) {
  const mb = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: chunks[i] } });
  const wo = { hostname: 'host.docker.internal', port: 8081, path: '/message/sendText/Aidan', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(mb) } };
  await new Promise(function(r) { const req = http.request(wo, function(res) { res.on('data',function(){}); res.on('end',r); }); req.on('error',r); req.write(mb); req.end(); });
  await new Promise(function(r) { setTimeout(r, 1000); });
}

return [{ json: { success: true, allFour: true, briefPath: briefPath } }];

const fs = require('fs'), http = require('http');
const raw = $input.first().json;
const body = raw.body || raw;

// If this is an agent callback, save it and exit
if (body.agent && ['Scout','Jordan','Iris','Atlas','Nova','Sage','Pulse'].includes(body.agent)) {
  fs.mkdirSync('/data/Aidan_Outputs/Callbacks', { recursive: true });
  const ts = body.timestamp || new Date().toISOString();
  fs.writeFileSync('/data/Aidan_Outputs/Callbacks/' + body.agent + '_' + ts.replace(/[:.]/g,'-') + '.json', JSON.stringify(body, null, 2), 'utf8');
  return [{ json: { _isCallback: true, agent: body.agent, saved: true } }];
}

const masterQuery = String(body.query || body.command || 'Full platform status');
const sessionId = 'orch_' + Date.now();
fs.mkdirSync('/data/Aidan_Outputs/Orchestra', { recursive: true });

// V1 TARGET ROTATION
// Profile: DMV infrastructure owner, non-discretionary federal inspection mandate,
// no existing drone vendor, Part 107 executable now, MBE/MWVOB advantage applies
// Scout works through this list one target per Orchestra run, building a dossier on each
const v1Targets = [
  { name: 'BGE', query: 'BGE Baltimore Gas Electric transmission line inspection vendor registration drone aerial 2026 NERC FAC-003 supplier diversity procurement contact' },
  { name: 'Pepco', query: 'Pepco Holdings Exelon DC Maryland transmission infrastructure inspection drone vendor 2026 NERC FAC-003 procurement supplier registration' },
  { name: 'Dominion Energy', query: 'Dominion Energy Virginia transmission infrastructure drone inspection vendor 2026 NERC FAC-003 supplier diversity procurement' },
  { name: 'SMECO', query: 'SMECO Southern Maryland Electric Cooperative infrastructure inspection vendor drone aerial 2026 procurement contact supplier' },
  { name: 'Washington Gas', query: 'Washington Gas pipeline infrastructure inspection vendor drone aerial 2026 PHMSA compliance procurement Maryland Virginia' },
  { name: 'MDSHA', query: 'Maryland State Highway Administration MDSHA bridge inspection drone aerial vendor registration 2026 FHWA procurement contact' },
  { name: 'VDOT', query: 'Virginia DOT VDOT bridge infrastructure drone inspection vendor 2026 FHWA compliance procurement supplier registration' },
  { name: 'WMATA', query: 'WMATA Washington Metro tunnel structure inspection drone vendor 2026 procurement supplier registration contact' },
  { name: 'Port of Baltimore', query: 'Port of Baltimore MDOT MPA infrastructure inspection drone aerial vendor 2026 procurement Maryland Port Administration' },
  { name: 'OMB M-26-02 Federal', query: 'OMB M-26-02 federal agency UAS drone compliance consulting May 2026 deadline contractor CISSP cybersecurity drone security assessment Maryland DC Virginia' }
];

// Read rotation state from disk -- advances one target per Orchestra run
const rotationPath = '/data/Aidan_Outputs/Orchestra/scout_rotation.json';
let rotationState = { index: 0 };
try { rotationState = JSON.parse(fs.readFileSync(rotationPath, 'utf8')); } catch(e) {}

const currentIndex = rotationState.index % v1Targets.length;
const currentTarget = v1Targets[currentIndex];

// Advance rotation for next run
rotationState.index = (currentIndex + 1) % v1Targets.length;
rotationState.lastTarget = currentTarget.name;
rotationState.lastRun = new Date().toISOString();
fs.writeFileSync(rotationPath, JSON.stringify(rotationState, null, 2), 'utf8');

fs.writeFileSync('/data/Aidan_Outputs/Orchestra/session_' + sessionId + '.json', JSON.stringify({
  sessionId, masterQuery, startTime: new Date().toISOString(),
  scoutTarget: currentTarget.name,
  agents: { Atlas: null, Scout: null, Jordan: null, Iris: null }
}, null, 2), 'utf8');

// Each agent gets a purpose-built directive
const agentCalls = [
  {
    path: '/webhook/atlas-architect',
    payload: { command: 'Atlas status', detail: 'Full strategic status -- compliance gaps, revenue path, MONK IP, SBIR positioning', sessionId }
  },
  {
    path: '/webhook/scout-research',
    payload: { query: currentTarget.query, sessionId, targetName: currentTarget.name, mode: 'bd' }
  },
  {
    path: '/webhook/grant-writer',
    payload: { trigger: 'orchestra', sessionId }
  },
  {
    path: '/webhook/iris-monitor',
    payload: { trigger: 'orchestra', sessionId }
  }
];

const fireAgent = function(agentPath, payload) {
  return new Promise(function(resolve) {
    const bodyStr = JSON.stringify(payload);
    const opts = {
      hostname: 'host.docker.internal', port: 5678, path: agentPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    };
    const req = http.request(opts, function(res) { res.on('data',function(){}); res.on('end', function() { resolve({ path: agentPath, fired: true }); }); });
    req.on('error', function(e) { resolve({ path: agentPath, fired: false, error: e.message }); });
    req.write(bodyStr); req.end();
  });
};

const results = await Promise.all(agentCalls.map(function(a) { return fireAgent(a.path, a.payload); }));
const agentNames = ['Atlas','Scout','Jordan','Iris'];

const launchMsg = 'ORCHESTRA LAUNCHED\n\n' +
  agentNames.map(function(a,i) { return (results[i].fired ? 'YES' : 'NO') + ' ' + a; }).join('\n') +
  '\n\nScout target: ' + currentTarget.name + ' (' + (currentIndex + 1) + '/' + v1Targets.length + ')' +
  '\nNext run: ' + (v1Targets[(currentIndex + 1) % v1Targets.length].name) +
  '\n\nConsolidated brief incoming ~90 seconds.';

const msgBody = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: launchMsg } });
const waOpts = {
  hostname: 'host.docker.internal', port: 8081,
  path: '/message/sendText/Aidan', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(msgBody) }
};
await new Promise(function(r) {
  const req = http.request(waOpts, function(res) { res.on('data',function(){}); res.on('end',r); });
  req.on('error',r); req.write(msgBody); req.end();
});

return [{ json: { sessionId, masterQuery, scoutTarget: currentTarget.name, results, launched: true } }];

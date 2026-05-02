const raw = $input.first().json;
const event = raw.event || raw.body?.event || 'no-event';
const data = raw.data || raw.body?.data || {};
const msgText = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
const t = msgText.toLowerCase().trim();
if (event !== 'messages.upsert') return [{ json: { reply: 'skip', phoneNumber: '14432576836@s.whatsapp.net', skip: true } }];
if (t.includes('bot reply:')) return [{ json: { reply: 'skip', phoneNumber: '14432576836@s.whatsapp.net', skip: true } }];
const agents = ['aidan','jordan','scout','iris','atlas','nova','sage','pulse','orchestra'];
if (!t || !agents.some(function(a) { return t.startsWith(a); })) return [{ json: { reply: 'skip', phoneNumber: '14432576836@s.whatsapp.net', skip: true } }];
const from = data.key?.remoteJid || data.remoteJid || '14432576836@s.whatsapp.net';
let reply = '';
const http = require('http');
const fs = require('fs');

const fireWebhook = async function(path, payload) {
  const bodyStr = JSON.stringify(payload);
  const opts = { hostname: 'host.docker.internal', port: 5678, path: path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } };
  await new Promise(function(r) { const req = http.request(opts, function(res) { res.on('data',function(){}); res.on('end',r); }); req.on('error',r); req.write(bodyStr); req.end(); });
};

const sendWhatsApp = async function(text, number) {
  const chunks = [];
  for (let i = 0; i < text.length; i += 3800) chunks.push(text.substring(i, i + 3800));
  for (let i = 0; i < chunks.length; i++) {
    const mb = JSON.stringify({ number: number, textMessage: { text: chunks[i] } });
    const wo = { hostname: 'host.docker.internal', port: 8081, path: '/message/sendText/Aidan', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(mb) } };
    await new Promise(function(r) { const req = http.request(wo, function(res) { res.on('data',function(){}); res.on('end',r); }); req.on('error',r); req.write(mb); req.end(); });
    if (chunks.length > 1) await new Promise(function(r) { setTimeout(r, 1000); });
  }
};

if (t.startsWith('orchestra')) {
  const query = t.replace(/^orchestra[,\s]*/i,'').trim() || 'Full platform status -- compliance, BD targets, grants, MEIA readiness';
  await fireWebhook('/webhook/aidan-orchestra', { query: query, from: from });
  reply = 'Bot reply: ORCHESTRA INITIATED\nFiring: Atlas + Scout + Jordan + Iris\nQuery: ' + query.substring(0,80) + '\n\nConsolidated brief incoming ~90 seconds.';

} else if (t.startsWith('aidan')) {
  const cmd = t.replace(/^aidan[,\s]*/i,'').trim();
  if (cmd === 'help' || cmd === '?') {
    reply = 'Bot reply: AIDAN v2 Commands\n\nAgents:\n* Atlas SBIR/MEIA/MONK/BVLOS/V1-V7/Kott prep\n* Scout [target]\n* Jordan grant\n* Iris deadlines\n* Nova [rfp text]\n* Sage board | Sage market\n* Pulse\n\nOrchestration:\n* Orchestra [query] -- fires ALL agents\n\nNewsletter Approval:\n* Sage send board -- sends EAF board newsletter\n* Sage send market -- sends FP market newsletter\n\nBriefings:\n* Aidan summary | Aidan status | Aidan help';
  } else if (cmd === 'summary') {
    try {
      const orchDir = '/data/Aidan_Outputs/Orchestra/';
      const files = fs.readdirSync(orchDir).filter(function(f) { return f.startsWith('Brief_') && f.endsWith('.txt'); }).sort().reverse();
      if (files.length === 0) {
        reply = 'Bot reply: No consolidated brief found yet. Say Orchestra to generate one.';
      } else {
        const content = fs.readFileSync(orchDir + files[0], 'utf8');
        const ts = files[0].replace('Brief_','').replace('.txt','').replace(/T/,' ').substring(0,16);
        const fullMsg = 'Bot reply: AIDAN SUMMARY\nBrief: ' + ts + ' UTC\n\n' + content;
        await sendWhatsApp(fullMsg, from);
        return [{ json: { reply: 'skip', phoneNumber: from, skip: true } }];
      }
    } catch(e) {
      reply = 'Bot reply: Error reading summary: ' + e.message;
    }
  } else if (cmd.includes('brief') || cmd.includes('status') || cmd.includes('morning')) {
    reply = 'Bot reply: ' + new Date().toLocaleString('en-US',{timeZone:'America/New_York'}) + ' EST\nAidan v2 online.\nAgents: Atlas + Scout + Jordan + Iris + Nova + Sage + Pulse\nSay Orchestra to fire all. Say Aidan help for menu.';
  } else {
    reply = 'Bot reply: Aidan received: ' + cmd + '\nSay Aidan help for full command menu.';
  }

} else if (t.startsWith('jordan')) {
  const cmd = t.replace(/^jordan[,\s]*/i,'').trim();
  if (cmd.includes('grant detail') || cmd.includes('grant report')) {
    try {
      const files = fs.readdirSync('/data/Aidan_Outputs/Jordan/').filter(function(f) { return f.startsWith('Grant_Report'); }).sort().reverse();
      if (files.length > 0) {
        const rpt = fs.readFileSync('/data/Aidan_Outputs/Jordan/' + files[0], 'utf8');
        reply = 'Bot reply: ' + rpt.substring(0,3500) + '\n(full report in Aidan_Outputs/Jordan)';
      } else reply = 'Bot reply: No grant reports found. Say Jordan grant to run analysis.';
    } catch(e) { reply = 'Bot reply: Error reading reports: ' + e.message; }
  } else {
    await fireWebhook('/webhook/grant-writer', { trigger: 'whatsapp', from: from });
    reply = 'Bot reply: Jordan Grant Writer running. Report ready ~45 seconds.';
  }

} else if (t.startsWith('scout')) {
  const cmd = t.replace(/^scout[,\s]*/i,'').trim() || 'Maryland drone infrastructure inspection contracts 2026';
  await fireWebhook('/webhook/scout-research', { query: cmd });
  reply = 'Bot reply: Scout running BD research: ' + cmd.substring(0,60) + '\nReport ready ~60 seconds.';

} else if (t.startsWith('iris')) {
  await fireWebhook('/webhook/iris-monitor', { trigger: 'whatsapp', from: from });
  reply = 'Bot reply: Iris compliance check running... ~15 seconds.';

} else if (t.startsWith('atlas')) {
  const cmd = t.replace(/^atlas[,\s]*/i,'').trim();
  const validCmds = ['sbir','meia','monk','bvlos','kott prep','status','v1','v2','v3','v4','v5','v6','v7'];
  const matched = validCmds.find(function(c) { return cmd.toLowerCase().startsWith(c); });
  const atlasCmd = 'Atlas ' + (matched ? matched.toUpperCase() : cmd || 'status');
  const detail = matched ? cmd.replace(new RegExp(matched,'i'),'').trim() : cmd;
  await fireWebhook('/webhook/atlas-architect', { command: atlasCmd, detail: detail || '' });
  reply = 'Bot reply: Atlas running: ' + atlasCmd + '\nReport ready ~45 seconds.';

} else if (t.startsWith('nova')) {
  const cmd = t.replace(/^nova[,\s]*/i,'').trim();
  if (cmd === 'send') {
    try {
      const files = fs.readdirSync('/data/Aidan_Outputs/Nova/').filter(function(f) { return f.endsWith('.txt'); }).sort().reverse();
      if (files.length > 0) {
        const latest = fs.readFileSync('/data/Aidan_Outputs/Nova/' + files[0], 'utf8');
        const subjectMatch = latest.match(/SUBJECT:([^\n]+)/i);
        const subject = subjectMatch ? subjectMatch[1].trim() : 'KAI-Netics Vendor Introduction';
        reply = 'Bot reply: NOVA SEND acknowledged.\nFile: ' + files[0] + '\nSubject: ' + subject + '\n\nForward draft manually from kas@kevin-llc.com to procurement contact.';
      } else {
        reply = 'Bot reply: No Nova RFP reports found to send.';
      }
    } catch(e) { reply = 'Bot reply: Nova send error: ' + e.message; }
  } else if (cmd === 'skip') {
    reply = 'Bot reply: NOVA SKIP recorded. RFP passed -- no action taken.';
  } else if (cmd.length > 10) {
    await fireWebhook('/webhook/nova-rfp', { rfp_name: 'WhatsApp Manual RFP', agency: 'Unknown', rfp_text: cmd, source: 'whatsapp' });
    reply = 'Bot reply: Nova RFP analysis running...\nReport ready ~60 seconds.';
  } else {
    reply = 'Bot reply: Nova commands:\n* Nova [rfp text] -- analyze RFP\n* Nova send -- approve awareness draft\n* Nova skip -- pass on latest RFP';
  }

} else if (t.startsWith('sage')) {
  const cmd = t.replace(/^sage[,\s]*/i,'').trim();

  if (cmd === 'send board' || cmd === 'sendboard') {
    await fireWebhook('/webhook/sage-send-board', { type: 'board' });
    reply = 'Bot reply: SAGE SEND BOARD fired.\nEmailing board now:\n* James L. Scott, Esq.\n* Keith Millard\n* Maurice Ellis\n\nConfirmation incoming ~15 seconds.';

  } else if (cmd === 'send market' || cmd === 'sendmarket') {
    await fireWebhook('/webhook/sage-send-market', { type: 'market' });
    reply = 'Bot reply: SAGE SEND MARKET fired.\nEmailing market list now.\n\nConfirmation incoming ~15 seconds.';

  } else if (cmd === 'board' || cmd.includes('board newsletter')) {
    await fireWebhook('/webhook/sage-newsletter', { type: 'board', source: 'whatsapp' });
    reply = 'Bot reply: Sage drafting EAF Board Newsletter (Opus)...\nPreview ready ~90 seconds.\nReply SAGE SEND BOARD to approve and send.';

  } else if (cmd === 'market' || cmd.includes('market newsletter')) {
    await fireWebhook('/webhook/sage-newsletter', { type: 'market', source: 'whatsapp' });
    reply = 'Bot reply: Sage drafting FP Market Newsletter (Opus)...\nPreview ready ~90 seconds.\nReply SAGE SEND MARKET to approve and send.';

  } else if (cmd === 'both') {
    await fireWebhook('/webhook/sage-newsletter', { type: 'both', source: 'whatsapp' });
    reply = 'Bot reply: Sage drafting both newsletters (Opus)...\nPreviews ready ~2 minutes.';

  } else {
    reply = 'Bot reply: Sage commands:\n* Sage board -- draft EAF board newsletter\n* Sage market -- draft FP market newsletter\n* Sage both -- draft both\n* Sage send board -- approve + email board\n* Sage send market -- approve + email market list';
  }

} else if (t.startsWith('pulse')) {
  await fireWebhook('/webhook/pulse-metrics', { trigger: 'whatsapp', from: from });
  reply = 'Bot reply: Pulse running platform metrics...\nDashboard ready ~20 seconds.';

} else {
  reply = 'Bot reply: Command not recognized. Say Aidan help for the full menu.';
}

return [{ json: { reply: reply, phoneNumber: from, skip: false } }];

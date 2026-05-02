const fs = require('fs');
const input = $input.first().json;
const type = input.type;

const TEST_MODE = true;
const TEST_EMAIL = 'kas42869@gmail.com';

const sageDir = '/data/Aidan_Outputs/Sage/';
let ctx = {};
try { ctx = JSON.parse(fs.readFileSync('/data/KAI_Context.json', 'utf8').replace(/^\uFEFF/, '')); } catch(e) { ctx = {}; }

const boardMembers = (ctx.eaf_board && ctx.eaf_board.members) ? ctx.eaf_board.members : [
  { name: 'James L. Scott, Esq.', email: 'jlslaw@yahoo.com' },
  { name: 'Keith Millard', email: 'keithrmillard@gmail.com' },
  { name: 'Maurice Ellis', email: 'bjet.1234@yahoo.com' }
];

const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });

let draftPath = null;
let draftContent = '';
let subject = '';
let toEmail = '';
let ccEmails = '';
let recipientDisplay = '';

if (type === 'board') {
  let files = [];
  try { files = fs.readdirSync(sageDir).filter(function(f) { return f.startsWith('Board_Newsletter') && f.endsWith('.txt'); }).sort().reverse(); } catch(e) { files = []; }
  if (files.length === 0) {
    return [{ json: { error: true, message: 'No board newsletter draft found. Say Sage board to generate one first.' } }];
  }
  draftPath = sageDir + files[0];
  draftContent = fs.readFileSync(draftPath, 'utf8');
  subject = (TEST_MODE ? '[TEST] ' : '') + 'EAF Board Newsletter -- ' + month;
  if (TEST_MODE) {
    toEmail = TEST_EMAIL;
    ccEmails = '';
    recipientDisplay = 'Kevin Smith TEST <' + TEST_EMAIL + '>';
  } else {
    toEmail = 'kas@kevin-llc.com';
    ccEmails = boardMembers.map(function(m) { return m.email; }).join(',');
    recipientDisplay = 'Kevin Smith <kas@kevin-llc.com>, ' + boardMembers.map(function(m) { return m.name + ' <' + m.email + '>'; }).join(', ');
  }
} else {
  let files = [];
  try { files = fs.readdirSync(sageDir).filter(function(f) { return f.startsWith('Market_Newsletter') && f.endsWith('.txt'); }).sort().reverse(); } catch(e) { files = []; }
  if (files.length === 0) {
    return [{ json: { error: true, message: 'No market newsletter draft found. Say Sage market to generate one first.' } }];
  }
  draftPath = sageDir + files[0];
  draftContent = fs.readFileSync(draftPath, 'utf8');
  subject = (TEST_MODE ? '[TEST] ' : '') + 'KAI-Netics Update -- ' + month;
  if (TEST_MODE) {
    toEmail = TEST_EMAIL;
    ccEmails = '';
    recipientDisplay = 'Kevin Smith TEST <' + TEST_EMAIL + '>';
  } else {
    toEmail = 'kas@kevin-llc.com';
    ccEmails = boardMembers.map(function(m) { return m.email; }).join(',');
    recipientDisplay = 'Kevin Smith <kas@kevin-llc.com>, ' + boardMembers.map(function(m) { return m.name + ' <' + m.email + '>'; }).join(', ');
  }
}

const safeContent = draftContent
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const headerColor = type === 'board' ? '#1a1a2e' : '#0a3d62';
const headerLabel = (TEST_MODE ? 'TEST -- ' : '') + (type === 'board' ? 'EAF Board Newsletter' : 'KAI-Netics Market Update');
const entityLine = type === 'board' ? 'KAI-Netics Equity &amp; Autonomy Foundry, Inc. | EIN: 41-4820296' : 'Kevin Alexander International LLC dba KAI-Netics';

const htmlBody =
  (TEST_MODE ? '<div style="background:#ff6600;padding:10px;text-align:center"><strong style="color:#fff">TEST MODE -- Board members NOT notified</strong></div>' : '') +
  '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">' +
  '<div style="background:' + headerColor + ';padding:24px;border-radius:8px 8px 0 0">' +
  '<h1 style="color:#00d4ff;margin:0;font-size:20px">KAI-Netics</h1>' +
  '<p style="color:#8888aa;margin:4px 0 0 0;font-size:13px">' + headerLabel + ' | ' + month + '</p>' +
  '</div>' +
  '<div style="background:#ffffff;padding:28px;border:1px solid #e0e0e0">' +
  '<p style="color:#555;font-size:12px;margin:0 0 16px 0">' + entityLine + '</p>' +
  '<div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#222">' + safeContent + '</div>' +
  '</div>' +
  '<div style="background:' + headerColor + ';padding:16px;border-radius:0 0 8px 8px;text-align:center">' +
  '<p style="color:#8888aa;margin:0;font-size:12px">Kevin Alexander Smith | KAI-Netics | kas@kevin-llc.com | 443.257.6836</p>' +
  '<p style="color:#8888aa;margin:4px 0 0 0;font-size:11px">FAA Part 107 Certified | MWVOB</p>' +
  '</div></div>';

// Store all fields in $node context so Log + WhatsApp Confirm can read them
// even after Send via SMTP swallows this node's output
$workflow.variables = $workflow.variables || {};

return [{ json: {
  type: type,
  testMode: TEST_MODE,
  subject: subject,
  htmlBody: htmlBody,
  toEmail: toEmail,
  ccEmails: ccEmails,
  recipientDisplay: recipientDisplay,
  draftPath: draftPath,
  month: month
}}];

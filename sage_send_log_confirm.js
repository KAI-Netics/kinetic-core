const fs = require('fs');
const http = require('http');

// Read from Load Draft + Build Email directly -- Send via SMTP swallows that node's output
const draft = $('Load Draft + Build Email').first().json;

if (draft.error) {
  const errMsg = 'SAGE SEND ERROR: ' + draft.message;
  const errBody = JSON.stringify({ number: '14432576836@s.whatsapp.net', textMessage: { text: errMsg } });
  const errOpts = { hostname: 'host.docker.internal', port: 8081, path: '/message/sendText/Aidan', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(errBody) } };
  await new Promise(function(r) { const req = http.request(errOpts, function(res) { res.on('data',function(){}); res.on('end',r); }); req.on('error',r); req.write(errBody); req.end(); });
  return [{ json: { success: false, error: draft.message } }];
}

const type = draft.type || 'unknown';
const testMode = draft.testMode || false;
const subject = draft.subject || '(no subject)';
const toEmail = draft.toEmail || '(no recipient)';
const ccEmails = draft.ccEmails || '';
const recipientDisplay = draft.recipientDisplay || toEmail;
const draftPath = draft.draftPath || '';

const logPrefix = type === 'board' ? 'BOARD' : 'MARKET';
const testTag = testMode ? '_TEST' : '';
const logPath = '/data/Aidan_Outputs/Sage/' + logPrefix + testTag + '_SENT_' + new Date().toISOString().replace(/[:.]/g,'-') + '.log';
const logContent = 'Sent: ' + new Date().toISOString() + '\nType: ' + type + '\nTest: ' + testMode + '\nSubject: ' + subject + '\nTo: ' + toEmail + '\nCC: ' + ccEmails + '\nRecipients: ' + recipientDisplay + '\nDraft: ' + draftPath + '\n';

fs.mkdirSync('/data/Aidan_Outputs/Sage', { recursive: true });
fs.writeFileSync(logPath, logContent, 'utf8');

let confirmMsg = (testMode ? 'SAGE TEST EMAIL SENT' : 'SAGE EMAIL SENT') + '\n\n';
confirmMsg += 'Type: ' + (type === 'board' ? 'EAF Board Newsletter' : 'FP Market Newsletter') + '\n';
confirmMsg += 'Subject: ' + subject + '\n';
confirmMsg += 'To: ' + recipientDisplay + '\n';
confirmMsg += 'Draft: ' + draftPath + '\n';
if (testMode) {
  confirmMsg += '\nTEST MODE ON\nOnly kas42869@gmail.com notified.\nSet TEST_MODE=false in Load Draft node for real send.';
}

const wa = '14432576836@s.whatsapp.net';
const msgBody = JSON.stringify({ number: wa, textMessage: { text: confirmMsg } });
const opts = { hostname: 'host.docker.internal', port: 8081, path: '/message/sendText/Aidan', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'Kevin2026', 'Content-Length': Buffer.byteLength(msgBody) } };
await new Promise(function(r) {
  const req = http.request(opts, function(res) { res.on('data',function(){}); res.on('end',r); });
  req.on('error',r); req.write(msgBody); req.end();
});

return [{ json: { success: true, type: type, testMode: testMode, subject: subject, to: toEmail, logPath: logPath } }];

const https = require('https');
const input = $input.first().json;

const systemMessage = input.systemMessage;
const userMessage = input.userMessage;
const fileName = input.fileName;

const ANTHROPIC_KEY = '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';

const requestBody = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: systemMessage,
  messages: [{ role: 'user', content: userMessage }]
});

const options = {
  hostname: 'api.anthropic.com',
  port: 443,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

const result = await new Promise(function(resolve, reject) {
  const req = https.request(options, function(res) {
    let d = '';
    res.on('data', function(c) { d += c; });
    res.on('end', function() { resolve({ status: res.statusCode, body: d }); });
  });
  req.on('error', reject);
  req.write(requestBody);
  req.end();
});

let aiOutput = '';
try { aiOutput = JSON.parse(result.body).content[0].text || 'No response.'; } catch(e) { aiOutput = result.body.substring(0, 500); }

return [{ json: { aiOutput: aiOutput, fileName: fileName, status: result.status } }];

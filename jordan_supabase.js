const https = require('https');
const input = $input.first().json;

const SUPABASE_URL = 'https://raxpmeltyxmtiihxoxpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheHBtZWx0eXhtdGlpaHhveHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc4MjkwMiwiZXhwIjoyMDkyMzU4OTAyfQ.crvqKgKtkWl5tSzBXAj2UV_JUfKIYG-SdDz_QpcM1iM';

let actionCode = null;
if (input.action) {
  const a = input.action.toUpperCase();
  if (a.indexOf('APPLY') !== -1) { actionCode = 'APPLY'; }
  else if (a.indexOf('PASS') !== -1) { actionCode = 'PASS'; }
  else if (a.indexOf('WATCH') !== -1) { actionCode = 'WATCH'; }
}

const record = {
  grant_file: input.fileName,
  funder: input.funder !== 'See report' ? input.funder : null,
  fit_score: input.fitScore || null,
  recommended_action: actionCode,
  loi_drafted: input.loiDrafted || false,
  jordan_report_path: input.outputPath,
  application_status: 'analyzing',
  entity: 'EAF'
};

try {
  const body = JSON.stringify(record);
  const result = await new Promise(function(resolve, reject) {
    const req = https.request({
      hostname: 'raxpmeltyxmtiihxoxpa.supabase.co',
      port: 443,
      path: '/rest/v1/grant_applications',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'resolution=merge-duplicates',
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

  const logged = result.status === 201 || result.status === 200;
  const out = Object.assign({}, input);
  out.supabaseLogged = logged;
  out.supabaseStatus = result.status;
  return [{ json: out }];

} catch(e) {
  const out = Object.assign({}, input);
  out.supabaseLogged = false;
  out.supabaseError = e.message;
  return [{ json: out }];
}

const https = require('https');
const { summary, fitScore, action, mode, sourceLabel, confidence, targetName, contentHash, savedTo, query, timestamp } = $input.first().json;

const SUPABASE_URL = 'https://raxpmeltyxmtiihxoxpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheHBtZWx0eXhtdGlpaHhveHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc4MjkwMiwiZXhwIjoyMDkyMzU4OTAyfQ.crvqKgKtkWl5tSzBXAj2UV_JUfKIYG-SdDz_QpcM1iM';

const record = {
  run_date: new Date().toISOString().slice(0,10),
  mode: mode || 'bd',
  source_label: sourceLabel,
  query: query ? query.substring(0, 500) : null,
  target_name: targetName,
  fit_score: fitScore || null,
  recommended_action: action ? action.substring(0, 100) : null,
  data_confidence: confidence ? confidence.substring(0, 50) : null,
  saved_file_path: savedTo,
  content_hash: contentHash,
  status: 'new'
};

try {
  const body = JSON.stringify(record);
  const result = await new Promise(function(resolve, reject) {
    const req = https.request({
      hostname: 'raxpmeltyxmtiihxoxpa.supabase.co',
      port: 443,
      path: '/rest/v1/scout_reports',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
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
  return [{ json: { ...$input.first().json, supabaseLogged: logged, supabaseStatus: result.status } }];

} catch(e) {
  return [{ json: { ...$input.first().json, supabaseLogged: false, supabaseError: e.message } }];
}

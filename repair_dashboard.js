// repair_dashboard.js
// Fixes encoding corruption AND applies field mapping patches in one pass
// Run: docker exec kinetic-core-n8n node /data/repair_dashboard.js

const fs = require('fs');
let html = fs.readFileSync('/data/DASHBOARD.html', 'utf8');
const originalLength = html.length;

// ── STEP 1: Fix Windows-1252 double-encoded UTF-8 ────────────────────────────
// Each entry: [corrupted string, correct character]
const encodingFixes = [
  ['\u00C2\u00B7', '\u00B7'],        // Â· → ·
  ['\u00E2\u0080\u0094', '\u2014'],  // â€" → —
  ['\u00E2\u0080\u0093', '\u2013'],  // â€" → –
  ['\u00E2\u0096\u00B6', '\u25B6'],  // â–¶ → ▶
  ['\u00E2\u0097\u0089', '\u25C9'],  // â—‰ → ◉
  ['\u00E2\u00AC\u00A1', '\u2B21'],  // â¬¡ → ⬡
  ['\u00E2\u009A\u00A1', '\u26A1'],  // âš¡ → ⚡
  ['\u00E2\u0080\u0098', '\u2018'],  // â€˜ → '
  ['\u00E2\u0080\u0099', '\u2019'],  // â€™ → '
  ['\u00E2\u0080\u009C', '\u201C'],  // â€œ → "
  ['\u00E2\u0080\u009D', '\u201D'],  // â€ → "
  ['\u00C3\u00A9', '\u00E9'],        // Ã© → é
  ['\u00E2\u0080\u00A2', '\u2022'],  // â€¢ → •
  ['\u00E2\u0080\u00A6', '\u2026'],  // â€¦ → …
  ['\u00C2\u00A0', '\u00A0'],        // Â  → non-breaking space
  ['\u00C2\u00AE', '\u00AE'],        // Â® → ®
  ['\u00C2\u00B0', '\u00B0'],        // Â° → °
  ['\u00E2\u0086\u0092', '\u2192'],  // â†' → →
  ['\u00E2\u009C\u0085', '\u2705'],  // â€¦ → ✅
  ['\u00E2\u009A\u00A0', '\u26A0'],  // âš  → ⚠
  ['\u00F0\u009F\u0094\u00B4', '\uD83D\uDD34'], // 🔴
  ['\u00F0\u009F\u0094\u00B5', '\uD83D\uDD35'], // 🔵
  ['\u00F0\u009F\u009F\u00A2', '\uD83D\uDFE2'], // 🟢
  ['\u00F0\u009F\u009F\u00A1', '\uD83D\uDFE1'], // 🟡
  ['\u00F0\u009F\u009F\u00A0', '\uD83D\uDFE0'], // 🟠
  ['\u00C2\u00B6', '\u00B6'],        // Â¶ → ¶
  ['\u00C3\u00B3', '\u00F3'],        // Ã³ → ó
  ['\u00C3\u00A1', '\u00E1'],        // Ã¡ → á
  ['\u00C3\u00BA', '\u00FA'],        // Ãº → ú
];

encodingFixes.forEach(([bad, good]) => {
  html = html.split(bad).join(good);
});

// ── STEP 2: Field mapping patches ────────────────────────────────────────────
// why_it_matters → read from o.why_this_matters first
html = html.replace(
  'why_it_matters:isOMB?',
  'why_it_matters:o.why_this_matters||(isOMB?'
);

// kai_fit → read from o.why_kai_fits first
html = html.replace(
  'kai_fit:isOMB?',
  'kai_fit:o.why_kai_fits||(isOMB?'
);

// next_action → read from o.recommended_next_action first
html = html.replace(
  'next_action:isOMB?',
  'next_action:o.recommended_next_action||(isOMB?'
);

// contact_path → read new fields: organization, contact_name, phone, portal
html = html.replace(
  "contact_path:{organization:o.issuing_body||'Needs validation',office:'',contact_name:o.contact_poc||'Needs validation',email:o.contact_email||'Needs validation',phone:'',website:o.source_url||'',portal:o.source_url||'',notes:o.last_contact_notes||''}",
  "contact_path:{organization:o.organization||o.issuing_body||'Needs validation',office:'',contact_name:o.contact_name||o.contact_poc||'Needs validation',email:o.contact_email||'Needs validation',phone:o.contact_phone||'',website:o.source_url||'',portal:o.application_portal||o.source_url||'',notes:o.last_contact_notes||''}"
);

// pursuit_steps → parse JSON array from Supabase if available
html = html.replace(
  'pursuit_plan:isOMB?[',
  "pursuit_plan:(o.pursuit_steps&&typeof o.pursuit_steps==='string'?JSON.parse(o.pursuit_steps).map(function(s,i){return{step_id:i+1,title:s,description:'',status:'not_started',owner:'Kevin',due_date:'',notes:''};}):(o.pursuit_steps&&Array.isArray(o.pursuit_steps)?o.pursuit_steps.map(function(s,i){return{step_id:i+1,title:s,description:'',status:'not_started',owner:'Kevin',due_date:'',notes:''};}):(isOMB?["
);

// ── STEP 3: Write once, UTF-8, no BOM ────────────────────────────────────────
fs.writeFileSync('/data/DASHBOARD.html', html, { encoding: 'utf8' });

console.log('Dashboard repaired.');
console.log('Length before: ' + originalLength);
console.log('Length after:  ' + html.length);
console.log('Encoding fixes applied.');
console.log('Field mapping patches applied.');

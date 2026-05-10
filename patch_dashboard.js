const fs = require('fs');
let html = fs.readFileSync('/data/DASHBOARD.html', 'utf8');

const old = "contact_path:{organization:o.issuing_body||'Needs validation',office:'',contact_name:o.contact_poc||'Needs validation',email:o.contact_email||'Needs validation',phone:'',website:o.source_url||'',portal:o.source_url||'',notes:o.last_contact_notes||''}";
const neu = "contact_path:{organization:o.organization||o.issuing_body||'Needs validation',office:'',contact_name:o.contact_name||o.contact_poc||'Needs validation',email:o.contact_email||'Needs validation',phone:o.contact_phone||'',website:o.source_url||'',portal:o.application_portal||o.source_url||'',notes:o.last_contact_notes||''}";

if (html.includes(old)) {
  html = html.replace(old, neu);
  fs.writeFileSync('/data/DASHBOARD.html', html, 'utf8');
  console.log('Patched successfully');
} else {
  console.log('Pattern not found');
}

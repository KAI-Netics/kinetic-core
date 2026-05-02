const fs = require('fs');

// Read raw bytes
let raw = fs.readFileSync('/data/KAI_Context.json', 'utf8');

// Strip BOM only
raw = raw.replace(/^\uFEFF/, '');

// Fix ONLY the specific mojibake sequences that appear in string VALUES
// Do targeted replacements that won't break JSON structure
// â€" is UTF-8 em-dash (U+2014) misread as Windows-1252
// We replace inside quoted strings only by working char by char

// Safe approach: replace the specific byte sequences
// These only appear inside JSON string values, not in structural chars
const fixes = [
  ['â€"', '--'],
  ['â€™', "'"],
  ['â€œ', '"'],
  ['â€', '"'],
  ['â€¢', '*'],
  ['â€˜', "'"],
  ['Ã©', 'e'],
  ['Ã ', 'a'],
  ['â€˜', "'"]
];

let fixed = raw;
for (let i = 0; i < fixes.length; i++) {
  fixed = fixed.split(fixes[i][0]).join(fixes[i][1]);
}

// Test parse
try {
  JSON.parse(fixed);
  console.log('JSON valid after encoding fix');
  fs.writeFileSync('/data/KAI_Context.json', fixed, 'utf8');
  console.log('OK: KAI_Context.json written');
} catch(e) {
  console.log('ERROR: JSON still invalid: ' + e.message);
  // Find the problem area
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  console.log('Context around position ' + pos + ':');
  console.log(fixed.substring(Math.max(0, pos-50), pos+50));
  process.exit(1);
}

// Now add date to Atlas node
const atlas = JSON.parse(fs.readFileSync('/data/workflows/1_atlas_v2.json', 'utf8'));
const node = atlas.nodes.find(function(n){ return n.id === 'atlas-002'; });
if(!node){ console.log('SKIP: atlas-002 not found'); process.exit(0); }

if(node.parameters.jsCode.indexOf('todayStr') === -1) {
  const dateLines = "const todayStr = new Date().toLocaleDateString('en-US', {timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});\nconst nowStr = new Date().toLocaleString('en-US', {timeZone: 'America/New_York'});\n\n";
  node.parameters.jsCode = node.parameters.jsCode.replace(
    "const raw = \$input.first().json;",
    dateLines + "const raw = \$input.first().json;"
  );
  node.parameters.jsCode = node.parameters.jsCode.replace(
    "'KAI-NETICS CONTEXT\\n'",
    "'TODAY: ' + todayStr + '\\n\\nKAI-NETICS CONTEXT\\n'"
  );
  fs.writeFileSync('/data/workflows/1_atlas_v2.json', JSON.stringify(atlas, null, 2), 'utf8');
  console.log('OK: Date injection added to atlas-002');
} else {
  console.log('SKIP: Date already in atlas-002');
}
console.log('DONE');

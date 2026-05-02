const fs = require('fs');

// ── Fix 1: Clean KAI_Context.json encoding corruption ─────────────────────
console.log('Fixing KAI_Context.json encoding...');
let raw = fs.readFileSync('/data/KAI_Context.json', 'utf8');

// Strip BOM
raw = raw.replace(/^\uFEFF/, '');

// Fix Windows-1252 mojibake sequences
raw = raw.replace(/â€"/g, '--');
raw = raw.replace(/â€™/g, "'");
raw = raw.replace(/â€œ/g, '"');
raw = raw.replace(/â€/g, '"');
raw = raw.replace(/â€¢/g, '*');
raw = raw.replace(/Ã©/g, 'e');
raw = raw.replace(/Ã /g, 'a');

// Validate JSON
let ctx;
try {
  ctx = JSON.parse(raw);
  console.log('JSON valid after encoding fix');
} catch(e) {
  console.log('ERROR: JSON invalid after fix: ' + e.message);
  process.exit(1);
}

fs.writeFileSync('/data/KAI_Context.json', JSON.stringify(ctx, null, 2), 'utf8');
console.log('OK: KAI_Context.json encoding fixed and written');

// ── Fix 2: Update Atlas Load Context node to inject today date ────────────
console.log('Updating Atlas node with date injection...');
const atlas = JSON.parse(fs.readFileSync('/data/workflows/1_atlas_v2.json', 'utf8'));
const node = atlas.nodes.find(function(n){ return n.id === 'atlas-002'; });
if(!node){ console.log('ERROR: atlas-002 not found'); process.exit(1); }

// Add today's date to the companyContext string in the existing code
const dateInjection = "const todayStr = new Date().toLocaleDateString('en-US', {timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});\nconst nowStr = new Date().toLocaleString('en-US', {timeZone: 'America/New_York'});\n";

// Find insertion point after the BOM strip line
const insertAfter = "} catch(e) { ctx = {}; }\n";
if(node.parameters.jsCode.indexOf(insertAfter) !== -1 && node.parameters.jsCode.indexOf('todayStr') === -1) {
  node.parameters.jsCode = node.parameters.jsCode.replace(insertAfter, insertAfter + '\n' + dateInjection);
  
  // Add date to companyContext string
  node.parameters.jsCode = node.parameters.jsCode.replace(
    "'KAI-NETICS CONTEXT\\n'",
    "'TODAY: ' + todayStr + ' | TIME: ' + nowStr + '\\n\\nKAI-NETICS CONTEXT\\n'"
  );
  
  fs.writeFileSync('/data/workflows/1_atlas_v2.json', JSON.stringify(atlas, null, 2), 'utf8');
  console.log('OK: Date injection added to atlas-002');
} else if(node.parameters.jsCode.indexOf('todayStr') !== -1) {
  console.log('SKIP: Date injection already present');
} else {
  console.log('WARN: Insert point not found -- manual update needed');
}

console.log('DONE');

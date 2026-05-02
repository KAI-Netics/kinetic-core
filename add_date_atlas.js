const fs = require('fs');
const atlas = JSON.parse(fs.readFileSync('/data/workflows/1_atlas_v2.json', 'utf8'));
const node = atlas.nodes.find(function(n){ return n.id === 'atlas-002'; });
if (!node) { console.log('ERROR: atlas-002 not found'); process.exit(1); }
if (node.parameters.jsCode.indexOf('todayStr') !== -1) { console.log('SKIP: already present'); process.exit(0); }
const d = "const todayStr = new Date().toLocaleDateString('en-US', {timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});\nconst nowStr = new Date().toLocaleString('en-US', {timeZone: 'America/New_York'});\n\n";
node.parameters.jsCode = node.parameters.jsCode.replace('const raw = $input.first().json;', d + 'const raw = $input.first().json;');
node.parameters.jsCode = node.parameters.jsCode.replace("'KAI-NETICS CONTEXT\\n'", "'TODAY: ' + todayStr + '\\n\\nKAI-NETICS CONTEXT\\n'");
fs.writeFileSync('/data/workflows/1_atlas_v2.json', JSON.stringify(atlas, null, 2), 'utf8');
console.log('OK: Date injection added to atlas-002');

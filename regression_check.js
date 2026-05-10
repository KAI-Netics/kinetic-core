const fs = require('fs');
const h = fs.readFileSync('/data/DASHBOARD.html', 'utf8');

const checks = [
  // Views
  ['Morning Brief view', h.includes('morning-brief') || h.includes('Morning Brief')],
  ['Platform Ops view', h.includes('platform-ops') || h.includes('Platform Ops')],
  ['Inspection/Dossier view', h.includes('inspection') || h.includes('Inspection')],
  ['Command view', h.includes('command') || h.includes('Command')],

  // Core engine
  ['Supabase URL configured', h.includes('raxpmeltyxmtiihxoxpa.supabase.co')],
  ['Supabase anon key present', h.includes('SUPABASE_KEY')],
  ['localStorage persistence', h.includes('localStorage')],
  ['Disconnected ops / local snapshot', h.includes('snapshot') || h.includes('local') && h.includes('feed')],
  ['Pipeline refresh function', h.includes('loadPipeline') || h.includes('refreshPipeline')],
  ['Dossier engine', h.includes('buildDefaultDossier') || h.includes('dossier')],
  ['Agent fire buttons', h.includes('fireAgent') || h.includes('fire-agent') || h.includes('fireScout')],
  ['WhatsApp bridge config', h.includes('whatsapp') || h.includes('WhatsApp')],
  ['n8n webhook calls', h.includes('localhost:5678') || h.includes('n8n')],

  // Encoding clean
  ['No corrupted em-dash', !h.includes('â€"')],
  ['No corrupted middle-dot', !h.includes('Â·')],
  ['No corrupted arrows', !h.includes('â–¶')],

  // Scout fields
  ['source_url field read', h.includes('source_url')],
  ['fit_score field read', h.includes('fit_score')],
  ['classification field read', h.includes('classification') || h.includes('pursuit')],

  // File integrity
  ['File size reasonable', h.length > 50000],
  ['Has closing html tag', h.includes('</html>')],
];

let passed = 0, failed = 0;
checks.forEach(([name, result]) => {
  const icon = result ? '✅' : '❌';
  console.log(icon + ' ' + name);
  result ? passed++ : failed++;
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
console.log('File length: ' + h.length + ' chars');

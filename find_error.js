const fs = require('fs');
const h = fs.readFileSync('/data/DASHBOARD.html', 'utf8');
const s = h.substring(h.lastIndexOf('<script>') + 8, h.lastIndexOf('</script>'));

// Binary search for error line
const lines = s.split('\n');
let lo = 0, hi = lines.length;
while (hi - lo > 1) {
  const mid = Math.floor((lo + hi) / 2);
  try { new Function(lines.slice(0, mid).join('\n')); lo = mid; }
  catch(e) { hi = mid; }
}
console.log('Error at line ~' + hi);
for (let i = Math.max(0, hi-3); i <= Math.min(lines.length-1, hi+2); i++) {
  console.log(i + ': ' + lines[i]);
}

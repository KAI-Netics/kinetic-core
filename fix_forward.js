const fs = require('fs');
let h = fs.readFileSync('/data/DASHBOARD.html', 'utf8');

// The patches added ||(isOMB? but the original code was isOMB?X:Y
// Now it reads: o.new_field||(isOMB?X:Y  -- missing closing )
// We need to find each and add the closing paren after the fallback value

// Find and fix why_it_matters
h = h.replace(
  /why_it_matters:o\.why_this_matters\|\|\(isOMB\?'([^']+)':'([^']+)'\)/g,
  "why_it_matters:o.why_this_matters||(isOMB?'$1':'$2')"
);

// More robust: find the pattern and check if it already has closing paren
// The original was: why_it_matters:isOMB?'...':(o.fit_rationale||...)
// The patch made it: why_it_matters:o.why_this_matters||(isOMB?'...':(o.fit_rationale||...)
// Missing the closing ) at the end of the ternary

// Find exact broken patterns and fix
const fixes = [
  ['why_it_matters:o.why_this_matters||(isOMB?', 'why_it_matters:isOMB?'],
  ['kai_fit:o.why_kai_fits||(isOMB?', 'kai_fit:isOMB?'],
  ['next_action:o.recommended_next_action||(isOMB?', 'next_action:isOMB?'],
];

fixes.forEach(([broken, original]) => {
  if (h.includes(broken)) {
    h = h.replace(broken, original);
    console.log('Reverted: ' + broken.substring(0, 30));
  }
});

fs.writeFileSync('/data/DASHBOARD.html', h, 'utf8');

// Verify JS syntax
try {
  const s = h.substring(h.lastIndexOf('<script>') + 8, h.lastIndexOf('</script>'));
  new Function(s);
  console.log('JS syntax: OK');
} catch(e) {
  console.log('JS syntax ERROR: ' + e.message);
}

// Verify encoding
console.log('Em-dash clean:', !h.includes('â€"'));
console.log('Middle-dot clean:', !h.includes('Â·'));
console.log('Contact patch intact:', h.includes('contact_name:o.contact_name||o.contact_poc'));

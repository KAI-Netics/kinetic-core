const fs = require('fs');
let html = fs.readFileSync('/data/DASHBOARD.html', 'utf8');
const before = html.length;

// Fix Windows-1252 double-encoded UTF-8 characters
const fixes = [
  ['\u00C2\u00B7', '\u00B7'],        // Â· -> ·
  ['\u00E2\u0080\u0094', '\u2014'],  // â€" -> —
  ['\u00E2\u0080\u0093', '\u2013'],  // â€" -> –
  ['\u00E2\u0096\u00B6', '\u25B6'],  // â–¶ -> ▶
  ['\u00E2\u0097\u0089', '\u25C9'],  // â—‰ -> ◉
  ['\u00E2\u00AC\u00A1', '\u2B21'],  // â¬¡ -> ⬡
  ['\u00E2\u009A\u00A1', '\u26A1'],  // âš¡ -> ⚡
  ['\u00E2\u0080\u0098', '\u2018'],  // â€˜ -> '
  ['\u00E2\u0080\u0099', '\u2019'],  // â€™ -> '
  ['\u00E2\u0080\u009C', '\u201C'],  // â€œ -> "
  ['\u00E2\u0080\u009D', '\u201D'],  // â€ -> "
  ['\u00C3\u00A9', '\u00E9'],        // Ã© -> é
  ['\u00E2\u0080\u00A2', '\u2022'],  // â€¢ -> •
  ['\u00E2\u0080\u00A6', '\u2026'],  // â€¦ -> …
  ['\u00C2\u00A0', '\u00A0'],        // Â  -> non-breaking space
  ['\u00C2\u00AE', '\u00AE'],        // Â® -> ®
  ['\u00C2\u00B0', '\u00B0'],        // Â° -> °
  ['\u00E2\u0080\u00B3', '\u2033'],  // â€³ -> ″
  ['\u00E2\u0080\u00BA', '\u203A'],  // â€º -> ›
  ['\u00E2\u0086\u0092', '\u2192'],  // â†' -> →
  ['\u00E2\u0086\u0090', '\u2190'],  // â†" -> ←
  ['\u00E2\u009C\u0085', '\u2705'],  // â€¦ -> ✅
  ['\u00E2\u009A\u00A0', '\u26A0'],  // âš  -> ⚠
  ['\u00F0\u009F\u0094\u00B4', '\uD83D\uDD34'], // rocket red
];

fixes.forEach(([bad, good]) => {
  html = html.split(bad).join(good);
});

fs.writeFileSync('/data/DASHBOARD.html', html, 'utf8');
console.log('Done. Length change: ' + (html.length - before));

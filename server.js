const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3030;
const ROOT = 'C:\\Kinetic_Core';

const ALLOWED = [
  'Maryland_Grants',
  'Aidan_Outputs\\Scout',
  'Aidan_Outputs\\Jordan',
  'Aidan_Outputs\\Iris',
  'Aidan_Outputs\\Atlas',
  'Aidan_Outputs\\Orchestra',
  'Aidan_Outputs',
];

function parseQuery(reqUrl) {
  const u = new URL(reqUrl, 'http://localhost');
  const q = {};
  u.searchParams.forEach((v, k) => { q[k] = v; });
  return { pathname: u.pathname, query: q };
}

function safePath(rel) {
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(path.resolve(ROOT))) return null;
  return full;
}

function isAllowed(rel) {
  const norm = rel.replace(/\//g, '\\');
  return ALLOWED.some(a => norm.startsWith(a) || norm === a);
}

function listDir(rel) {
  const full = safePath(rel);
  if (!full) return [];
  try {
    return fs.readdirSync(full)
      .filter(f => f.endsWith('.txt') || f.endsWith('.json'))
      .map(f => {
        const fp = path.join(full, f);
        const st = fs.statSync(fp);
        return { name: f, path: rel.replace(/\\/g, '/') + '/' + f, modified: st.mtimeMs, size: st.size };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch (e) { return []; }
}

function readFile(rel) {
  const full = safePath(rel);
  if (!full) return null;
  try { return fs.readFileSync(full, 'utf8'); } catch (e) { return null; }
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end(); return;
  }

  const { pathname: route, query: q } = parseQuery(req.url);

  if (route === '/' || route === '/dashboard') {
    const dashPath = path.join(ROOT, 'DASHBOARD.html');
    try {
      const html = fs.readFileSync(dashPath, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': Buffer.byteLength(html)
      });
      res.end(html); return;
    } catch (e) {
      res.writeHead(404); res.end('DASHBOARD.html not found at ' + dashPath); return;
    }
  }

  if (route === '/health') {
    return send(res, 200, { ok: true, root: ROOT, time: new Date().toISOString() });
  }

  if (route === '/files') {
    const dir = (q.dir || '').replace(/\//g, '\\');
    if (!isAllowed(dir)) return send(res, 403, { error: 'Not allowed: ' + dir });
    return send(res, 200, { dir, files: listDir(dir) });
  }

  if (route === '/file') {
    const rel = (q.path || '').replace(/\//g, '\\');
    if (!isAllowed(path.dirname(rel))) return send(res, 403, { error: 'Not allowed' });
    const content = readFile(rel);
    if (content === null) return send(res, 404, { error: 'Not found: ' + rel });
    return send(res, 200, { path: rel, content });
  }

  if (route === '/latest') {
    const dir = (q.dir || '').replace(/\//g, '\\');
    if (!isAllowed(dir)) return send(res, 403, { error: 'Not allowed' });
    const files = listDir(dir);
    if (!files.length) return send(res, 200, { found: false });
    const f = files[0];
    const content = readFile(f.path.replace(/\//g, '\\'));
    return send(res, 200, { found: true, file: f, content });
  }

  if (route === '/poll') {
    const dir   = (q.dir || '').replace(/\//g, '\\');
    const since = q.since ? new Date(q.since).getTime() : 0;
    if (!isAllowed(dir)) return send(res, 403, { error: 'Not allowed' });
    const files = listDir(dir).filter(f => f.modified > since);
    return send(res, 200, { dir, since: q.since, newFiles: files });
  }

  return send(res, 404, { error: 'Unknown route' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('  KAI-Netics Dashboard File Server — listening on http://localhost:3030');
  console.log('  Open dashboard: http://localhost:3030');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error('  Port ' + PORT + ' already in use.');
  } else {
    console.error('  Server error:', e.message);
  }
  process.exit(1);
});

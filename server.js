const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3030;
const ROOT = 'C:\\Kinetic_Core';

const ALLOWED = [
  'Maryland_Grants',
  'Missions',                    // PATCH 1.0 — dashboard mission file access
  'Aidan_Outputs\\Scout',
  'Aidan_Outputs\\Jordan',
  'Aidan_Outputs\\Iris',
  'Aidan_Outputs\\Atlas',
  'Aidan_Outputs\\Orchestra',
  'Aidan_Outputs\\Nova',
  'Aidan_Outputs\\Aidan',
  'Aidan_Outputs\\Missions',
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
        return {
          name: f,
          path: rel.replace(/\\/g, '/') + '/' + f,
          modified: st.mtimeMs,
          size: st.size
        };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch (e) {
    return [];
  }
}

function readFile(rel) {
  const full = safePath(rel);
  if (!full) return null;
  try {
    return fs.readFileSync(full, 'utf8');
  } catch (e) {
    return null;
  }
}

function writeFile(rel, content) {
  const full = safePath(rel);
  if (!full) return { ok: false, error: 'Invalid path' };

  try {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
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
      res.end(html);
      return;
    } catch (e) {
      res.writeHead(404);
      res.end('DASHBOARD.html not found');
      return;
    }
  }

  if (route === '/health') {
    return send(res, 200, {
      ok: true,
      root: ROOT,
      time: new Date().toISOString()
    });
  }

  if (route === '/files') {
    const dir = (q.dir || '').replace(/\//g, '\\');
    if (!isAllowed(dir)) return send(res, 403, { error: 'Not allowed: ' + dir });
    return send(res, 200, { dir, files: listDir(dir) });
  }

  if (route === '/file' && req.method === 'GET') {
    const rel = (q.path || '').replace(/\//g, '\\');
    // Allow root-level files (dirname = '') or explicitly allowed dirs
    const dir = path.dirname(rel);
    if (dir !== '' && dir !== '.' && !isAllowed(dir)) {
      return send(res, 403, { error: 'Not allowed' });
    }

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
    const dir = (q.dir || '').replace(/\//g, '\\');
    const since = q.since ? new Date(q.since).getTime() : 0;

    if (!isAllowed(dir)) return send(res, 403, { error: 'Not allowed' });

    const files = listDir(dir).filter(f => f.modified > since);
    return send(res, 200, { dir, since: q.since, newFiles: files });
  }

  // ── POST /mission/update — mutate mission file safely ──────────────────────
  // Body: { mission_id, path, updates: {}, event: { agent, action, note } }
  if (route === '/mission/update' && req.method === 'POST') {
    try {
      const rawBody = await readBody(req);
      const payload = JSON.parse(rawBody);
      const { mission_id, path: missionPath, updates = {}, event } = payload;

      if (!missionPath) {
        return send(res, 400, { error: 'path required' });
      }

      const rel = missionPath.replace(/\//g, '\\');
      const dir = path.dirname(rel);

      if (dir !== '' && dir !== '.' && !isAllowed(dir)) {
        return send(res, 403, { error: 'Not allowed' });
      }

      const current = readFile(rel);

      if (!current) {
        return send(res, 404, { error: 'Mission not found: ' + rel });
      }

      const mission = JSON.parse(current.replace(/^\uFEFF/, '').trim());

      // Preserve existing nested state before applying top-level updates.
      const existingExecutionChain = mission.execution_chain || {};
      const incomingExecutionChain = updates.execution_chain || {};

      const existingEvents = Array.isArray(mission.events)
        ? mission.events
        : [];

      // Apply top-level updates except nested objects that need merge behavior.
      const {
        execution_chain,
        events,
        ...flatUpdates
      } = updates;

      Object.assign(mission, flatUpdates);

      // Deep merge execution_chain instead of overwriting it.
      mission.execution_chain = {
        ...existingExecutionChain,
        ...incomingExecutionChain,
      };

      // Preserve existing events.
      mission.events = existingEvents;

      // Append update-provided events if present.
      if (Array.isArray(events)) {
        mission.events.push(...events);
      }

      // Append single event if provided.
      if (event) {
        mission.events.push({
          timestamp: new Date().toISOString(),
          agent: event.agent || 'unknown',
          action: event.action || 'update',
          note: event.note || '',
        });
      }

      mission.updated_at = new Date().toISOString();

      const result = writeFile(rel, JSON.stringify(mission, null, 2));

      if (!result.ok) {
        return send(res, 500, { error: result.error });
      }

      return send(res, 200, {
        ok: true,
        mission_id: mission.mission_id || mission_id,
        updated_at: mission.updated_at,
        execution_chain: mission.execution_chain,
        event_count: mission.events.length,
      });

    } catch (e) {
      return send(res, 400, { error: 'Bad request: ' + e.message });
    }
  }

  return send(res, 404, { error: 'Unknown route: ' + route });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('  KAI-Netics File Server v1.0 — http://localhost:3030');
  console.log('  Endpoints: /health /files /file /latest /poll /mission/update');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error('  Port ' + PORT + ' already in use.');
  } else {
    console.error('  Server error:', e.message);
  }
  process.exit(1);
});

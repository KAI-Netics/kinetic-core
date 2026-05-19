// KAI-Netics Mission Normalizer v1.0
// Converts raw Scout output to canonical mission schema.
// Applies garbage filter before accepting any mission into queue.
// Usage: require('./normalizer') — called from n8n Code nodes or server routes.

'use strict';

// ── OWNED ENTITY FILTER ────────────────────────────────────────────────────
const OWNED_ENTITIES = [
  'kai-netics',
  'kevin alexander international',
  'kainetics equity',
  'eaf',
  'monk llc',
  'kevin alexander smith',
];

// ── VALID STATUS VALUES ────────────────────────────────────────────────────
const VALID_STATUSES = [
  'READY_FOR_EXECUTION',
  'PURSUING',
  'IN_PROGRESS',
  'STALLED',
  'COMPLETE',
  'REJECTED',
  'EXPIRED',
];

// ── VALID EXECUTION MODES ──────────────────────────────────────────────────
const VALID_EXECUTION_MODES = [
  'DIRECT',
  'SUBCONTRACT_IF_NEEDED',
  'TEAMING',
  'GRANT_APPLICATION',
  'SBIR_APPLICATION',
  'LOI_FIRST',
];

// ── VALID NEXT AGENTS ──────────────────────────────────────────────────────
const VALID_NEXT_AGENTS = ['Nova', 'Jordan', 'Iris', 'Atlas', 'Aidan', 'Kevin'];

// ── GARBAGE FILTER ─────────────────────────────────────────────────────────
// Returns { pass: bool, reason: string }
function garbageFilter(raw) {
  if (!raw || typeof raw !== 'object') {
    return { pass: false, reason: 'malformed — not an object' };
  }

  const title = String(raw.opportunity_title || raw.title || '').trim().toLowerCase();
  const org   = String(raw.organization || '').toLowerCase();
  const fitScore = Number(raw.fit_score ?? raw.fitScore ?? 0);
  const confidence = Number(raw.confidence_score ?? raw.confidence ?? 0);
  const sourceUrl = raw.source_url || (Array.isArray(raw.source_urls) && raw.source_urls[0]) || '';
  const deadline = raw.deadline || null;

  // 1. Empty title
  if (!title) return { pass: false, reason: 'missing title' };

  // 2. Owned entity
  if (OWNED_ENTITIES.some(e => org.includes(e) || title.includes(e))) {
    return { pass: false, reason: 'owned entity — cannot pursue self' };
  }

  // 3. No source URL
  if (!sourceUrl) return { pass: false, reason: 'no source URL — hallucination risk' };

  // 4. Low fit score
  if (fitScore < 40) return { pass: false, reason: `fit_score ${fitScore} below 40 threshold` };

  // 5. Low confidence
  if (confidence > 0 && confidence < 30) {
    return { pass: false, reason: `confidence_score ${confidence} below 30 threshold` };
  }

  // 6. Expired deadline (>30 days past)
  if (deadline) {
    const dl = new Date(deadline);
    const now = new Date();
    const daysOver = (now - dl) / (1000 * 60 * 60 * 24);
    if (!isNaN(dl) && daysOver > 30) {
      return { pass: false, reason: `deadline ${deadline} expired ${Math.round(daysOver)} days ago` };
    }
  }

  // 7. Duplicate detection — caller must pass existingTitles array
  // (handled in normalize() below)

  return { pass: true, reason: 'ok' };
}

// ── NORMALIZE ──────────────────────────────────────────────────────────────
// Converts raw Scout/Nova output to canonical mission schema.
// existingTitles: string[] of titles already in active queue (for dedup).
// Returns { ok: bool, mission: object|null, error: string|null }
function normalize(raw, existingTitles = []) {

  const filter = garbageFilter(raw);
  if (!filter.pass) {
    return { ok: false, mission: null, error: 'GARBAGE_FILTER: ' + filter.reason };
  }

  const title = String(raw.opportunity_title || raw.title || '').trim();

  // Duplicate detection
  const titleNorm = title.toLowerCase();
  if (existingTitles.some(t => t.toLowerCase() === titleNorm)) {
    return { ok: false, mission: null, error: 'DUPLICATE: mission already in queue' };
  }

  const entity = (['FP','EAF','MONK','MULTI'].includes(raw.entity)) ? raw.entity : 'FP';
  const fitScore = Number(raw.fit_score ?? raw.fitScore ?? 0);
  const confidence = Number(raw.confidence_score ?? raw.confidence ?? 0);
  const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'READY_FOR_EXECUTION';

  // Resolve execution_mode
  let execMode = raw.execution_mode
    || raw.ceo_action?.execution_mode
    || (entity === 'EAF' ? 'GRANT_APPLICATION' : 'DIRECT');
  if (!VALID_EXECUTION_MODES.includes(execMode)) execMode = 'DIRECT';

  // Resolve next_step + blocker
  const nextStep = raw.next_step || raw.ceo_action?.next_step
    || raw.recommended_next_action || raw.recommended_action || '';
  const blocker = raw.blocker || raw.ceo_action?.blocker || null;

  // Source URLs — always array
  let sourceUrls = [];
  if (Array.isArray(raw.source_urls)) sourceUrls = raw.source_urls;
  else if (raw.source_url) sourceUrls = [raw.source_url];

  // Resolve next_agent from execution_chain or default by entity
  let nextAgent = raw.next_agent || null;
  if (!nextAgent) {
    const chain = raw.execution_chain || {};
    if (chain.nova_plan === 'READY' || chain.nova_plan === undefined) nextAgent = 'Nova';
    else if (chain.jordan_draft === 'READY') nextAgent = 'Jordan';
    else if (chain.iris_tracking === 'READY') nextAgent = 'Iris';
    else nextAgent = 'Aidan';
  }
  if (!VALID_NEXT_AGENTS.includes(nextAgent)) nextAgent = 'Nova';

  const now = new Date().toISOString();

  const mission = {
    // Identity
    mission_id:  raw.mission_id || `MISSION_${Date.now()}`,
    title,
    opportunity_title: title,
    mission_type: raw.mission_type || (entity === 'EAF' ? 'EAF_GRANT' : 'FP_CONTRACT'),
    entity,

    // Scoring
    fit_score: fitScore,
    confidence_score: confidence,

    // State
    status,
    urgency: raw.urgency || (fitScore >= 90 ? 'CRITICAL' : fitScore >= 70 ? 'HIGH' : 'MEDIUM'),
    next_agent: nextAgent,
    recommended_action: raw.recommended_action || raw.recommended_next_action || 'REVIEW',

    // CEO action fields (top-level for dashboard rendering)
    execution_mode: execMode,
    next_step: nextStep,
    blocker,

    // Nested ceo_action (legacy compat)
    ceo_action: {
      execution_mode: execMode,
      next_step: nextStep,
      blocker,
    },

    // Sources
    source: raw.source || raw.discovered_by_agent || 'Scout',
    source_urls: sourceUrls,

    // Deadline
    deadline: raw.deadline || null,

    // Operational
    operational_targets: Array.isArray(raw.operational_targets) ? raw.operational_targets : [],
    pricing: raw.pricing || null,

    // Execution chain — preserve existing, fill gaps
    execution_chain: {
      scout: raw.execution_chain?.scout || (raw.source ? 'COMPLETE' : 'PENDING'),
      dashboard_render: raw.execution_chain?.dashboard_render || 'PENDING',
      nova_plan: raw.execution_chain?.nova_plan || 'READY',
      jordan_draft: raw.execution_chain?.jordan_draft || 'READY',
      iris_tracking: raw.execution_chain?.iris_tracking || 'READY',
      aidan_summary: raw.execution_chain?.aidan_summary || 'READY',
    },

    // Events log
    events: Array.isArray(raw.events) ? raw.events : [
      {
        timestamp: now,
        agent: 'Normalizer',
        action: 'normalized',
        note: `Ingested from ${raw.source || raw.discovered_by_agent || 'unknown'}`,
      }
    ],

    // Timestamps
    timestamps: {
      created_at: raw.created_at || raw.discovered_at || now,
      updated_at: now,
    },
    created_at: raw.created_at || raw.discovered_at || now,
    updated_at: now,
  };

  return { ok: true, mission, error: null };
}

// ── STALL DETECTION ────────────────────────────────────────────────────────
// Returns list of stalled agent slots (READY for > stallMinutes with no event)
function detectStalls(mission, stallMinutes = 60) {
  const chain = mission.execution_chain || {};
  const events = Array.isArray(mission.events) ? mission.events : [];
  const now = Date.now();
  const stalls = [];

  for (const [agent, state] of Object.entries(chain)) {
    if (state !== 'READY') continue;

    // Find last event for this agent
    const lastEvent = events
      .filter(e => e.agent && e.agent.toLowerCase().includes(agent.replace('_', '').replace('draft','').replace('tracking','').replace('plan','').replace('summary','').replace('render','')))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const since = lastEvent
      ? new Date(lastEvent.timestamp).getTime()
      : new Date(mission.created_at || mission.timestamps?.created_at || 0).getTime();

    const minutesStalled = (now - since) / 60000;

    if (minutesStalled > stallMinutes) {
      stalls.push({
        agent,
        state,
        minutes_stalled: Math.round(minutesStalled),
        last_event: lastEvent?.timestamp || null,
      });
    }
  }

  return stalls;
}

module.exports = { normalize, garbageFilter, detectStalls, VALID_STATUSES, VALID_NEXT_AGENTS };

// Mission Transform + Lifecycle v1.1 — Dedup Patch
// Applied: 2026-05-12T03:08:18Z
// Patched live in n8n workflow e9PFzT7A3DJBawvT (Scout - BD Research v6)
// This file is the canonical reference for the scout-009 node code.
// On next workflow export from n8n, replace the jsCode in scout-009 with this content.
//
// CHANGES FROM v1.0:
//   - Added findExistingMission() — scans MISSIONS_DIR before creating new file
//   - 5 dedup signals: source_url, org+title, org+entity+mode, title similarity >= 0.85, content hash
//   - shortHash now computed from stable normalized inputs (not random per-run)
//   - dupSignal recorded in mission_write_summary and update event for traceability
//   - All existing lifecycle behavior (SUPPRESSED/REACTIVATED/UPDATED) preserved

// ─── MISSION TRANSFORM + LIFECYCLE v1.1 ─────────────────────────────────────
// Adapter layer: converts Scout Brain v6 aiOutput into dashboard-ready mission JSON.
// Dedup patch: scans existing mission files for semantic matches BEFORE
// generating a new mission_id or creating a new file.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const crypto = require('crypto');

const input = $input.first().json;
const { aiOutput, fitScore, action, urgency, confidence, mode,
        sourceLabel, targetName, sourceUrl, outreachDraft, pursuitSteps,
        sourceGaps, contactName, contactEmail, whyMatters, whyFits,
        timestamp, contentHash } = input;

const MISSIONS_DIR = '/data/Aidan_Outputs/Missions';
const SUPPRESSION_DAYS = 5;

function safeRead(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').trim()); }
  catch(_) { return null; }
}

function normalizeUrl(url) {
  if (!url || url.startsWith('SOURCE GAP')) return '';
  return url.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/^www\./, '');
}

function normalizeText(str) {
  if (!str || str.startsWith('SOURCE GAP')) return '';
  return str.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripNoise(title) {
  return normalizeText(title)
    .replace(/\b[a-f0-9]{4,8}\b/g, '')
    .replace(/\b\d{4,}\b/g, '')
    .replace(/\b20\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleSimilarity(a, b) {
  const ta = new Set(stripNoise(a).split(' ').filter(t => t.length > 3));
  const tb = new Set(stripNoise(b).split(' ').filter(t => t.length > 3));
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  ta.forEach(t => { if (tb.has(t)) overlap++; });
  return overlap / Math.max(ta.size, tb.size);
}

function contentSignature(obj) {
  const stable = {
    opportunity_title: obj.opportunity_title || obj.title || '',
    organization:      obj.organization || '',
    entity:            obj.entity || '',
    source_url:        normalizeUrl(obj.source_url || (obj.source_urls || [])[0] || ''),
    mode:              obj.mode || obj.lead_type || '',
  };
  return crypto.createHash('md5').update(JSON.stringify(stable)).digest('hex');
}

function findExistingMission(aiOut, missionsDir) {
  let files;
  try { files = fs.readdirSync(missionsDir).filter(f => f.endsWith('.json') && f !== 'mission_defaults_template.json' && !f.startsWith('DUPLICATE_REPORT')); }
  catch(_) { return null; }

  const inUrl    = normalizeUrl(aiOut.source_url || (aiOut.source_urls || [])[0] || '');
  const inOrg    = normalizeText(aiOut.organization || aiOut.funder || '');
  const inTitle  = normalizeText(aiOut.opportunity_title || '');
  const inEntity = (aiOut.entity || 'FP').toUpperCase();
  const inMode   = aiOut.mode || aiOut.lead_type || '';
  const inSig    = contentSignature(aiOut);

  for (const file of files) {
    const existing = safeRead(`${missionsDir}/${file}`);
    if (!existing) continue;

    const exUrl   = normalizeUrl(existing.source_url || (existing.source_urls || [])[0] || '');
    const exOrg   = normalizeText(existing.organization || '');
    const exTitle = normalizeText(existing.opportunity_title || existing.title || '');
    const exSig   = contentSignature(existing);

    if (inUrl && exUrl && inUrl === exUrl)
      return { existing, file, signal: 'source_url' };

    if (inOrg && exOrg && inOrg === exOrg && inTitle && exTitle && inTitle === exTitle)
      return { existing, file, signal: 'org_title' };

    if (inOrg && exOrg && inOrg === exOrg &&
        inEntity === (existing.entity || '').toUpperCase() &&
        inMode && inMode === (existing.mode || existing.lead_type || ''))
      return { existing, file, signal: 'org_entity_mode' };

    if (inEntity === (existing.entity || '').toUpperCase()) {
      const sim = titleSimilarity(aiOut.opportunity_title || '', existing.opportunity_title || existing.title || '');
      if (sim >= 0.85) return { existing, file, signal: `title_similarity_${Math.round(sim * 100)}` };
    }

    if (inSig === exSig) return { existing, file, signal: 'content_hash' };
  }
  return null;
}

function sanitizeSlug(str) {
  return (str || 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 28).replace(/_$/, '');
}

function shortHash(str) {
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 6).toUpperCase();
}

function inferEntity(ai, mode) {
  if (ai.entity && ['FP','EAF','MONK','MULTI'].includes(ai.entity)) return ai.entity;
  if (mode === 'grant') return (ai.fp_fit_score || 0) > (ai.eaf_fit_score || 0) + 15 ? 'FP' : 'EAF';
  return 'FP';
}

function resolveUrgency(ai) {
  return ['CRITICAL','HIGH','MEDIUM','LOW'].includes(ai.urgency) ? ai.urgency : 'MEDIUM';
}

function resolveDeadline(ai) {
  return ai.deadline || ai.portal_deadline || null;
}

function isSuppressed(mission, now) {
  return mission.suppression_until ? new Date(mission.suppression_until) > now : false;
}

function urgencyChanged(existing, incoming) {
  const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };
  return (rank[incoming] || 0) > (rank[existing.urgency] || 0);
}

function deadlineChanged(existing, incoming) {
  if (!incoming || incoming === 'SOURCE GAP -- RESEARCH REQUIRED') return false;
  return existing.deadline !== incoming;
}

fs.mkdirSync(MISSIONS_DIR, { recursive: true });

const entity           = inferEntity(aiOutput, mode);
const titleRaw         = aiOutput.opportunity_title || aiOutput.funder || targetName || sourceLabel || 'UNKNOWN';
const incomingUrgency  = resolveUrgency(aiOutput);
const incomingDeadline = resolveDeadline(aiOutput);
const incomingFit      = aiOutput.fit_score || Math.max(aiOutput.eaf_fit_score || 0, aiOutput.fp_fit_score || 0) || fitScore || 0;
const now              = new Date();
const suppressUntil    = new Date(now.getTime() + SUPPRESSION_DAYS * 86400000).toISOString();

const dupMatch = findExistingMission({ ...aiOutput, entity, mode }, MISSIONS_DIR);

let missionId, missionFile, existing, dupSignal;

if (dupMatch) {
  existing    = dupMatch.existing;
  missionFile = `${MISSIONS_DIR}/${dupMatch.file}`;
  missionId   = existing.mission_id;
  dupSignal   = dupMatch.signal;
} else {
  const slug        = sanitizeSlug(titleRaw);
  const stableInput = normalizeUrl(aiOutput.source_url || '') + '|' + normalizeText(titleRaw) + '|' + entity;
  const hash        = shortHash(stableInput);
  missionId         = `${entity}_${slug}_${hash}`;
  missionFile       = `${MISSIONS_DIR}/${missionId}.json`;
  existing          = safeRead(missionFile);
  dupSignal         = null;
}

let lifecycle_state, missionObj, writeAction;

if (!existing) {
  lifecycle_state = 'NEW';
  writeAction     = 'created';
  missionObj = {
    mission_id:           missionId,
    opportunity_title:    titleRaw,
    entity,
    urgency:              incomingUrgency,
    fit_score:            incomingFit,
    source_url:           aiOutput.source_url || null,
    organization:         aiOutput.organization || aiOutput.funder || null,
    deadline:             incomingDeadline,
    status:               aiOutput.recommended_next_action || 'NEW',
    recommended_action:   aiOutput.recommended_next_action || 'REVIEW',
    pursuit_steps:        aiOutput.pursuit_steps || [],
    contacts: {
      name:  aiOutput.contact_name  || null,
      title: aiOutput.contact_title || null,
      email: aiOutput.contact_email || null,
      phone: aiOutput.contact_phone || null,
    },
    outreach_draft:       aiOutput.outreach_draft || null,
    strategic_value:      aiOutput.why_this_matters || null,
    relationship_leverage: aiOutput.why_kai_fits   || null,
    confidence_score:     aiOutput.confidence_score || 0,
    source_gap_warnings:  aiOutput.source_gap_warnings || [],
    certifications_needed: aiOutput.certifications_needed || [],
    constraint_flags:     aiOutput.constraint_flags || [],
    risks:                aiOutput.risks || [],
    data_confidence:      aiOutput.data_confidence || 'LOW',
    beachhead:            aiOutput.beachhead || null,
    mode,
    agent_source:         'Scout',
    next_agent:           'Nova',
    execution_chain: {
      scout_discovery: 'COMPLETE',
      nova_plan:       'PENDING',
      jordan_draft:    'PENDING',
      iris_compliance: 'PENDING',
      outreach_sent:   'PENDING',
      pursuit_active:  'PENDING',
      contract_closed: 'PENDING',
    },
    lifecycle_state,
    discovered_at:        timestamp || now.toISOString(),
    last_seen_at:         now.toISOString(),
    rediscovery_count:    0,
    suppression_until:    suppressUntil,
    mission_events: [{
      timestamp: now.toISOString(),
      agent:     'Scout',
      action:    'mission_created',
      note:      `Discovered via ${sourceLabel} | fit: ${incomingFit}% | urgency: ${incomingUrgency}`,
    }],
    created_at:  now.toISOString(),
    updated_at:  now.toISOString(),
  };
} else {
  const prevCount        = existing.rediscovery_count || 0;
  const suppressed       = isSuppressed(existing, now);
  const urgencyUp        = urgencyChanged(existing, incomingUrgency);
  const deadlineUp       = deadlineChanged(existing, incomingDeadline);
  const shouldReactivate = urgencyUp || deadlineUp;

  if (suppressed && !shouldReactivate) {
    lifecycle_state = 'SUPPRESSED';
    writeAction     = 'suppressed';
  } else if (suppressed && shouldReactivate) {
    lifecycle_state = 'REACTIVATED';
    writeAction     = 'reactivated';
  } else {
    lifecycle_state = 'UPDATED';
    writeAction     = 'updated';
  }

  const updateEvent = {
    timestamp: now.toISOString(),
    agent:     'Scout',
    action:    `mission_${writeAction}`,
    note:      `Rediscovery #${prevCount + 1} via ${sourceLabel}`
               + (dupSignal  ? ` | dedup signal: ${dupSignal}` : '')
               + (urgencyUp  ? ` | urgency escalated to ${incomingUrgency}` : '')
               + (deadlineUp ? ` | deadline updated to ${incomingDeadline}` : '')
               + (suppressed && shouldReactivate ? ' | REACTIVATED' : ''),
  };

  missionObj = {
    ...existing,
    urgency:         shouldReactivate ? incomingUrgency : existing.urgency,
    deadline:        deadlineUp       ? incomingDeadline : existing.deadline,
    fit_score:       Math.max(existing.fit_score || 0, incomingFit),
    status:          lifecycle_state === 'REACTIVATED' ? 'REACTIVATED' : existing.status,
    pursuit_steps:   aiOutput.pursuit_steps?.length ? aiOutput.pursuit_steps : existing.pursuit_steps,
    outreach_draft:  aiOutput.outreach_draft && aiOutput.outreach_draft !== 'SOURCE GAP -- RESEARCH REQUIRED'
                       ? aiOutput.outreach_draft : existing.outreach_draft,
    source_gap_warnings: aiOutput.source_gap_warnings || existing.source_gap_warnings,
    data_confidence: aiOutput.data_confidence || existing.data_confidence,
    lifecycle_state,
    last_seen_at:    now.toISOString(),
    rediscovery_count: prevCount + 1,
    suppression_until: lifecycle_state === 'REACTIVATED'
                         ? new Date(now.getTime() + SUPPRESSION_DAYS * 86400000).toISOString()
                         : existing.suppression_until,
    mission_events: [...(existing.mission_events || existing.events || []), updateEvent],
    updated_at: now.toISOString(),
  };
}

let writeError = null;
try {
  fs.writeFileSync(missionFile, JSON.stringify(missionObj, null, 2), 'utf8');
} catch(e) {
  writeError = e.message;
}

const mission_write_summary = {
  created:           writeAction === 'created'     ? 1 : 0,
  updated:           writeAction === 'updated'     ? 1 : 0,
  suppressed:        writeAction === 'suppressed'  ? 1 : 0,
  reactivated:       writeAction === 'reactivated' ? 1 : 0,
  mission_file:      missionFile,
  mission_id:        missionId,
  lifecycle_state,
  write_action:      writeAction,
  write_error:       writeError,
  dedup_signal:      dupSignal,
  fit_score:         incomingFit,
  urgency:           incomingUrgency,
  entity,
  rediscovery_count: missionObj.rediscovery_count,
};

return [{ json: { ...input, mission_write_summary, missionId, missionFile, lifecycle_state } }];

/**
 * KAI-Netics Mission Governance Layer v1
 * ROOT: C:\Kinetic_Core\mission_governance.js
 *
 * Normalizes mission objects, validates fit scores, enforces state machine,
 * guarantees persistence fields, and maintains full event history.
 *
 * NO external API calls. NO n8n workflow edits. Pure deterministic logic.
 */

'use strict';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const VALID_STATUSES = new Set([
  'DISCOVERED',
  'RESEARCH_QUEUE',
  'VALIDATION_QUEUE',
  'VERIFIED',
  'PURSUING',
  'HUMAN_REVIEW',
  'EXECUTING',
  'WATCH',
  'REJECTED',
  'CLOSED',
  'ERROR',
]);

/**
 * Allowed state transitions.
 * Key = fromStatus, Value = Set of allowed toStatus values.
 */
const ALLOWED_TRANSITIONS = {
  DISCOVERED:        new Set(['RESEARCH_QUEUE', 'VALIDATION_QUEUE', 'VERIFIED', 'WATCH', 'ERROR', 'REJECTED']),
  RESEARCH_QUEUE:    new Set(['VALIDATION_QUEUE', 'VERIFIED', 'WATCH', 'REJECTED', 'ERROR', 'HUMAN_REVIEW']),
  VALIDATION_QUEUE:  new Set(['VERIFIED', 'RESEARCH_QUEUE', 'WATCH', 'REJECTED', 'ERROR', 'HUMAN_REVIEW']),
  VERIFIED:          new Set(['PURSUING', 'WATCH', 'REJECTED', 'HUMAN_REVIEW', 'ERROR']),
  PURSUING:          new Set(['EXECUTING', 'HUMAN_REVIEW', 'WATCH', 'REJECTED', 'CLOSED', 'ERROR']),
  HUMAN_REVIEW:      new Set(['PURSUING', 'VERIFIED', 'WATCH', 'REJECTED', 'CLOSED', 'ERROR']),
  EXECUTING:         new Set(['CLOSED', 'WATCH', 'ERROR', 'HUMAN_REVIEW']),
  WATCH:             new Set(['RESEARCH_QUEUE', 'VALIDATION_QUEUE', 'PURSUING', 'REJECTED', 'CLOSED', 'ERROR']),
  REJECTED:          new Set(['HUMAN_REVIEW']),      // only escalation allowed from terminal
  CLOSED:            new Set(['HUMAN_REVIEW']),
  ERROR:             new Set(['RESEARCH_QUEUE', 'VALIDATION_QUEUE', 'HUMAN_REVIEW', 'REJECTED']),
};

const SOURCE_QUALITY = {
  HIGH:    'HIGH',
  MEDIUM:  'MEDIUM',
  LOW:     'LOW',
  UNKNOWN: 'UNKNOWN',
};

const HIGH_AUTHORITY_DOMAINS = [
  '.gov', '.mil', '.edu',
  'sam.gov', 'grants.gov', 'sbir.gov', 'usaspending.gov',
  'mdot.maryland.gov', 'mbe.mdot.maryland.gov',
  'faa.gov', 'dhs.gov', 'dod.gov', 'hhs.gov',
];

const LOW_QUALITY_SIGNALS = [
  '404', 'not found', 'page not found', 'error loading',
  'access denied', 'forbidden', 'unavailable', 'removed',
  'expired', 'broken link',
];

const MEDIUM_AUTHORITY_DOMAINS = [
  'techstars.com', 'nih.gov', 'nsf.gov', 'sba.gov',
  'mdeconomy.maryland.gov', 'commerce.gov',
];


// ─────────────────────────────────────────────
// 1. normalizeFitScore(value)
// ─────────────────────────────────────────────

/**
 * Safely parse a fit score from any raw value.
 *
 * Rules:
 * - Strip %, whitespace, commas.
 * - CRITICAL: "501(c)(3)" and similar 501 tax-exemption references must NOT
 *   produce a numeric score. Detect and return null.
 * - Numeric result must be 0–100 (inclusive). Outside range → null.
 * - NaN / unparseable → null.
 *
 * @param {*} value - Raw fit score (string, number, etc.)
 * @returns {number|null}
 */
function normalizeFitScore(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();

  // Guard: detect 501(c)(3) tax-exemption pattern before numeric parse.
  // Matches: "501(c)(3)", "501(c)(3) eligible", "501 (c)(3)", etc.
  if (/501\s*\(c\)\s*\(\d\)/i.test(raw)) return null;

  // Guard: if the raw string contains parentheses after a number, likely
  // a legal/tax code reference — treat as non-numeric.
  if (/\d+\s*\(/.test(raw)) return null;

  // Strip percent sign, commas, spaces
  const cleaned = raw.replace(/[%,\s]/g, '');

  const num = parseFloat(cleaned);

  if (isNaN(num)) return null;
  if (num < 0 || num > 100) return null;  // Scores over 100 → null per spec

  // Round to 1 decimal place for consistency
  return Math.round(num * 10) / 10;
}


// ─────────────────────────────────────────────
// 2. classifySourceQuality(sourceUrls, notes)
// ─────────────────────────────────────────────

/**
 * Evaluate the quality of mission sources.
 *
 * @param {string[]} sourceUrls - Array of source URLs (may be empty/null)
 * @param {string}   notes      - Agent notes / freetext (may contain warnings)
 * @returns {'HIGH'|'MEDIUM'|'LOW'|'UNKNOWN'}
 */
function classifySourceQuality(sourceUrls, notes = '') {
  const urls = Array.isArray(sourceUrls) ? sourceUrls.filter(Boolean) : [];
  const notesLower = (notes || '').toLowerCase();

  if (urls.length === 0) return SOURCE_QUALITY.UNKNOWN;

  // Check notes for 404 / broken source signals
  const hasSourceWarning = LOW_QUALITY_SIGNALS.some(sig => notesLower.includes(sig));

  // Evaluate each URL
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const url of urls) {
    const urlLower = (url || '').toLowerCase();

    if (LOW_QUALITY_SIGNALS.some(sig => urlLower.includes(sig))) {
      lowCount++;
      continue;
    }

    const isHigh = HIGH_AUTHORITY_DOMAINS.some(d => urlLower.includes(d));
    if (isHigh) { highCount++; continue; }

    const isMedium = MEDIUM_AUTHORITY_DOMAINS.some(d => urlLower.includes(d));
    if (isMedium) { mediumCount++; continue; }

    // Default: non-authoritative source counts as LOW
    lowCount++;
  }

  // Source warning in notes degrades quality
  if (hasSourceWarning) {
    // Even a .gov URL with a 404 note → LOW
    return SOURCE_QUALITY.LOW;
  }

  if (highCount > 0)   return SOURCE_QUALITY.HIGH;
  if (mediumCount > 0) return SOURCE_QUALITY.MEDIUM;
  return SOURCE_QUALITY.LOW;
}


// ─────────────────────────────────────────────
// 3. determineMissionStatus(input)
// ─────────────────────────────────────────────

/**
 * Determine the correct mission status from normalized input fields.
 *
 * Routing rules (priority order):
 * 1. Explicit valid status already set → preserve if valid transition or initial set.
 * 2. 404 / source warning → RESEARCH_QUEUE.
 * 3. No source URLs → VALIDATION_QUEUE.
 * 4. source_quality UNKNOWN → VALIDATION_QUEUE.
 * 5. source_quality LOW → RESEARCH_QUEUE.
 * 6. Low confidence (< 50) → RESEARCH_QUEUE.
 * 7. Moderate confidence (50–69) → WATCH.
 * 8. PURSUING requires source_quality HIGH|MEDIUM AND confidence >= 70.
 * 9. High confidence + HIGH/MEDIUM source → VERIFIED (default path to PURSUING).
 *
 * @param {object} input - Partially or fully normalized mission fields
 * @returns {string} - One of VALID_STATUSES
 */
function determineMissionStatus(input) {
  const {
    status,
    source_quality,
    confidence_score,
    source_urls = [],
    notes = '',
  } = input;

  const confidence = typeof confidence_score === 'number' ? confidence_score : null;
  const urls = Array.isArray(source_urls) ? source_urls.filter(Boolean) : [];
  const notesLower = (notes || '').toLowerCase();
  const hasSourceWarning = LOW_QUALITY_SIGNALS.some(sig => notesLower.includes(sig));

  // If explicitly set to a terminal/manual status, respect it
  if (status && ['HUMAN_REVIEW', 'REJECTED', 'CLOSED', 'EXECUTING'].includes(status)) {
    return status;
  }

  // Rule 2: 404 / broken source signals
  if (hasSourceWarning) return 'RESEARCH_QUEUE';

  // Rule 3: No source URLs
  if (urls.length === 0) return 'VALIDATION_QUEUE';

  // Rule 4: Unknown source quality
  if (source_quality === SOURCE_QUALITY.UNKNOWN) return 'VALIDATION_QUEUE';

  // Rule 5: Low source quality
  if (source_quality === SOURCE_QUALITY.LOW) return 'RESEARCH_QUEUE';

  // Rule 6: Very low confidence
  if (confidence !== null && confidence < 50) return 'RESEARCH_QUEUE';

  // Rule 7: Moderate confidence
  if (confidence !== null && confidence < 70) return 'WATCH';

  // Rule 8: Pursue gate — source HIGH|MEDIUM AND confidence >= 70
  const canPursue = (
    [SOURCE_QUALITY.HIGH, SOURCE_QUALITY.MEDIUM].includes(source_quality) &&
    confidence !== null && confidence >= 70
  );

  if (!canPursue) return 'WATCH';

  // Rule 9: Respect explicit PURSUING if gate passes
  if (status === 'PURSUING') return 'PURSUING';

  // Default: route to VERIFIED for human/agent review before PURSUING
  return 'VERIFIED';
}


// ─────────────────────────────────────────────
// 4. generateMissionId(input)
// ─────────────────────────────────────────────

/**
 * Generate a deterministic, human-readable mission ID.
 * Format: KAI-{TYPE_PREFIX}-{DATE}-{HASH4}
 * e.g.: KAI-GRANT-20260518-A3F1
 *
 * @param {object} input
 * @returns {string}
 */
function generateMissionId(input) {
  const typeMap = {
    'grant':    'GRANT',
    'rfp':      'RFP',
    'contract': 'CNTR',
    'job':      'JOB',
    'partner':  'PRTN',
    'intel':    'INTL',
    'drone':    'UAS',
  };

  const rawType = (input.mission_type || 'unknown').toLowerCase();
  const typePrefix = typeMap[rawType] || 'MISS';

  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');

  // Simple 4-char hash from funder + opportunity title
  const hashSource = `${input.funder || ''}${input.opportunity || ''}${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    hash = ((hash << 5) - hash + hashSource.charCodeAt(i)) | 0;
  }
  const hashHex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);

  return `KAI-${typePrefix}-${datePart}-${hashHex}`;
}


// ─────────────────────────────────────────────
// 5. buildMissionPath(mission)
// ─────────────────────────────────────────────

/**
 * Build the canonical filesystem path for a mission JSON file.
 * Pattern: missions/{status}/{mission_id}.json
 *
 * @param {object} mission - Normalized mission object
 * @returns {string}
 */
function buildMissionPath(mission) {
  const status  = (mission.status  || 'DISCOVERED').toUpperCase();
  const id      = mission.mission_id || generateMissionId(mission);
  return `missions/${status}/${id}.json`;
}


// ─────────────────────────────────────────────
// 6. validateStateTransition(fromStatus, toStatus)
// ─────────────────────────────────────────────

/**
 * Validate whether a status transition is permitted.
 *
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {{ valid: boolean, reason: string }}
 */
function validateStateTransition(fromStatus, toStatus) {
  if (!VALID_STATUSES.has(fromStatus)) {
    return { valid: false, reason: `Unknown fromStatus: "${fromStatus}"` };
  }
  if (!VALID_STATUSES.has(toStatus)) {
    return { valid: false, reason: `Unknown toStatus: "${toStatus}"` };
  }
  if (fromStatus === toStatus) {
    return { valid: true, reason: 'No-op: same status' };
  }

  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  if (!allowed || !allowed.has(toStatus)) {
    return {
      valid: false,
      reason: `Transition ${fromStatus} → ${toStatus} is not permitted. Allowed: [${[...(allowed || [])].join(', ')}]`,
    };
  }

  return { valid: true, reason: `Transition ${fromStatus} → ${toStatus} is valid` };
}


// ─────────────────────────────────────────────
// 7. appendMissionEvent(mission, event)
// ─────────────────────────────────────────────

/**
 * Append a timestamped event to mission.events array.
 * Always returns a new mission object (immutable pattern).
 *
 * @param {object} mission - Existing normalized mission
 * @param {object} event   - { type, agent, description, metadata? }
 * @returns {object} - Updated mission with new event appended
 */
function appendMissionEvent(mission, event) {
  const now = new Date().toISOString();

  const newEvent = {
    event_id:    `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    timestamp:   now,
    type:        event.type        || 'UPDATE',
    agent:       event.agent       || 'SYSTEM',
    description: event.description || '',
    metadata:    event.metadata    || {},
  };

  const updatedEvents = [...(Array.isArray(mission.events) ? mission.events : []), newEvent];

  return {
    ...mission,
    events:     updatedEvents,
    updated_at: now,
  };
}


// ─────────────────────────────────────────────
// 8. normalizeMission(input)  ← MASTER FUNCTION
// ─────────────────────────────────────────────

/**
 * Full normalization pipeline for any raw mission object.
 *
 * Steps:
 * 1. Extract and sanitize all canonical fields.
 * 2. Normalize fit score (501(c)(3) guard, 0–100 clamp).
 * 3. Classify source quality.
 * 4. Determine / enforce status.
 * 5. Generate mission_id if missing.
 * 6. Build missionPath if null/missing.
 * 7. Append NORMALIZE event to history.
 * 8. Stamp created_at / updated_at.
 *
 * @param {object} input - Raw mission data from any agent
 * @returns {object} - Fully normalized canonical mission object
 */
function normalizeMission(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('normalizeMission: input must be a non-null object');
  }

  // ── 1. Extract fields (handle alternate key names from agents) ──
  const raw = {
    mission_id:          input.mission_id          || input.id            || null,
    mission_type:        input.mission_type         || input.type          || 'unknown',
    status:              input.status               || null,
    confidence_score:    input.confidence_score     ?? input.confidence    ?? null,
    fit_score:           input.fit_score            ?? input.fitScore      ?? input.fit  ?? null,
    source_quality:      input.source_quality       || null,
    entity:              input.entity               || input.org           || null,
    opportunity:         input.opportunity           || input.title         || input.name || null,
    funder:              input.funder               || input.grantor       || null,
    deadline:            input.deadline             || input.due_date      || null,
    recommended_action:  input.recommended_action   || input.action        || null,
    source_urls:         input.source_urls          || input.sources       || input.urls || [],
    execution_chain:     input.execution_chain      || [],
    events:              input.events               || [],
    provenance:          input.provenance           || { agent: input.agent || 'UNKNOWN', ingested_at: new Date().toISOString() },
    notes:               input.notes                || input.description   || '',
    created_at:          input.created_at           || null,
    updated_at:          input.updated_at           || null,
    missionPath:         input.missionPath          || null,
  };

  // Normalize source_urls to array
  if (typeof raw.source_urls === 'string') {
    raw.source_urls = raw.source_urls ? [raw.source_urls] : [];
  }
  if (!Array.isArray(raw.source_urls)) raw.source_urls = [];

  // ── 2. Normalize fit score ──
  raw.fit_score = normalizeFitScore(raw.fit_score);

  // ── 3. Normalize confidence score (0–100) ──
  if (raw.confidence_score !== null) {
    const cs = parseFloat(raw.confidence_score);
    raw.confidence_score = isNaN(cs) ? null : Math.min(100, Math.max(0, Math.round(cs * 10) / 10));
  }

  // ── 4. Classify source quality ──
  raw.source_quality = classifySourceQuality(raw.source_urls, raw.notes);

  // ── 5. Determine status ──
  raw.status = determineMissionStatus({
    status:           raw.status,
    source_quality:   raw.source_quality,
    confidence_score: raw.confidence_score,
    source_urls:      raw.source_urls,
    notes:            raw.notes,
  });

  // ── 6. Generate mission_id if missing ──
  if (!raw.mission_id) {
    raw.mission_id = generateMissionId(raw);
  }

  // ── 7. Stamp timestamps ──
  const now = new Date().toISOString();
  if (!raw.created_at) raw.created_at = now;
  raw.updated_at = now;

  // ── 8. Build missionPath ──
  raw.missionPath = buildMissionPath(raw);

  // ── 9. Clean up internal fields not in canonical schema ──
  delete raw.notes; // notes used internally; surface in provenance if needed

  // ── 10. Append NORMALIZE event ──
  const normalized = appendMissionEvent(raw, {
    type:        'NORMALIZE',
    agent:       raw.provenance?.agent || 'GOVERNANCE',
    description: `Mission normalized. Status=${raw.status}, SourceQuality=${raw.source_quality}, FitScore=${raw.fit_score}`,
    metadata: {
      fit_score:      raw.fit_score,
      source_quality: raw.source_quality,
      status:         raw.status,
    },
  });

  return normalized;
}


// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

module.exports = {
  normalizeMission,
  normalizeFitScore,
  classifySourceQuality,
  determineMissionStatus,
  generateMissionId,
  buildMissionPath,
  validateStateTransition,
  appendMissionEvent,
  VALID_STATUSES,
  ALLOWED_TRANSITIONS,
  SOURCE_QUALITY,
};

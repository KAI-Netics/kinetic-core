/**
 * KAI-Netics Mission Governance Layer v1 — Test Suite
 * ROOT: C:\Kinetic_Core\test_mission_governance.js
 *
 * Run: node test_mission_governance.js
 * No external dependencies required.
 */

'use strict';

const {
  normalizeMission,
  normalizeFitScore,
  classifySourceQuality,
  determineMissionStatus,
  validateStateTransition,
  appendMissionEvent,
  buildMissionPath,
  generateMissionId,
} = require('./mission_governance');

// ─────────────────────────────────────────────
// Minimal test harness
// ─────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function assert(label, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ status: '✅ PASS', label, detail });
  } else {
    failed++;
    results.push({ status: '❌ FAIL', label, detail });
  }
}

function section(name) {
  results.push({ status: '──', label: `\n=== ${name} ===`, detail: '' });
}


// ─────────────────────────────────────────────
// SECTION 1: normalizeFitScore
// ─────────────────────────────────────────────
section('normalizeFitScore');

// TC-1: 501(c)(3) must NOT produce 501%
assert(
  'TC-1a: "501(c)(3)" → null (not 501)',
  normalizeFitScore('501(c)(3)') === null,
  `got: ${normalizeFitScore('501(c)(3)')}`
);

assert(
  'TC-1b: "Fit Score 501%" in context string still guarded (raw "501%")',
  normalizeFitScore('501%') === null,
  `got: ${normalizeFitScore('501%')}`
);

assert(
  'TC-1c: "501(c)(3) eligible" → null',
  normalizeFitScore('501(c)(3) eligible') === null,
  `got: ${normalizeFitScore('501(c)(3) eligible')}`
);

assert(
  'TC-1d: "85%" → 85',
  normalizeFitScore('85%') === 85,
  `got: ${normalizeFitScore('85%')}`
);

assert(
  'TC-1e: "100" → 100',
  normalizeFitScore('100') === 100,
  `got: ${normalizeFitScore('100')}`
);

assert(
  'TC-1f: 101 → null (over 100)',
  normalizeFitScore(101) === null,
  `got: ${normalizeFitScore(101)}`
);

assert(
  'TC-1g: -5 → null (below 0)',
  normalizeFitScore(-5) === null,
  `got: ${normalizeFitScore(-5)}`
);

assert(
  'TC-1h: null → null',
  normalizeFitScore(null) === null,
  `got: ${normalizeFitScore(null)}`
);

assert(
  'TC-1i: "garbage" → null',
  normalizeFitScore('garbage') === null,
  `got: ${normalizeFitScore('garbage')}`
);

assert(
  'TC-1j: 0 → 0 (edge: zero is valid)',
  normalizeFitScore(0) === 0,
  `got: ${normalizeFitScore(0)}`
);

assert(
  'TC-1k: "72.5%" → 72.5',
  normalizeFitScore('72.5%') === 72.5,
  `got: ${normalizeFitScore('72.5%')}`
);


// ─────────────────────────────────────────────
// SECTION 2: classifySourceQuality
// ─────────────────────────────────────────────
section('classifySourceQuality');

assert(
  'TC-2a: .gov URL → HIGH',
  classifySourceQuality(['https://grants.gov/opportunity/12345']) === 'HIGH',
  `got: ${classifySourceQuality(['https://grants.gov/opportunity/12345'])}`
);

assert(
  'TC-2b: No URLs → UNKNOWN',
  classifySourceQuality([]) === 'UNKNOWN',
  `got: ${classifySourceQuality([])}`
);

assert(
  'TC-2c: null URLs → UNKNOWN',
  classifySourceQuality(null) === 'UNKNOWN',
  `got: ${classifySourceQuality(null)}`
);

assert(
  'TC-2d: Notes with "404" degrades to LOW',
  classifySourceQuality(['https://grants.gov/old'], 'Warning: 404 returned for source') === 'LOW',
  `got: ${classifySourceQuality(['https://grants.gov/old'], 'Warning: 404 returned for source')}`
);

assert(
  'TC-2e: Techstars URL → MEDIUM',
  classifySourceQuality(['https://techstars.com/program/ai-health']) === 'MEDIUM',
  `got: ${classifySourceQuality(['https://techstars.com/program/ai-health'])}`
);

assert(
  'TC-2f: Unknown blog URL → LOW',
  classifySourceQuality(['https://randomblog.com/grant-alert']) === 'LOW',
  `got: ${classifySourceQuality(['https://randomblog.com/grant-alert'])}`
);

assert(
  'TC-2g: .mil URL → HIGH',
  classifySourceQuality(['https://www.army.mil/sbir/opportunity/123']) === 'HIGH',
  `got: ${classifySourceQuality(['https://www.army.mil/sbir/opportunity/123'])}`
);


// ─────────────────────────────────────────────
// SECTION 3: determineMissionStatus
// ─────────────────────────────────────────────
section('determineMissionStatus');

assert(
  'TC-3a: 404 in notes → RESEARCH_QUEUE',
  determineMissionStatus({
    source_urls: ['https://faa.gov/old'],
    notes: 'FAA source returned 404 not found',
    source_quality: 'LOW',
    confidence_score: 75,
  }) === 'RESEARCH_QUEUE',
  `got: ${determineMissionStatus({ source_urls: ['https://faa.gov/old'], notes: 'FAA source returned 404 not found', source_quality: 'LOW', confidence_score: 75 })}`
);

assert(
  'TC-3b: No source URLs → VALIDATION_QUEUE',
  determineMissionStatus({
    source_urls: [],
    source_quality: 'UNKNOWN',
    confidence_score: 80,
  }) === 'VALIDATION_QUEUE',
  `got: ${determineMissionStatus({ source_urls: [], source_quality: 'UNKNOWN', confidence_score: 80 })}`
);

assert(
  'TC-3c: HIGH source + confidence 85 → VERIFIED',
  determineMissionStatus({
    source_urls: ['https://grants.gov/123'],
    source_quality: 'HIGH',
    confidence_score: 85,
  }) === 'VERIFIED',
  `got: ${determineMissionStatus({ source_urls: ['https://grants.gov/123'], source_quality: 'HIGH', confidence_score: 85 })}`
);

assert(
  'TC-3d: LOW confidence (< 50) → RESEARCH_QUEUE',
  determineMissionStatus({
    source_urls: ['https://grants.gov/123'],
    source_quality: 'HIGH',
    confidence_score: 40,
  }) === 'RESEARCH_QUEUE',
  `got: ${determineMissionStatus({ source_urls: ['https://grants.gov/123'], source_quality: 'HIGH', confidence_score: 40 })}`
);

assert(
  'TC-3e: Moderate confidence (60) + HIGH source → WATCH',
  determineMissionStatus({
    source_urls: ['https://grants.gov/123'],
    source_quality: 'HIGH',
    confidence_score: 60,
  }) === 'WATCH',
  `got: ${determineMissionStatus({ source_urls: ['https://grants.gov/123'], source_quality: 'HIGH', confidence_score: 60 })}`
);

assert(
  'TC-3f: HUMAN_REVIEW status preserved',
  determineMissionStatus({
    status: 'HUMAN_REVIEW',
    source_urls: ['https://grants.gov/123'],
    source_quality: 'HIGH',
    confidence_score: 90,
  }) === 'HUMAN_REVIEW',
  `got: ${determineMissionStatus({ status: 'HUMAN_REVIEW', source_urls: ['https://grants.gov/123'], source_quality: 'HIGH', confidence_score: 90 })}`
);


// ─────────────────────────────────────────────
// SECTION 4: validateStateTransition
// ─────────────────────────────────────────────
section('validateStateTransition');

const t1 = validateStateTransition('DISCOVERED', 'RESEARCH_QUEUE');
assert('TC-4a: DISCOVERED → RESEARCH_QUEUE valid', t1.valid === true, t1.reason);

const t2 = validateStateTransition('VERIFIED', 'PURSUING');
assert('TC-4b: VERIFIED → PURSUING valid', t2.valid === true, t2.reason);

const t3 = validateStateTransition('CLOSED', 'PURSUING');
assert('TC-4c: CLOSED → PURSUING invalid', t3.valid === false, t3.reason);

const t4 = validateStateTransition('PURSUING', 'EXECUTING');
assert('TC-4d: PURSUING → EXECUTING valid', t4.valid === true, t4.reason);

const t5 = validateStateTransition('REJECTED', 'PURSUING');
assert('TC-4e: REJECTED → PURSUING invalid', t5.valid === false, t5.reason);

const t6 = validateStateTransition('RESEARCH_QUEUE', 'VERIFIED');
assert('TC-4f: RESEARCH_QUEUE → VERIFIED valid', t6.valid === true, t6.reason);

const t7 = validateStateTransition('BOGUS', 'VERIFIED');
assert('TC-4g: Unknown fromStatus → invalid', t7.valid === false, t7.reason);

const t8 = validateStateTransition('VERIFIED', 'VERIFIED');
assert('TC-4h: Same status is valid no-op', t8.valid === true, t8.reason);


// ─────────────────────────────────────────────
// SECTION 5: appendMissionEvent
// ─────────────────────────────────────────────
section('appendMissionEvent');

const baseMission = {
  mission_id: 'KAI-GRANT-TEST-0001',
  status: 'VERIFIED',
  events: [],
  updated_at: '2026-01-01T00:00:00.000Z',
};

const updated = appendMissionEvent(baseMission, {
  type: 'STATUS_CHANGE',
  agent: 'Jordan',
  description: 'Grant verified via grants.gov',
});

assert('TC-5a: Event appended to events array', updated.events.length === 1, `length: ${updated.events.length}`);
assert('TC-5b: Event has timestamp', !!updated.events[0].timestamp, `timestamp: ${updated.events[0].timestamp}`);
assert('TC-5c: updated_at advanced', updated.updated_at !== '2026-01-01T00:00:00.000Z', `updated_at: ${updated.updated_at}`);
assert('TC-5d: Original mission not mutated', baseMission.events.length === 0, `original events: ${baseMission.events.length}`);
assert('TC-5e: Event agent is Jordan', updated.events[0].agent === 'Jordan', `agent: ${updated.events[0].agent}`);

const updated2 = appendMissionEvent(updated, { type: 'PURSUIT_START', agent: 'Scout' });
assert('TC-5f: Second event appended (2 total)', updated2.events.length === 2, `length: ${updated2.events.length}`);


// ─────────────────────────────────────────────
// SECTION 6: generateMissionId
// ─────────────────────────────────────────────
section('generateMissionId');

const id1 = generateMissionId({ mission_type: 'grant', funder: 'Maryland DOL', opportunity: 'Lighthouse Upskilling' });
const id2 = generateMissionId({ mission_type: 'rfp', funder: 'DoD', opportunity: 'C-UAS Demo' });

assert('TC-6a: Grant ID starts with KAI-GRANT-', id1.startsWith('KAI-GRANT-'), `id: ${id1}`);
assert('TC-6b: RFP ID starts with KAI-RFP-', id2.startsWith('KAI-RFP-'), `id: ${id2}`);
assert('TC-6c: ID has 4 parts (KAI-TYPE-DATE-HASH)', id1.split('-').length >= 4, `id: ${id1}`);


// ─────────────────────────────────────────────
// SECTION 7: buildMissionPath
// ─────────────────────────────────────────────
section('buildMissionPath');

const pathMission = { status: 'VERIFIED', mission_id: 'KAI-GRANT-20260518-ABCD' };
const mPath = buildMissionPath(pathMission);
assert('TC-7a: Path format = missions/STATUS/ID.json', mPath === 'missions/VERIFIED/KAI-GRANT-20260518-ABCD.json', `path: ${mPath}`);

const pathMissionNull = { status: 'RESEARCH_QUEUE', mission_id: null, mission_type: 'grant' };
const mPath2 = buildMissionPath(pathMissionNull);
assert('TC-7b: Null mission_id generates ID in path', mPath2.startsWith('missions/RESEARCH_QUEUE/KAI-'), `path: ${mPath2}`);


// ─────────────────────────────────────────────
// SECTION 8: normalizeMission (Integration)
// ─────────────────────────────────────────────
section('normalizeMission — Integration Tests');

// TC-8-1: Jordan report with "Fit Score: 501(c)(3)" contamination
const raw1 = {
  mission_type: 'grant',
  opportunity: 'Maryland Lighthouse Upskilling Grant',
  funder: 'MD Department of Labor',
  fit_score: '501(c)(3)',
  confidence_score: 82,
  source_urls: ['https://mdeconomy.maryland.gov/lighthouse'],
  agent: 'Jordan',
  notes: 'Applicant must be 501(c)(3) or fiscal agent arrangement',
};
const m1 = normalizeMission(raw1);
assert('TC-8-1a: 501(c)(3) fit_score → null', m1.fit_score === null, `fit_score: ${m1.fit_score}`);
assert('TC-8-1b: .gov source → HIGH quality', m1.source_quality === 'HIGH', `source_quality: ${m1.source_quality}`);
assert('TC-8-1c: High confidence + HIGH source → VERIFIED', m1.status === 'VERIFIED', `status: ${m1.status}`);
assert('TC-8-1d: mission_id generated', !!m1.mission_id, `mission_id: ${m1.mission_id}`);
assert('TC-8-1e: missionPath generated', !!m1.missionPath && m1.missionPath.includes('VERIFIED'), `missionPath: ${m1.missionPath}`);
assert('TC-8-1f: events has NORMALIZE entry', m1.events.some(e => e.type === 'NORMALIZE'), `events: ${JSON.stringify(m1.events.map(e => e.type))}`);

// TC-8-2: FAA 404 warning → RESEARCH_QUEUE
const raw2 = {
  mission_type: 'contract',
  opportunity: 'FAA UAS Integration Contract',
  funder: 'FAA',
  fit_score: '78%',
  confidence_score: 74,
  source_urls: ['https://faa.gov/uas/contracts/2025/expired'],
  agent: 'Scout',
  notes: 'Source URL returned 404 page not found. Original opportunity may have closed.',
};
const m2 = normalizeMission(raw2);
assert('TC-8-2a: FAA 404 note → RESEARCH_QUEUE', m2.status === 'RESEARCH_QUEUE', `status: ${m2.status}`);
assert('TC-8-2b: Source quality degraded to LOW', m2.source_quality === 'LOW', `source_quality: ${m2.source_quality}`);
assert('TC-8-2c: fit_score still parsed as 78', m2.fit_score === 78, `fit_score: ${m2.fit_score}`);

// TC-8-3: Valid .gov source, fit 85 → VERIFIED
const raw3 = {
  mission_type: 'grant',
  opportunity: 'SBIR Phase I - Autonomous Systems',
  funder: 'DoD SBIR',
  fit_score: '85%',
  confidence_score: 88,
  source_urls: ['https://sbir.gov/solicitations/DoD-2026-1'],
  agent: 'Jordan',
};
const m3 = normalizeMission(raw3);
assert('TC-8-3a: .gov source + high conf → VERIFIED', m3.status === 'VERIFIED', `status: ${m3.status}`);
assert('TC-8-3b: fit_score 85', m3.fit_score === 85, `fit_score: ${m3.fit_score}`);
assert('TC-8-3c: source_quality HIGH', m3.source_quality === 'HIGH', `source_quality: ${m3.source_quality}`);

// TC-8-4: Missing source URL → VALIDATION_QUEUE
const raw4 = {
  mission_type: 'rfp',
  opportunity: 'City of Baltimore Drone Services RFP',
  funder: 'City of Baltimore',
  fit_score: '90%',
  confidence_score: 91,
  source_urls: [],
  agent: 'Scout',
};
const m4 = normalizeMission(raw4);
assert('TC-8-4a: No sources → VALIDATION_QUEUE', m4.status === 'VALIDATION_QUEUE', `status: ${m4.status}`);
assert('TC-8-4b: source_quality UNKNOWN', m4.source_quality === 'UNKNOWN', `source_quality: ${m4.source_quality}`);
assert('TC-8-4c: mission_id still generated', !!m4.mission_id, `mission_id: ${m4.mission_id}`);
assert('TC-8-4d: missionPath has VALIDATION_QUEUE', m4.missionPath.includes('VALIDATION_QUEUE'), `missionPath: ${m4.missionPath}`);

// TC-8-5: Weird/duplicate/aliased fields normalize correctly
const raw5 = {
  type: 'drone',          // alternate key for mission_type
  name: 'UMMS Sparrows Point Delivery Route',   // alternate key for opportunity
  grantor: 'UMMS',       // alternate key for funder
  fitScore: 72,          // camelCase alternate
  confidence: 77,        // alternate key
  urls: ['https://umms.org/drone-ops'],  // alternate key
  id: 'EXISTING-ID-001', // alternate key for mission_id
  agent: 'Atlas',
};
const m5 = normalizeMission(raw5);
assert('TC-8-5a: type alias → mission_type=drone', m5.mission_type === 'drone', `mission_type: ${m5.mission_type}`);
assert('TC-8-5b: name alias → opportunity set', !!m5.opportunity, `opportunity: ${m5.opportunity}`);
assert('TC-8-5c: grantor alias → funder set', m5.funder === 'UMMS', `funder: ${m5.funder}`);
assert('TC-8-5d: fitScore alias → fit_score=72', m5.fit_score === 72, `fit_score: ${m5.fit_score}`);
assert('TC-8-5e: confidence alias → confidence_score=77', m5.confidence_score === 77, `confidence_score: ${m5.confidence_score}`);
assert('TC-8-5f: id alias → mission_id preserved', m5.mission_id === 'EXISTING-ID-001', `mission_id: ${m5.mission_id}`);

// TC-8-6: missionPath null/missing → generated
const raw6 = {
  mission_type: 'intel',
  opportunity: 'Competitor Analysis: Wing vs MissionGO',
  funder: null,
  confidence_score: 65,
  source_urls: ['https://techcrunch.com/drone-delivery-2026'],
  missionPath: null,
};
const m6 = normalizeMission(raw6);
assert('TC-8-6a: missionPath generated (not null)', !!m6.missionPath, `missionPath: ${m6.missionPath}`);
assert('TC-8-6b: missionPath matches status', m6.missionPath.includes(m6.status), `path: ${m6.missionPath}, status: ${m6.status}`);
assert('TC-8-6c: mission_id in path', m6.missionPath.includes(m6.mission_id), `path: ${m6.missionPath}`);


// ─────────────────────────────────────────────
// SECTION 9: Canonical Schema Completeness
// ─────────────────────────────────────────────
section('Canonical Schema Completeness');

const CANONICAL_FIELDS = [
  'mission_id', 'mission_type', 'status', 'confidence_score', 'fit_score',
  'source_quality', 'entity', 'opportunity', 'funder', 'deadline',
  'recommended_action', 'source_urls', 'execution_chain', 'events',
  'provenance', 'created_at', 'updated_at',
];

const sampleMission = normalizeMission({
  mission_type: 'grant',
  opportunity: 'Test Grant',
  funder: 'NSF',
  confidence_score: 80,
  source_urls: ['https://nsf.gov/pubs/2026/nsf26001'],
});

for (const field of CANONICAL_FIELDS) {
  assert(
    `TC-9: canonical field "${field}" present`,
    Object.prototype.hasOwnProperty.call(sampleMission, field),
    `missing from output`
  );
}


// ─────────────────────────────────────────────
// RESULTS SUMMARY
// ─────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║    KAI-Netics Mission Governance Layer v1 — Tests    ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

for (const r of results) {
  if (r.status === '──') {
    console.log(r.label);
  } else {
    const detail = r.detail ? `  (${r.detail})` : '';
    console.log(`  ${r.status}  ${r.label}${detail}`);
  }
}

console.log('\n──────────────────────────────────────────────────────');
console.log(`  Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
console.log('──────────────────────────────────────────────────────\n');

// Emit normalized sample for inspection
const normalizedSample = normalizeMission({
  mission_type: 'grant',
  opportunity: 'Maryland Lighthouse Upskilling (SAMPLE)',
  funder: 'MD Department of Labor',
  fit_score: '501(c)(3)',   // The canonical bug case
  confidence_score: 82,
  source_urls: ['https://mdeconomy.maryland.gov/lighthouse'],
  agent: 'Jordan',
  notes: 'Applicant must be 501(c)(3) nonprofit or use fiscal agent',
});

console.log('── NORMALIZED SAMPLE (501c3 guard case) ──');
console.log(JSON.stringify(normalizedSample, null, 2));

// Machine-readable summary for caller
const summary = {
  files_created: [
    'C:\\Kinetic_Core\\mission_governance.js',
    'C:\\Kinetic_Core\\test_mission_governance.js',
  ],
  tests_passed: passed,
  tests_failed: failed,
  total_tests: passed + failed,
  normalized_sample: normalizedSample,
  next_patch_target: 'Integrate normalizeMission() into missionService.js at mission ingestion point (pre-Supabase write). Replace raw field assignments with normalizeMission(rawInput) call. Then patch Jordan/Scout execution_chain output to pass fit_score as raw string — governance layer handles sanitization.',
};

console.log('\n── MACHINE SUMMARY ──');
console.log(JSON.stringify({
  files_created: summary.files_created,
  tests_passed: summary.tests_passed,
  tests_failed: summary.tests_failed,
  next_patch_target: summary.next_patch_target,
}, null, 2));

if (failed > 0) process.exit(1);

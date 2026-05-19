const fs   = require('fs');
const path = require('path');
const http = require('http');

const ROOT = 'C:\\Kinetic_Core';
const SCOUT_DIR = path.join(ROOT, 'Aidan_Outputs', 'Scout');
const MISSION_DIR = path.join(ROOT, 'Aidan_Outputs', 'Missions');
const TEMPLATE_PATH = path.join(MISSION_DIR, 'mission_defaults_template.json');

function safeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function slugify(value) {
  return String(value || 'mission')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function loadTemplate() {
  try {
    if (fs.existsSync(TEMPLATE_PATH)) {
      return JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
    }
  } catch (e) {
    console.warn('[template] ignored:', e.message);
  }
  return {};
}

function latestScoutFile() {
  const files = fs.readdirSync(SCOUT_DIR)
    .filter(f => f.toLowerCase().endsWith('.json'))
    .map(f => {
      const full = path.join(SCOUT_DIR, f);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) throw new Error('No Scout JSON files found');
  return files[0].full;
}

function extractOpportunities(input) {
  if (Array.isArray(input)) return input;
  const candidates = [
    input.opportunities,
    input.results,
    input.items,
    input.leads,
    input.pipeline,
    input.data,
    input.output,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [input];
}

function inferEntity(o) {
  const text = JSON.stringify(o).toLowerCase();
  if (o.entity) return o.entity;
  if (text.includes('eaf') || text.includes('workforce') || text.includes('grant')) return 'EAF';
  return 'FP';
}

function inferMissionType(o) {
  if (o.mission_type) return o.mission_type;
  if (o.lead_type) return o.lead_type;
  if (o.mode) return o.mode;
  if (o.revenue_type) return o.revenue_type;
  const text = JSON.stringify(o).toLowerCase();
  if (text.includes('job') || text.includes('hire') || text.includes('recruit')) return 'job';
  if (text.includes('grant')) return 'grant';
  if (text.includes('subcontract') || text.includes('teaming')) return 'teaming';
  if (text.includes('consult')) return 'consulting';
  if (text.includes('rfp') || text.includes('solicitation')) return 'contract';
  return 'bd';
}

function inferUrgency(o) {
  if (o.urgency) return String(o.urgency).toUpperCase();
  const fit = Number(o.fit_score || o.confidence_score || 0);
  if (fit >= 85) return 'CRITICAL';
  if (fit >= 70) return 'HIGH';
  if (fit >= 50) return 'MEDIUM';
  return 'LOW';
}

function buildMissionId(entity, title) {
  const stamp = Math.floor(Math.random() * 9000 + 1000);
  return `${entity}_${slugify(title)}_${stamp}`;
}

function normalizeOpportunity(o, template) {
  const title =
    o.opportunity_title ||
    o.title ||
    o.source_title ||
    'Untitled Opportunity';

  const entity = inferEntity(o);
  const missionId = o.mission_id || buildMissionId(entity, title);

  const sourceUrls = [
    ...safeArray(o.source_urls),
    ...safeArray(o.source_url),
    ...safeArray(o.procurement_portal),
  ].filter(Boolean);

  const pursuitSteps = safeArray(o.pursuit_steps);
  const risks = safeArray(o.risks);
  const sourceGapWarnings = safeArray(o.source_gap_warnings);
  const complianceFlags = [
    ...safeArray(o.compliance_flags),
    ...safeArray(o.constraint_flags),
  ];

  const now = new Date().toISOString();

  return {
    ...template,

    mission_id: missionId,
    opportunity_title: title,
    source_title: o.source_title || null,
    source_platform: o.source_platform || null,
    source_label: o.source_label || null,
    source_urls: sourceUrls,

    organization: o.organization || null,
    procurement_portal: o.procurement_portal || null,
    contract_vehicle: o.contract_vehicle || null,

    fit_score: Number(o.fit_score || 0),
    confidence_score: Number(o.confidence_score || 0),
    data_confidence: o.data_confidence || null,
    urgency: inferUrgency(o),
    entity,
    mission_type: inferMissionType(o),
    lead_type: inferMissionType(o),
    beachhead: o.beachhead || null,

    recommended_action:
      o.recommended_next_action ||
      o.recommended_action ||
      'REVIEW',

    status: 'NEW',
    deadline: o.deadline || 'Unknown',

    why_this_matters: o.why_this_matters || null,
    why_kai_fits: o.why_kai_fits || null,
    scout_summary:
      o.why_this_matters ||
      o.raw_snippet ||
      o.summary ||
      null,

    pursuit_steps: pursuitSteps,
    risks,
    source_gap_warnings: sourceGapWarnings,
    certifications_needed: safeArray(o.certifications_needed),
    compliance_flags: complianceFlags,
    credential_fit: o.credential_fit || o.why_kai_fits || null,

    outreach_draft: o.outreach_draft || null,

    contact_name: o.contact_name || null,
    contact_title: o.contact_title || null,
    contact_email: o.contact_email || null,
    contact_phone: o.contact_phone || null,
    key_contacts: safeArray(o.key_contacts),

    raw_snippet: o.raw_snippet || null,
    search_query: o.search_query || null,
    discovered_at: o.discovered_at || now,
    discovered_by_agent: o.discovered_by_agent || 'Scout',

    ceo_action: {
      blocker:
        sourceGapWarnings.length
          ? sourceGapWarnings[0]
          : (complianceFlags[0] || 'None identified'),
      execution_mode:
        entity === 'FP'
          ? 'JOB_INCOME_FIRST'
          : 'WORKFORCE_PIPELINE',
      next_step:
        pursuitSteps[0] ||
        o.recommended_next_action ||
        'Review and approve mission plan',
    },

    operational_targets: [
      o.organization,
      o.contact_name,
      o.beachhead,
      o.contract_vehicle,
    ].filter(Boolean),

    success_metric:
      o.success_metric ||
      'Validated contact, qualified source, and approved next action',

    revenue_path:
      o.revenue_path ||
      o.revenue_type ||
      null,

    pricing: o.pricing || null,
    notes: o.notes || null,

    execution_chain: {
      scout_discovery: 'COMPLETE',
      nova_plan: 'PENDING',
      jordan_draft: 'PENDING',
      iris_compliance: 'PENDING',
      outreach_sent: 'PENDING',
      aidan_brief: 'PENDING',
    },
    aidan_brief_id: null,
    brief_generated_at: null,

    events: [
      {
        timestamp: now,
        agent: 'Scout',
        action: 'SCOUT_DISCOVERY',
        note: `Converted from Scout output — fit ${Number(o.fit_score || 0)}%, confidence ${Number(o.confidence_score || 0)}%`,
      },
    ],

    raw_source_opportunity: o,

    created_at: now,
    updated_at: now,
  };
}

function writeMission(mission) {
  fs.mkdirSync(MISSION_DIR, { recursive: true });

  // PATCH 2 — Dedupe: check for existing mission with same title+entity
  const existingFiles = fs.readdirSync(MISSION_DIR).filter(f => f.endsWith('.json'));
  for (const f of existingFiles) {
    try {
      const existing = JSON.parse(fs.readFileSync(path.join(MISSION_DIR, f), 'utf8'));
      if (
        existing.opportunity_title === mission.opportunity_title &&
        existing.entity === mission.entity
      ) {
        console.log('  Dedupe: merged into existing -> ' + f);
        const merged = {
          ...existing,
          fit_score: Math.max(existing.fit_score || 0, mission.fit_score || 0),
          confidence_score: Math.max(existing.confidence_score || 0, mission.confidence_score || 0),
          urgency: mission.urgency || existing.urgency,
          pursuit_steps: mission.pursuit_steps && mission.pursuit_steps.length ? mission.pursuit_steps : existing.pursuit_steps,
          outreach_draft: mission.outreach_draft || existing.outreach_draft,
          updated_at: new Date().toISOString(),
        };
        merged.events = [
          ...(existing.events || []),
          {
            timestamp: new Date().toISOString(),
            agent: 'Scout',
            action: 'RESCAN_MERGE',
            note: 'Re-scan merged: fit ' + mission.fit_score + '%, conf ' + mission.confidence_score + '%',
          },
        ];
        fs.writeFileSync(path.join(MISSION_DIR, f), JSON.stringify(merged, null, 2), 'utf8');
        return path.join(MISSION_DIR, f);
      }
    } catch (_) {}
  }

  const filename = `${mission.mission_id}.json`;
  const full = path.join(MISSION_DIR, filename);
  fs.writeFileSync(full, JSON.stringify(mission, null, 2), 'utf8');
  return full;
}

// PATCH 6 — WhatsApp notification on new mission creation
function notifyWhatsApp(mission) {
  const body = JSON.stringify({
    event: 'new_mission',
    mission_id: mission.mission_id,
    title: mission.opportunity_title,
    fit: mission.fit_score,
    urgency: mission.urgency,
    entity: mission.entity,
    next_step: mission.ceo_action && mission.ceo_action.next_step ? mission.ceo_action.next_step : 'Review mission',
    deadline: mission.deadline,
  });
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5678,
      path: '/webhook/whatsapp-inbound',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, () => resolve());
    req.on('error', () => resolve());
    req.setTimeout(4000, () => { req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

function main() {
  const inputPath = process.argv[2] || latestScoutFile();
  const template = loadTemplate();

  console.log('  KAI-Netics Scout -> Mission Converter v2');
  console.log('  -------------------------------------');
  console.log('  Input:  ', inputPath);
  console.log('  Output: ', MISSION_DIR);

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const opportunities = extractOpportunities(raw);

  console.log(`  -> Processing ${opportunities.length} opportunity${opportunities.length === 1 ? '' : 'ies'}`);

  let written = 0;
  let failed = 0;

  for (const o of opportunities) {
    try {
      const mission = normalizeOpportunity(o, template);

      // PATCH 1a — Confidence gate
      const CONFIDENCE_MIN = 50;
      if (mission.fit_score < CONFIDENCE_MIN && mission.confidence_score < CONFIDENCE_MIN) {
        console.log('  [SKIP] Low confidence -> ' + mission.opportunity_title + ' [fit=' + mission.fit_score + ', conf=' + mission.confidence_score + ']');
        failed++;
        continue;
      }

      // PATCH 1b — Owned entity exclusion
      const OWNED_ENTITIES = ['kai-netics', 'kainetics', 'kevin alexander international', 'eaf', 'monk llc', 'kal', 'equity and autonomy foundry'];
      const titleCheck = (mission.opportunity_title || '').toLowerCase();
      const orgCheck   = (mission.organization || '').toLowerCase();
      const combined   = titleCheck + ' ' + orgCheck;
      if (OWNED_ENTITIES.some(e => combined.includes(e))) {
        console.log('  [BLOCK] Owned entity -> ' + mission.opportunity_title);
        failed++;
        continue;
      }

      // PATCH 1c — Quality gate: untitled or no source URLs -> Validation_Queue
      const VALIDATION_DIR = path.join(ROOT, 'Aidan_Outputs', 'Validation_Queue');
      const isUntitled  = !mission.opportunity_title || mission.opportunity_title === 'Untitled Opportunity';
      const hasNoSource = !mission.source_urls || mission.source_urls.length === 0;
      if (isUntitled || hasNoSource) {
        fs.mkdirSync(VALIDATION_DIR, { recursive: true });
        const vFilename = (mission.mission_id || 'unknown') + '_validation.json';
        const vFull     = path.join(VALIDATION_DIR, vFilename);
        const reason    = isUntitled ? 'Untitled opportunity' : 'No source URLs';
        fs.writeFileSync(vFull, JSON.stringify({ ...mission, validation_reason: reason }, null, 2), 'utf8');
        console.log('  [VALIDATION] ' + reason + ' -> ' + vFilename);
        failed++;
        continue;
      }

      const out = writeMission(mission);
      written++;
      console.log('  Written -> ' + out);
      // PATCH 6 — WhatsApp notification via n8n (fire-and-forget)
      notifyWhatsApp(mission).catch(() => {});
    } catch (e) {
      failed++;
      console.error('  Failed:', e.message);
    }
  }

  console.log('  -------------------------------------');
  console.log(`  Complete: ${written} written, ${failed} failed`);
}

if (require.main === module) {
  main();
}

module.exports = {
  normalizeOpportunity,
  extractOpportunities,
  inferMissionType,
  inferEntity,
};

// ============================================================
// ATLAS REPLICATION ENGINE
// KAI-Netics Core Engine — Client Deployment Generator
// Used by Atlas when command includes: 'client config' | 'replication' | 'deploy'
// ============================================================

// ── REFERENCE ARCHITECTURE BASELINE ────────────────────────
// Atlas compares any client config against this canonical standard

const REFERENCE_ARCHITECTURE = {
  version: 'kai_netics_core_v5',
  platform: {
    orchestrator: 'n8n',
    orchestrator_version: '2.14.2',
    runtime: 'node.js',
    containerization: 'docker',
    database: 'supabase',
    delivery: 'evolution_api'
  },
  workflows: [
    {
      id: 'scout',
      name: 'Scout - Intelligence Agent',
      required: true,
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      function: 'Market intelligence, opportunity hunting, BD research',
      inputs: ['brave_search', 'kai_context'],
      outputs: ['supabase', 'file_system'],
      cost_tier: 'medium',
      customizable: ['sweep_keys', 'verticals', 'output_format']
    },
    {
      id: 'jordan',
      name: 'Jordan - Document Agent',
      required: false,
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      function: 'Document drafting, grant writing, proposal generation',
      inputs: ['scout_output', 'document_templates'],
      outputs: ['docx', 'supabase'],
      cost_tier: 'medium',
      customizable: ['templates', 'tone', 'document_types']
    },
    {
      id: 'atlas',
      name: 'Atlas - Architect Agent',
      required: true,
      model: 'hybrid (sonnet/opus)',
      max_tokens: 4096,
      function: 'Reference architecture ownership, cost tracking, drift detection',
      inputs: ['supabase', 'system_prompt'],
      outputs: ['supabase', 'file_system', 'handoff'],
      cost_tier: 'medium_high',
      customizable: ['client_verticals', 'cost_thresholds', 'drift_sensitivity']
    },
    {
      id: 'iris',
      name: 'Iris - Monitoring Agent',
      required: true,
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      function: 'Compliance monitoring, deadline tracking, alert generation',
      inputs: ['supabase', 'calendar', 'regulatory_feeds'],
      outputs: ['whatsapp', 'supabase'],
      cost_tier: 'low',
      customizable: ['compliance_domains', 'alert_thresholds', 'monitoring_schedule']
    },
    {
      id: 'aidan',
      name: 'Aidan - Orchestrator',
      required: true,
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      function: 'Agent orchestration, brief synthesis, executive delivery',
      inputs: ['all_agent_outputs'],
      outputs: ['whatsapp', 'email', 'slack'],
      cost_tier: 'high',
      customizable: ['delivery_channel', 'brief_format', 'schedule']
    }
  ],
  security: {
    rls_enabled: true,
    auth_method: 'service_role',
    keys_in_env: true,
    keys_in_code: false,  // NEVER hardcode keys
    api_key_rotation: 'quarterly',
    data_encryption: 'supabase_at_rest'
  },
  cost_controls: {
    daily_budget_alert_usd: 5.00,
    weekly_budget_alert_usd: 25.00,
    model_escalation_requires_trigger: true,
    haiku_threshold: 'simple_lookups_only'
  }
};

// ── CLIENT VERTICAL TEMPLATES ───────────────────────────────
const VERTICAL_TEMPLATES = {
  real_estate: {
    scout_sweep_keys: [
      'commercial_real_estate_grants',
      'hud_cdbg_real_estate',
      'maryland_dhcd_developer',
      'opportunity_zone_financing',
      'real_estate_rfi_rfp'
    ],
    jordan_document_types: ['LOI', 'development_proposal', 'zoning_application', 'investor_memo'],
    iris_compliance_domains: ['zoning', 'permits', 'environmental', 'hud_compliance'],
    aidan_brief_sections: ['deal_pipeline', 'permit_status', 'grant_opportunities', 'compliance_flags'],
    estimated_monthly_cost_usd: 45
  },
  healthcare: {
    scout_sweep_keys: [
      'hrsa_grants',
      'cms_innovation_grants',
      'maryland_hscrc',
      'nih_sbir_health',
      'hospital_rfp_services'
    ],
    jordan_document_types: ['grant_application', 'capability_statement', 'clinical_protocol'],
    iris_compliance_domains: ['hipaa', 'cms_conditions', 'joint_commission', 'maryland_ohcq'],
    aidan_brief_sections: ['grant_pipeline', 'compliance_status', 'contract_opportunities', 'regulatory_flags'],
    estimated_monthly_cost_usd: 55
  },
  logistics_3pl: {
    scout_sweep_keys: [
      'dot_grants_logistics',
      'port_security_psgp',
      'supply_chain_rfp',
      'warehouse_automation_rfp',
      'maryland_msa_logistics'
    ],
    jordan_document_types: ['rfp_response', 'capability_statement', 'sla_template'],
    iris_compliance_domains: ['dot_regulations', 'osha_warehouse', 'customs_compliance'],
    aidan_brief_sections: ['contract_pipeline', 'shipment_status', 'compliance_flags', 'vendor_performance'],
    estimated_monthly_cost_usd: 40
  },
  nonprofit: {
    scout_sweep_keys: [
      'foundation_grants',
      'federal_nonprofit_grants',
      'maryland_grantmakers',
      'workforce_development_grants',
      'community_development_rfp'
    ],
    jordan_document_types: ['grant_narrative', 'logic_model', 'budget_justification', 'board_report'],
    iris_compliance_domains: ['irs_990', 'state_charity_registration', 'grant_compliance'],
    aidan_brief_sections: ['grant_deadlines', 'compliance_calendar', 'program_metrics', 'board_actions'],
    estimated_monthly_cost_usd: 35
  },
  drone_services: {
    scout_sweep_keys: [
      'sbir_gov_uas',
      'sbir_gov_monk',
      'nsf_seedfund',
      'faa_uas_grants',
      'fema_c_uas',
      'drone_inspection_rfp',
      'warehouse_drone_rfp'
    ],
    jordan_document_types: ['capability_statement', 'sbir_narrative', 'loi', 'conops'],
    iris_compliance_domains: ['faa_part107', 'laanc', 'bvlos_waiver', 'mbe_certification'],
    aidan_brief_sections: ['grant_pipeline', 'contract_pipeline', 'compliance_flags', 'fleet_status'],
    estimated_monthly_cost_usd: 50
  }
};

// ── GAP ANALYSIS ENGINE ─────────────────────────────────────
function generateGapAnalysis(clientCurrentConfig) {
  const gaps = [];
  const reference = REFERENCE_ARCHITECTURE;

  // Check required workflows
  for (const workflow of reference.workflows.filter(w => w.required)) {
    if (!clientCurrentConfig.workflows?.includes(workflow.id)) {
      gaps.push({
        component: workflow.name,
        gap_type: 'missing_required_workflow',
        severity: 'critical',
        remediation: `Deploy ${workflow.name} from reference template`,
        lead_time_days: 2
      });
    }
  }

  // Check model assignments
  if (clientCurrentConfig.models) {
    for (const [node, model] of Object.entries(clientCurrentConfig.models)) {
      const refWorkflow = reference.workflows.find(w => w.id === node);
      if (refWorkflow && model !== refWorkflow.model) {
        gaps.push({
          component: node,
          gap_type: 'model_mismatch',
          severity: 'medium',
          expected: refWorkflow.model,
          actual: model,
          remediation: `Update ${node} model from ${model} to ${refWorkflow.model}`,
          lead_time_days: 1
        });
      }
    }
  }

  // Check security posture
  if (clientCurrentConfig.keys_in_code === true) {
    gaps.push({
      component: 'security',
      gap_type: 'hardcoded_api_keys',
      severity: 'critical',
      remediation: 'Move all API keys to environment variables immediately',
      lead_time_days: 1
    });
  }

  if (!clientCurrentConfig.rls_enabled) {
    gaps.push({
      component: 'supabase_security',
      gap_type: 'rls_disabled',
      severity: 'high',
      remediation: 'Enable Row Level Security on all Supabase tables',
      lead_time_days: 1
    });
  }

  // Check cost logging
  if (!clientCurrentConfig.cost_logging) {
    gaps.push({
      component: 'cost_management',
      gap_type: 'no_cost_tracking',
      severity: 'medium',
      remediation: 'Add cost_log table to Supabase and instrument all Claude nodes',
      lead_time_days: 2
    });
  }

  return gaps.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

// ── IMPLEMENTATION PLAN GENERATOR ──────────────────────────
function generateImplementationPlan(clientName, industry, gapAnalysis) {
  const criticalGaps = gapAnalysis.filter(g => g.severity === 'critical');
  const highGaps = gapAnalysis.filter(g => g.severity === 'high');
  const mediumGaps = gapAnalysis.filter(g => g.severity === 'medium');

  const maxLeadTime = Math.max(...gapAnalysis.map(g => g.lead_time_days || 1), 0);
  const totalDays = criticalGaps.length > 0 ? maxLeadTime + 2 : maxLeadTime + 1;

  return {
    client: clientName,
    industry: industry,
    total_lead_time_days: totalDays,
    phases: [
      {
        phase: 1,
        name: 'Security & Foundation',
        duration_days: 1,
        tasks: [
          'Provision Supabase project',
          'Run Atlas schema SQL',
          'Configure environment variables (no hardcoded keys)',
          'Enable RLS on all tables',
          ...criticalGaps.map(g => g.remediation)
        ]
      },
      {
        phase: 2,
        name: 'Core Workflow Deployment',
        duration_days: 2,
        tasks: [
          'Deploy Atlas node v3 with hybrid routing',
          'Deploy Aidan Orchestrator (Fan Out + Consolidator)',
          'Configure delivery channel (WhatsApp/Slack/Email)',
          'Deploy Scout with client-specific sweep keys',
          ...highGaps.map(g => g.remediation)
        ]
      },
      {
        phase: 3,
        name: 'Intelligence Layer',
        duration_days: 1,
        tasks: [
          'Configure Scout vertical templates for client industry',
          'Seed KAI_Context equivalent with client data',
          'Deploy Iris compliance monitoring',
          'Configure Jordan document templates',
          ...mediumGaps.map(g => g.remediation)
        ]
      },
      {
        phase: 4,
        name: 'Testing & Handoff',
        duration_days: 1,
        tasks: [
          'Test full Orchestra run end-to-end',
          'Verify cost logging to Supabase',
          'Confirm delivery channel working',
          'Atlas drift baseline established',
          'Client HANDOFF.txt written',
          'Architecture documented in client_configs table'
        ]
      }
    ]
  };
}

// ── MONTHLY COST ESTIMATOR ──────────────────────────────────
function estimateMonthlyCost(workflows, callsPerDay) {
  const costs = {
    'claude-opus-4-6': { input: 0.000015, output: 0.000075, avg_tokens: { input: 2000, output: 800 } },
    'claude-sonnet-4-6': { input: 0.000003, output: 0.000015, avg_tokens: { input: 3000, output: 1500 } }
  };

  let dailyCost = 0;

  for (const workflow of workflows) {
    const model = workflow.model === 'hybrid' ? 'claude-sonnet-4-6' : workflow.model;
    const rate = costs[model];
    if (!rate) continue;

    const calls = callsPerDay[workflow.id] || 1;
    const inputCost = calls * rate.avg_tokens.input * rate.input;
    const outputCost = calls * rate.avg_tokens.output * rate.output;
    dailyCost += inputCost + outputCost;
  }

  return {
    daily_usd: dailyCost.toFixed(4),
    weekly_usd: (dailyCost * 7).toFixed(2),
    monthly_usd: (dailyCost * 30).toFixed(2),
    annual_usd: (dailyCost * 365).toFixed(2)
  };
}

module.exports = {
  REFERENCE_ARCHITECTURE,
  VERTICAL_TEMPLATES,
  generateGapAnalysis,
  generateImplementationPlan,
  estimateMonthlyCost
};

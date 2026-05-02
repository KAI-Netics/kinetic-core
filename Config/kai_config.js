// ============================================================
// KAI-NETICS PLATFORM CONFIG
// Single source of truth for all platform credentials and settings
// Update here -- applies to all agents automatically
// Last updated: 2026-04-29
// ============================================================

module.exports = {

  // ---- ANTHROPIC API ----------------------------------------
  // Update model strings here when Anthropic releases new versions
  // Sonnet = fast + capable (most agents)
  // Opus   = deep synthesis (Sage newsletter, Scribe context patches)
  anthropic_key:   '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',
  model_sonnet:    'claude-sonnet-4-20250514',
  model_opus:      'claude-opus-4-20250514',

  // ---- SUPABASE ---------------------------------------------
  supabase_url:          'https://raxpmeltyxmtiihxoxpa.supabase.co',
  supabase_anon_key:     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheHBtZWx0eXhtdGlpaHhveHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODI5MDIsImV4cCI6MjA5MjM1ODkwMn0.UScReg6BG4pimbjMeIE7NB2glcpdbgUbDLnDhDLURPM',
  supabase_service_key:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheHBtZWx0eXhtdGlpaHhveHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc4MjkwMiwiZXhwIjoyMDkyMzU4OTAyfQ.crvqKgKtkWl5tSzBXAj2UV_JUfKIYG-SdDz_QpcM1iM',

  // ---- EVOLUTION API (WhatsApp) -----------------------------
  evolution_host:     'host.docker.internal',
  evolution_port:     8081,
  evolution_key:      'Kevin2026',
  evolution_instance: 'Aidan',
  whatsapp_number:    '14432576836@s.whatsapp.net',

  // ---- N8N --------------------------------------------------
  n8n_host: 'host.docker.internal',
  n8n_port: 5678,

  // ---- BRAVE SEARCH -----------------------------------------
  brave_api_key: 'BSAWHBob7ILPlWV-JX8iFTOr4wDaQ1I',

  // ---- SMTP -------------------------------------------------
  smtp_host:    'smtpout.secureserver.net',
  smtp_port:    465,
  smtp_from:    'kas@kevin-llc.com',
  smtp_test_to: 'kas42869@gmail.com',

  // ---- PATHS ------------------------------------------------
  data_root:    '/data',
  context_file: '/data/KAI_Context.json',
  handoff_file: '/data/HANDOFF.txt',
  outputs_root: '/data/Aidan_Outputs',

  // ---- PLATFORM IDENTITY ------------------------------------
  platform_name:    'KAI-Netics Core Engine',
  platform_version: '1.0',
  owner:            'Kevin Alexander Smith',
  entity_fp:        'Kevin Alexander International LLC dba KAI-Netics',
  entity_eaf:       'KAI-Netics Equity & Autonomy Foundry, Inc.',
  ein_fp:           '46-2432851',
  ein_eaf:          '41-4820296',

};

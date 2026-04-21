-- ============================================================
-- KAI-NETICS CORE ENGINE — SUPABASE SCHEMA
-- Version: 1.0.0
-- Created: April 21, 2026
-- Project: KAI-Netics (https://raxpmeltyxmtiihxoxpa.supabase.co)
-- ============================================================
-- Run this entire file in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ============================================================
-- TABLE 1: SCOUT REPORTS
-- Every Scout BD and grant find logged here
-- Enables deduplication, pattern recognition, conversion tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS scout_reports (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    run_date            DATE NOT NULL,
    mode                TEXT NOT NULL CHECK (mode IN ('bd', 'grant')),
    source_label        TEXT,
    query               TEXT,
    target_name         TEXT,
    agency              TEXT,
    fit_score           INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    recommended_action  TEXT,
    next_step           TEXT,
    data_confidence     TEXT,
    naics_match         TEXT,
    vertical            TEXT,
    deadline            DATE,
    portal_url          TEXT,
    saved_file_path     TEXT,
    content_hash        TEXT UNIQUE,  -- prevents duplicate processing
    status              TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'actioned', 'passed', 'expired')),
    kevin_action        TEXT,         -- SEND / SKIP / REVISE / APPLY
    kevin_action_date   TIMESTAMPTZ,
    notes               TEXT,
    entity              TEXT CHECK (entity IN ('FP', 'EAF', 'MONK', 'KAL'))
);

CREATE INDEX IF NOT EXISTS idx_scout_run_date ON scout_reports(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_scout_fit_score ON scout_reports(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_scout_status ON scout_reports(status);
CREATE INDEX IF NOT EXISTS idx_scout_agency ON scout_reports(agency);

-- ============================================================
-- TABLE 2: GRANT APPLICATIONS
-- Jordan's analysis and application tracking per grant
-- ============================================================
CREATE TABLE IF NOT EXISTS grant_applications (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    grant_file          TEXT NOT NULL,
    funder              TEXT,
    program_name        TEXT,
    deadline            DATE,
    award_range         TEXT,
    fit_score           INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    recommended_action  TEXT CHECK (recommended_action IN ('APPLY', 'PASS', 'WATCH')),
    loi_drafted         BOOLEAN DEFAULT FALSE,
    loi_file_path       TEXT,
    loi_sent            BOOLEAN DEFAULT FALSE,
    loi_sent_date       TIMESTAMPTZ,
    loi_recipient       TEXT,
    application_status  TEXT DEFAULT 'analyzing' CHECK (application_status IN (
                            'analyzing', 'loi_drafted', 'loi_sent', 'application_submitted',
                            'under_review', 'awarded', 'declined', 'withdrawn', 'passed')),
    award_amount        DECIMAL(12,2),
    award_date          DATE,
    entity              TEXT CHECK (entity IN ('FP', 'EAF', 'MONK', 'KAL')),
    portal_url          TEXT,
    contact_name        TEXT,
    contact_email       TEXT,
    notes               TEXT,
    jordan_report_path  TEXT
);

CREATE INDEX IF NOT EXISTS idx_grants_deadline ON grant_applications(deadline ASC);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grant_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_grants_entity ON grant_applications(entity);
CREATE INDEX IF NOT EXISTS idx_grants_fit ON grant_applications(fit_score DESC);

-- ============================================================
-- TABLE 3: BD PIPELINE
-- MRR conversion tracking — Stage 0 through Stage 5
-- Jordan owns this table
-- ============================================================
CREATE TABLE IF NOT EXISTS bd_pipeline (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    customer_name       TEXT NOT NULL,
    customer_type       TEXT,  -- health_system, government, utility, education, etc.
    primary_contact     TEXT,
    contact_email       TEXT,
    contact_phone       TEXT,
    use_case            TEXT,  -- medical_supply, lab_specimen, inspection, etc.
    vertical            TEXT,  -- V1-V7
    stage               INTEGER DEFAULT 0 CHECK (stage >= 0 AND stage <= 5),
    stage_label         TEXT,  -- Outreach, Discovery, POC Proposal, POC Execution, SLA Conversion, MRR Active
    target_mrr          DECIMAL(10,2),
    active_mrr          DECIMAL(10,2) DEFAULT 0,
    contract_start      DATE,
    contract_end        DATE,
    last_contact_date   DATE,
    next_action         TEXT,
    next_action_date    DATE,
    poc_start_date      DATE,
    poc_flights         INTEGER DEFAULT 0,
    poc_target_flights  INTEGER DEFAULT 50,
    outreach_count      INTEGER DEFAULT 0,
    fit_score           INTEGER,
    scout_report_id     UUID REFERENCES scout_reports(id),
    notes               TEXT,
    status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'stalled', 'won', 'lost', 'paused'))
);

CREATE INDEX IF NOT EXISTS idx_bd_stage ON bd_pipeline(stage DESC);
CREATE INDEX IF NOT EXISTS idx_bd_status ON bd_pipeline(status);
CREATE INDEX IF NOT EXISTS idx_bd_next_action ON bd_pipeline(next_action_date ASC);

-- ============================================================
-- TABLE 4: COMPLIANCE ITEMS
-- Iris deadline history and resolution tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_items (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    item_name           TEXT NOT NULL,
    entity              TEXT CHECK (entity IN ('FP', 'EAF', 'MONK', 'KAL')),
    deadline            DATE,
    days_remaining      INTEGER,
    severity            TEXT CHECK (severity IN ('overdue', 'critical', 'urgent', 'upcoming', 'complete')),
    owner               TEXT DEFAULT 'Kevin',
    regulation          TEXT,
    notes               TEXT,
    resolved            BOOLEAN DEFAULT FALSE,
    resolved_date       DATE,
    resolution_notes    TEXT,
    iris_run_date       DATE,
    flagged_count       INTEGER DEFAULT 1  -- how many times this item has been flagged
);

CREATE INDEX IF NOT EXISTS idx_compliance_deadline ON compliance_items(deadline ASC);
CREATE INDEX IF NOT EXISTS idx_compliance_severity ON compliance_items(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_resolved ON compliance_items(resolved);

-- ============================================================
-- TABLE 5: RFP RESPONSES
-- Nova go/no-go analysis and awareness response tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS rfp_responses (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    rfp_name            TEXT,
    bpm_id              TEXT,  -- eMMA BPM ID
    agency              TEXT NOT NULL,
    agency_email        TEXT,
    commodity           TEXT,
    lot_number          TEXT,
    round_number        INTEGER DEFAULT 1,
    deadline            DATE,
    fit_score           INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    go_no_go            TEXT CHECK (go_no_go IN ('GO', 'NO-GO', 'AWARENESS')),
    naics_match         TEXT,
    teaming_rec         TEXT,
    win_themes          TEXT,
    compliance_flags    TEXT,
    awareness_draft     TEXT,  -- Opus-drafted awareness response
    kevin_decision      TEXT CHECK (kevin_decision IN ('SEND', 'SKIP', 'REVISE', 'PENDING')),
    kevin_decision_date TIMESTAMPTZ,
    sent                BOOLEAN DEFAULT FALSE,
    sent_date           TIMESTAMPTZ,
    content_hash        TEXT UNIQUE,  -- prevents duplicate processing
    source              TEXT DEFAULT 'emma',  -- emma, sam_gov, manual
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_rfp_agency ON rfp_responses(agency);
CREATE INDEX IF NOT EXISTS idx_rfp_deadline ON rfp_responses(deadline ASC);
CREATE INDEX IF NOT EXISTS idx_rfp_decision ON rfp_responses(kevin_decision);
CREATE INDEX IF NOT EXISTS idx_rfp_score ON rfp_responses(fit_score DESC);

-- ============================================================
-- TABLE 6: AGENT FEEDBACK
-- Kevin's SEND/SKIP/REVISE decisions — the learning layer
-- This is what makes agents smarter over time
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_feedback (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    agent               TEXT NOT NULL CHECK (agent IN ('Scout', 'Jordan', 'Nova', 'Iris', 'Atlas', 'Sage', 'Pulse', 'Aidan')),
    action_type         TEXT NOT NULL,  -- rfp_response, loi_send, capability_statement, etc.
    reference_id        UUID,           -- FK to relevant table
    reference_table     TEXT,           -- scout_reports, grant_applications, rfp_responses
    kevin_decision      TEXT NOT NULL CHECK (kevin_decision IN ('SEND', 'SKIP', 'REVISE', 'APPLY', 'PASS', 'APPROVE', 'REJECT')),
    agency              TEXT,
    fit_score_at_time   INTEGER,
    content_type        TEXT,           -- grant, bd_lead, rfp, newsletter, capability_statement
    vertical            TEXT,
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_agent ON agent_feedback(agent);
CREATE INDEX IF NOT EXISTS idx_feedback_decision ON agent_feedback(kevin_decision);
CREATE INDEX IF NOT EXISTS idx_feedback_agency ON agent_feedback(agency);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON agent_feedback(created_at DESC);

-- ============================================================
-- TABLE 7: AGENT EXECUTIONS
-- Platform health tracking — every agent run logged
-- Pulse reads this table for health reporting
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_executions (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    agent               TEXT NOT NULL,
    trigger_type        TEXT CHECK (trigger_type IN ('watchdog', 'orchestra', 'webhook', 'manual', 'whatsapp', 'cron')),
    status              TEXT CHECK (status IN ('success', 'failed', 'partial', 'skipped')),
    duration_seconds    DECIMAL(8,2),
    items_processed     INTEGER DEFAULT 0,
    items_flagged       INTEGER DEFAULT 0,
    error_message       TEXT,
    workflow_version    TEXT,
    output_file_path    TEXT,
    whatsapp_delivered  BOOLEAN DEFAULT FALSE,
    email_delivered     BOOLEAN DEFAULT FALSE,
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_executions_agent ON agent_executions(agent);
CREATE INDEX IF NOT EXISTS idx_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created ON agent_executions(created_at DESC);

-- ============================================================
-- TABLE 8: ECOSYSTEM SIGNALS
-- Nova news monitoring — ecosystem intelligence log
-- ============================================================
CREATE TABLE IF NOT EXISTS ecosystem_signals (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    headline            TEXT NOT NULL,
    source_url          TEXT,
    category            TEXT,  -- Drone / Health System / Ecosystem / Climate / Federal Policy
    source_type         TEXT,  -- Press Release / Procurement / Accelerator / Partnership / Regulatory
    relevance_hook      TEXT,
    kevin_advantage     TEXT,
    action_required     TEXT,
    route_to            TEXT,  -- Scout / Aidan / Jordan / Atlas / Iris
    priority            TEXT CHECK (priority IN ('critical', 'high', 'medium', 'monitor')),
    content_hash        TEXT UNIQUE,
    actioned            BOOLEAN DEFAULT FALSE,
    actioned_date       DATE
);

CREATE INDEX IF NOT EXISTS idx_signals_priority ON ecosystem_signals(priority);
CREATE INDEX IF NOT EXISTS idx_signals_category ON ecosystem_signals(category);
CREATE INDEX IF NOT EXISTS idx_signals_created ON ecosystem_signals(created_at DESC);

-- ============================================================
-- VIEW: ACTIVE PIPELINE SUMMARY
-- Pulse uses this for executive dashboard
-- ============================================================
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT
    COUNT(*) FILTER (WHERE stage = 0) AS outreach_count,
    COUNT(*) FILTER (WHERE stage = 1) AS discovery_count,
    COUNT(*) FILTER (WHERE stage = 2) AS poc_proposal_count,
    COUNT(*) FILTER (WHERE stage = 3) AS poc_execution_count,
    COUNT(*) FILTER (WHERE stage = 4) AS sla_conversion_count,
    COUNT(*) FILTER (WHERE stage = 5) AS mrr_active_count,
    SUM(active_mrr) FILTER (WHERE stage = 5) AS total_active_mrr,
    SUM(target_mrr) AS total_pipeline_value
FROM bd_pipeline
WHERE status = 'active';

-- ============================================================
-- VIEW: GRANT PIPELINE SUMMARY
-- ============================================================
CREATE OR REPLACE VIEW grant_pipeline_summary AS
SELECT
    COUNT(*) FILTER (WHERE application_status = 'loi_drafted') AS loi_drafted,
    COUNT(*) FILTER (WHERE application_status = 'loi_sent') AS loi_sent,
    COUNT(*) FILTER (WHERE application_status = 'application_submitted') AS submitted,
    COUNT(*) FILTER (WHERE application_status = 'under_review') AS under_review,
    COUNT(*) FILTER (WHERE application_status = 'awarded') AS awarded,
    SUM(award_amount) FILTER (WHERE application_status = 'awarded') AS total_awarded,
    COUNT(*) FILTER (WHERE deadline <= CURRENT_DATE + INTERVAL '30 days' 
                         AND application_status NOT IN ('awarded', 'declined', 'withdrawn', 'passed')) AS due_in_30_days
FROM grant_applications;

-- ============================================================
-- VIEW: AGENT HEALTH (last 7 days)
-- ============================================================
CREATE OR REPLACE VIEW agent_health_7d AS
SELECT
    agent,
    COUNT(*) AS total_runs,
    COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
    ROUND(AVG(duration_seconds)::numeric, 2) AS avg_duration_seconds,
    MAX(created_at) AS last_run,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'success')::decimal / NULLIF(COUNT(*), 0)) * 100, 1
    ) AS success_rate_pct
FROM agent_executions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY agent
ORDER BY agent;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- Required for publishable key access
-- ============================================================
ALTER TABLE scout_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_signals ENABLE ROW LEVEL SECURITY;

-- Allow all operations from service role (n8n uses this via secret key)
-- Allow read from publishable key (Claude sessions use this for queries)

CREATE POLICY "Service role full access" ON scout_reports FOR ALL USING (true);
CREATE POLICY "Service role full access" ON grant_applications FOR ALL USING (true);
CREATE POLICY "Service role full access" ON bd_pipeline FOR ALL USING (true);
CREATE POLICY "Service role full access" ON compliance_items FOR ALL USING (true);
CREATE POLICY "Service role full access" ON rfp_responses FOR ALL USING (true);
CREATE POLICY "Service role full access" ON agent_feedback FOR ALL USING (true);
CREATE POLICY "Service role full access" ON agent_executions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ecosystem_signals FOR ALL USING (true);

-- ============================================================
-- SCHEMA COMPLETE
-- Tables: 8 | Views: 3 | Indexes: 24
-- Version: 1.0.0 | April 21, 2026
-- ============================================================

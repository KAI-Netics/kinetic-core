-- ============================================================
-- KAI-NETICS PIPELINE TABLE
-- Run this in Supabase SQL Editor
-- Tracks ALL pursued opportunities across Nova (grants/EAF) and Scout (BD/FP)
-- ============================================================

CREATE TABLE IF NOT EXISTS pipeline (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  -- Identity
  title               text NOT NULL,
  source              text,                          -- Nova|Scout|Manual
  source_ref          text,                          -- file path or report ID

  -- Classification
  entity              text,                          -- FP|EAF|MONK|MULTI
  beachhead           text,                          -- BH1-BH7|NEW|ADJACENT
  scope               text,                          -- LOCAL|STATE|FEDERAL|NATIONAL|INTERNATIONAL|ASPIRATIONAL
  opportunity_type    text,                          -- grant|contract|consulting|sbir|licensing|partnership

  -- Financials
  award_value         text,
  revenue_type        text,                          -- recurring|one-time|grant|non-dilutive

  -- Timeline
  deadline            text,
  next_action_date    date,

  -- Status
  status              text DEFAULT 'pursuing',       -- pursuing|applied|won|lost|paused|watching
  fit_score           integer,
  kevin_note          text,                          -- what Kevin said when he said pursue

  -- Downstream triggers fired
  jordan_triggered    boolean DEFAULT false,
  iris_triggered      boolean DEFAULT false,
  atlas_triggered     boolean DEFAULT false,

  -- Unlock gate (for aspirational items)
  unlock_gate         text,

  -- Constraint flags
  constraint_flags    text[]
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS pipeline_status_idx ON pipeline(status);
CREATE INDEX IF NOT EXISTS pipeline_entity_idx ON pipeline(entity);
CREATE INDEX IF NOT EXISTS pipeline_scope_idx ON pipeline(scope);
CREATE INDEX IF NOT EXISTS pipeline_created_idx ON pipeline(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_updated_at_trigger
  BEFORE UPDATE ON pipeline
  FOR EACH ROW EXECUTE FUNCTION update_pipeline_updated_at();

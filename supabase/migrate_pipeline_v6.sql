-- KAI-Netics Scout v6 + Nova Pursue v2 Schema Migration
-- Generated: 2026-05-10 12:54:41
-- Idempotent: safe to re-run

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='source_url') THEN
    ALTER TABLE public.pipeline ADD COLUMN source_url TEXT;
    RAISE NOTICE 'ADDED: source_url';
  ELSE RAISE NOTICE 'EXISTS: source_url'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='source_title') THEN
    ALTER TABLE public.pipeline ADD COLUMN source_title TEXT;
    RAISE NOTICE 'ADDED: source_title';
  ELSE RAISE NOTICE 'EXISTS: source_title'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='source_platform') THEN
    ALTER TABLE public.pipeline ADD COLUMN source_platform TEXT;
    RAISE NOTICE 'ADDED: source_platform';
  ELSE RAISE NOTICE 'EXISTS: source_platform'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='raw_snippet') THEN
    ALTER TABLE public.pipeline ADD COLUMN raw_snippet TEXT;
    RAISE NOTICE 'ADDED: raw_snippet';
  ELSE RAISE NOTICE 'EXISTS: raw_snippet'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='why_this_matters') THEN
    ALTER TABLE public.pipeline ADD COLUMN why_this_matters TEXT;
    RAISE NOTICE 'ADDED: why_this_matters';
  ELSE RAISE NOTICE 'EXISTS: why_this_matters'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='why_kai_fits') THEN
    ALTER TABLE public.pipeline ADD COLUMN why_kai_fits TEXT;
    RAISE NOTICE 'ADDED: why_kai_fits';
  ELSE RAISE NOTICE 'EXISTS: why_kai_fits'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='outreach_draft') THEN
    ALTER TABLE public.pipeline ADD COLUMN outreach_draft TEXT;
    RAISE NOTICE 'ADDED: outreach_draft';
  ELSE RAISE NOTICE 'EXISTS: outreach_draft'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='pursuit_steps') THEN
    ALTER TABLE public.pipeline ADD COLUMN pursuit_steps TEXT;
    RAISE NOTICE 'ADDED: pursuit_steps';
  ELSE RAISE NOTICE 'EXISTS: pursuit_steps'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='contact_name') THEN
    ALTER TABLE public.pipeline ADD COLUMN contact_name TEXT;
    RAISE NOTICE 'ADDED: contact_name';
  ELSE RAISE NOTICE 'EXISTS: contact_name'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='contact_email') THEN
    ALTER TABLE public.pipeline ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'ADDED: contact_email';
  ELSE RAISE NOTICE 'EXISTS: contact_email'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='source_gap_warnings') THEN
    ALTER TABLE public.pipeline ADD COLUMN source_gap_warnings TEXT;
    RAISE NOTICE 'ADDED: source_gap_warnings';
  ELSE RAISE NOTICE 'EXISTS: source_gap_warnings'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='confidence_score') THEN
    ALTER TABLE public.pipeline ADD COLUMN confidence_score INTEGER DEFAULT 0;
    RAISE NOTICE 'ADDED: confidence_score';
  ELSE RAISE NOTICE 'EXISTS: confidence_score'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='urgency') THEN
    ALTER TABLE public.pipeline ADD COLUMN urgency TEXT DEFAULT 'LOW';
    RAISE NOTICE 'ADDED: urgency';
  ELSE RAISE NOTICE 'EXISTS: urgency'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='discovered_by_agent') THEN
    ALTER TABLE public.pipeline ADD COLUMN discovered_by_agent TEXT;
    RAISE NOTICE 'ADDED: discovered_by_agent';
  ELSE RAISE NOTICE 'EXISTS: discovered_by_agent'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='run_date') THEN
    ALTER TABLE public.pipeline ADD COLUMN run_date DATE;
    RAISE NOTICE 'ADDED: run_date';
  ELSE RAISE NOTICE 'EXISTS: run_date'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='fit_score') THEN
    ALTER TABLE public.pipeline ADD COLUMN fit_score INTEGER DEFAULT 0;
    RAISE NOTICE 'ADDED: fit_score';
  ELSE RAISE NOTICE 'EXISTS: fit_score'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='recommended_action') THEN
    ALTER TABLE public.pipeline ADD COLUMN recommended_action TEXT;
    RAISE NOTICE 'ADDED: recommended_action';
  ELSE RAISE NOTICE 'EXISTS: recommended_action'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='opportunity_type') THEN
    ALTER TABLE public.pipeline ADD COLUMN opportunity_type TEXT;
    RAISE NOTICE 'ADDED: opportunity_type';
  ELSE RAISE NOTICE 'EXISTS: opportunity_type'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='beachhead') THEN
    ALTER TABLE public.pipeline ADD COLUMN beachhead TEXT;
    RAISE NOTICE 'ADDED: beachhead';
  ELSE RAISE NOTICE 'EXISTS: beachhead'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='jordan_triggered') THEN
    ALTER TABLE public.pipeline ADD COLUMN jordan_triggered BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'ADDED: jordan_triggered';
  ELSE RAISE NOTICE 'EXISTS: jordan_triggered'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='iris_triggered') THEN
    ALTER TABLE public.pipeline ADD COLUMN iris_triggered BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'ADDED: iris_triggered';
  ELSE RAISE NOTICE 'EXISTS: iris_triggered'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='atlas_triggered') THEN
    ALTER TABLE public.pipeline ADD COLUMN atlas_triggered BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'ADDED: atlas_triggered';
  ELSE RAISE NOTICE 'EXISTS: atlas_triggered'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='kevin_note') THEN
    ALTER TABLE public.pipeline ADD COLUMN kevin_note TEXT;
    RAISE NOTICE 'ADDED: kevin_note';
  ELSE RAISE NOTICE 'EXISTS: kevin_note'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='content_hash') THEN
    ALTER TABLE public.pipeline ADD COLUMN content_hash TEXT;
    RAISE NOTICE 'ADDED: content_hash';
  ELSE RAISE NOTICE 'EXISTS: content_hash'; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pipeline' AND column_name='saved_file_path') THEN
    ALTER TABLE public.pipeline ADD COLUMN saved_file_path TEXT;
    RAISE NOTICE 'ADDED: saved_file_path';
  ELSE RAISE NOTICE 'EXISTS: saved_file_path'; END IF;
END $$;

-- UNIQUE constraint for Nova Pursue v2 upsert (merge-duplicates)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='pipeline' AND constraint_name='pipeline_title_entity_unique') THEN
    ALTER TABLE public.pipeline ADD CONSTRAINT pipeline_title_entity_unique UNIQUE (title, entity);
    RAISE NOTICE 'ADDED constraint: pipeline_title_entity_unique';
  ELSE RAISE NOTICE 'EXISTS constraint: pipeline_title_entity_unique'; END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.pipeline TO anon;
GRANT SELECT, INSERT, UPDATE ON public.pipeline TO authenticated;
GRANT ALL ON public.pipeline TO service_role;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pipeline'
ORDER BY ordinal_position;
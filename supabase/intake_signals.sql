create table if not exists intake_signals (
    id uuid primary key default gen_random_uuid(),

    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    source text,
    raw_input text,

    entity text check (entity in ('FP','EAF','MONK','SHARED')),
    signal_type text,
    business_lane text,

    recommended_agent text,
    urgency text check (urgency in ('now','soon','later','watch')),

    confidence_score integer check (confidence_score >= 0 and confidence_score <= 100),
    rationale text,

    proposed_next_action text,

    approval_required boolean default true,
    approved boolean default false,

    disposition text default 'new',
    promoted_to_pipeline boolean default false,
    promoted_pipeline_id uuid,

    tags text[]
);

create index if not exists idx_intake_signals_entity on intake_signals(entity);
create index if not exists idx_intake_signals_signal_type on intake_signals(signal_type);
create index if not exists idx_intake_signals_disposition on intake_signals(disposition);
create index if not exists idx_intake_signals_created_at on intake_signals(created_at desc);

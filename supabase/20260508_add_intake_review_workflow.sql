alter table intake_signals
add column if not exists reviewed_at timestamptz;

alter table intake_signals
add column if not exists reviewed_by text;

alter table intake_signals
add column if not exists rejected_reason text;

alter table intake_signals
add column if not exists priority_score integer check (
    priority_score is null or (priority_score >= 0 and priority_score <= 100)
);

insert into schema_migrations (migration_name, notes)
values
('20260508_add_intake_review_workflow', 'Added reviewed_at, reviewed_by, rejected_reason, and priority_score fields.')
on conflict (migration_name) do nothing;

create table if not exists intake_decision_log (
    id uuid primary key default gen_random_uuid(),
    intake_signal_id uuid references intake_signals(id) on delete cascade,

    created_at timestamptz default now(),

    decision text not null check (
        decision in ('approved','rejected','promoted','archived','reopened')
    ),

    decided_by text default 'Kevin',
    decision_notes text
);

create index if not exists idx_intake_decision_log_signal
on intake_decision_log(intake_signal_id);

insert into schema_migrations (migration_name, notes)
values
('20260508_create_intake_decision_log', 'Created intake_decision_log table for approval/rejection/promotion audit history.')
on conflict (migration_name) do nothing;

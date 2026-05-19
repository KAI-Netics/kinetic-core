create table if not exists intake_routing_log (
    id uuid primary key default gen_random_uuid(),
    intake_signal_id uuid references intake_signals(id) on delete cascade,

    created_at timestamptz default now(),

    previous_agent text,
    recommended_agent text,
    routed_by text default 'system',

    routing_reason text,
    status text default 'recommended'
);

create index if not exists idx_intake_routing_log_signal
on intake_routing_log(intake_signal_id);

insert into schema_migrations (migration_name, notes)
values
('20260508_create_intake_routing_log', 'Created intake_routing_log table for agent routing audit history.')
on conflict (migration_name) do nothing;

create table if not exists schema_migrations (
    id uuid primary key default gen_random_uuid(),
    migration_name text unique not null,
    applied_at timestamptz default now(),
    applied_by text default 'Kevin',
    notes text
);

insert into schema_migrations (migration_name, notes)
values
('20260508_create_intake_signals', 'Created intake_signals table for entity-aware intake classification.'),
('20260508_add_promotion_fields', 'Added approval and promotion lifecycle fields to intake_signals.')
on conflict (migration_name) do nothing;

alter table intake_signals
add column if not exists promoted_at timestamptz;

alter table intake_signals
add column if not exists promoted_by text;

alter table intake_signals
add column if not exists approval_notes text;

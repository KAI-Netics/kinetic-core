create or replace view intake_attention_queue as
select
    id,
    created_at,
    entity,
    signal_type,
    business_lane,
    recommended_agent,
    urgency,
    priority_score,
    confidence_score,
    disposition,
    approved,
    promoted_to_pipeline,
    latest_decision,
    raw_input,
    rationale,
    proposed_next_action

from intake_queue_view

where
    (
        approved = false
        or approved is null
    )
    and (
        disposition in ('new','reviewed')
    )

order by
    case urgency
        when 'now' then 1
        when 'soon' then 2
        when 'watch' then 3
        when 'later' then 4
        else 5
    end,
    priority_score desc nulls last,
    confidence_score desc nulls last,
    created_at desc;

insert into schema_migrations (migration_name, notes)
values
('20260508_create_intake_attention_queue', 'Created intake_attention_queue operational review view.')
on conflict (migration_name) do nothing;

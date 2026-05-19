create or replace view intake_queue_view as
select
    s.id,
    s.created_at,
    s.entity,
    s.signal_type,
    s.business_lane,
    s.recommended_agent,
    s.urgency,
    s.priority_score,
    s.confidence_score,
    s.disposition,
    s.approved,
    s.promoted_to_pipeline,
    s.raw_input,
    s.rationale,
    s.proposed_next_action,
    s.tags,

    (
        select count(*)
        from intake_routing_log r
        where r.intake_signal_id = s.id
    ) as routing_events,

    (
        select count(*)
        from intake_decision_log d
        where d.intake_signal_id = s.id
    ) as decision_events,

    (
        select d.decision
        from intake_decision_log d
        where d.intake_signal_id = s.id
        order by d.created_at desc
        limit 1
    ) as latest_decision

from intake_signals s
order by
    case s.urgency
        when 'now' then 1
        when 'soon' then 2
        when 'watch' then 3
        when 'later' then 4
        else 5
    end,
    s.priority_score desc nulls last,
    s.created_at desc;

insert into schema_migrations (migration_name, notes)
values
('20260508_create_intake_queue_view', 'Created intake_queue_view for dashboard-ready intake queue display.')
on conflict (migration_name) do nothing;

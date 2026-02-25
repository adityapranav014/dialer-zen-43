-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ Round-robin assignment of unassigned leads to active BDAs                  │
-- │                                                                            │
-- │ Logic:                                                                     │
-- │  1. Finds all unassigned leads (assigned_to IS NULL) within a tenant.      │
-- │  2. Finds all active BDAs (status = 'active') in the same tenant.         │
-- │  3. Distributes leads evenly using round-robin — BDAs with fewer existing  │
-- │     leads get assigned first for fairness.                                 │
-- │  4. Updates leads with the assigned BDA and sets updated_at.              │
-- │                                                                            │
-- │ Usage:                                                                     │
-- │   SELECT public.assign_leads_to_bdas('your-tenant-uuid-here');             │
-- │   -- or for the demo tenant:                                               │
-- │   SELECT public.assign_leads_to_bdas('00000000-0000-0000-0000-000000000000');│
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.assign_leads_to_bdas(_tenant_id UUID)
RETURNS TABLE(lead_id UUID, lead_name TEXT, assigned_bda_id UUID, assigned_bda_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _bda_ids   UUID[];
    _bda_count INT;
    _lead      RECORD;
    _idx       INT := 0;
BEGIN
    -- 1. Collect active BDAs ordered by their current lead count (fewest first)
    SELECT ARRAY_AGG(tm.id ORDER BY COALESCE(lc.cnt, 0) ASC, tm.created_at ASC)
      INTO _bda_ids
      FROM public.team_members tm
      LEFT JOIN (
          SELECT l.assigned_to, COUNT(*) AS cnt
            FROM public.leads l
           WHERE l.tenant_id = _tenant_id
             AND l.assigned_to IS NOT NULL
           GROUP BY l.assigned_to
      ) lc ON lc.assigned_to = tm.id
     WHERE tm.tenant_id = _tenant_id
       AND tm.status = 'active';

    _bda_count := COALESCE(array_length(_bda_ids, 1), 0);

    IF _bda_count = 0 THEN
        RAISE NOTICE 'No active BDAs found for tenant %. Skipping assignment.', _tenant_id;
        RETURN;
    END IF;

    -- 2. Loop through unassigned leads and round-robin assign
    FOR _lead IN
        SELECT l.id, l.name
          FROM public.leads l
         WHERE l.tenant_id = _tenant_id
           AND l.assigned_to IS NULL
         ORDER BY l.created_at ASC
    LOOP
        -- Pick BDA using modular index
        UPDATE public.leads
           SET assigned_to = _bda_ids[(_idx % _bda_count) + 1],
               updated_at  = now()
         WHERE id = _lead.id;

        -- Return the assignment for logging
        lead_id          := _lead.id;
        lead_name        := _lead.name;
        assigned_bda_id  := _bda_ids[(_idx % _bda_count) + 1];
        assigned_bda_name := (SELECT tm.name FROM public.team_members tm WHERE tm.id = assigned_bda_id);
        RETURN NEXT;

        _idx := _idx + 1;
    END LOOP;
END;
$$;

-- Grant execute to both authenticated users and anon (demo mode)
GRANT EXECUTE ON FUNCTION public.assign_leads_to_bdas(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_leads_to_bdas(UUID) TO anon;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ Fix assigned_to FK: point to team_members instead of auth.users            │
-- │ team_members have their own UUIDs (not auth user IDs), so the old FK       │
-- │ prevented assigning leads to team members.                                 │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Drop the existing FK that references auth.users
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;

-- Add FK to team_members instead (ON DELETE SET NULL keeps leads when a BDA is removed)
ALTER TABLE public.leads
  ADD CONSTRAINT leads_assigned_to_team_member_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.team_members(id) ON DELETE SET NULL;

-- Insert a well-known "demo" tenant so demo-mode clients can persist
-- team members into the real DB instead of localStorage.
-- UUID is deterministic so the client can reference it as a constant.

INSERT INTO public.tenants (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Demo Workspace')
ON CONFLICT (id) DO NOTHING;

-- Allow anon (unauthenticated / demo) users to manage team_members
-- scoped ONLY to the demo tenant.

CREATE POLICY "Anon can view demo team members"
  ON public.team_members FOR SELECT TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can insert demo team members"
  ON public.team_members FOR INSERT TO anon
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can update demo team members"
  ON public.team_members FOR UPDATE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can delete demo team members"
  ON public.team_members FOR DELETE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

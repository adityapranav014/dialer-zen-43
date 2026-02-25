-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ Anon / demo-mode RLS policies for the leads table                         │
-- │ Allows unauthenticated (demo) users to CRUD leads scoped to the demo      │
-- │ tenant 00000000-0000-0000-0000-000000000000 only.                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "Anon can view demo leads" ON public.leads FOR SELECT TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can insert demo leads" ON public.leads FOR INSERT TO anon
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can update demo leads" ON public.leads FOR UPDATE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can delete demo leads" ON public.leads FOR DELETE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

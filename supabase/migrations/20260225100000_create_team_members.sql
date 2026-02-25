-- Create a standalone team_members table for admin-managed BDA records.
-- This avoids the auth.users FK constraint that prevented persisting
-- team members added by the admin from the client side.

CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint on email within a tenant
ALTER TABLE public.team_members ADD CONSTRAINT team_members_email_tenant_unique UNIQUE (tenant_id, email);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- All authenticated users in the same tenant can view team members
CREATE POLICY "Users can view team members in own tenant"
  ON public.team_members FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Super admins can insert team members in their tenant
CREATE POLICY "Admins can insert team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'super_admin')
  );

-- Super admins can update team members in their tenant
CREATE POLICY "Admins can update team members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'super_admin')
  );

-- Super admins can delete team members from their tenant
CREATE POLICY "Admins can delete team members"
  ON public.team_members FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'super_admin')
  );

-- updated_at trigger
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Also fix: allow super_admins to view ALL user_roles (needed for queries)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super_admins to view all profiles in their tenant
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

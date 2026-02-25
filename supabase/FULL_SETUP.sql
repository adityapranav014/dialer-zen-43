-- ═══════════════════════════════════════════════════════════════════════════════
-- DIALFLOW — FULL DATABASE SETUP
-- Run this ONCE in Supabase Dashboard → SQL Editor on the new project.
-- Project: pmzkptmsquaxfucoungr
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 1. Enums                                                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'interested', 'closed');
CREATE TYPE public.app_role AS ENUM ('super_admin', 'bda');

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 2. Core tables                                                             │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Tenants
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Call logs
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  bda_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Team members (admin-managed BDA records, no auth.users FK required)
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
ALTER TABLE public.team_members ADD CONSTRAINT team_members_email_tenant_unique UNIQUE (tenant_id, email);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 3. Helper functions                                                        │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 4. RLS policies                                                            │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Tenants
CREATE POLICY "Users can view own tenant" ON public.tenants FOR SELECT TO authenticated
  USING (id = public.get_user_tenant_id(auth.uid()));

-- Profiles
CREATE POLICY "Users can view profiles in own tenant" ON public.profiles FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Leads
CREATE POLICY "Users can view leads in own tenant" ON public.leads FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can insert leads in own tenant" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update leads in own tenant" ON public.leads FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Leads (anon / demo mode — scoped to demo tenant only)
CREATE POLICY "Anon can view demo leads" ON public.leads FOR SELECT TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anon can insert demo leads" ON public.leads FOR INSERT TO anon
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anon can update demo leads" ON public.leads FOR UPDATE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anon can delete demo leads" ON public.leads FOR DELETE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

-- Call logs
CREATE POLICY "Users can view call logs in own tenant" ON public.call_logs FOR SELECT TO authenticated
  USING (lead_id IN (SELECT id FROM public.leads WHERE tenant_id = public.get_user_tenant_id(auth.uid())));
CREATE POLICY "BDAs can insert call logs" ON public.call_logs FOR INSERT TO authenticated
  WITH CHECK (bda_id = auth.uid());

-- Team members (authenticated)
CREATE POLICY "Users can view team members in own tenant" ON public.team_members FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can insert team members" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can update team members" ON public.team_members FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can delete team members" ON public.team_members FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'super_admin'));

-- Team members (anon / demo mode — scoped to demo tenant only)
CREATE POLICY "Anon can view demo team members" ON public.team_members FOR SELECT TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anon can insert demo team members" ON public.team_members FOR INSERT TO anon
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anon can update demo team members" ON public.team_members FOR UPDATE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anon can delete demo team members" ON public.team_members FOR DELETE TO anon
  USING (tenant_id = '00000000-0000-0000-0000-000000000000');

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 5. Triggers                                                                │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 6. Auth trigger (Google OAuth + email signup)                              │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID;
  v_display   TEXT;
  v_avatar    TEXT;
BEGIN
  -- Resolve tenant
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name) VALUES ('Default') RETURNING id INTO v_tenant_id;
  END IF;

  -- Display name: try Google full_name → display_name → name → email
  v_display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- Avatar: Google provides avatar_url / picture
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Upsert profile (re-login refreshes photo)
  INSERT INTO public.profiles (user_id, display_name, avatar_url, tenant_id)
  VALUES (
    NEW.id,
    v_display,
    v_avatar,
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, v_tenant_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url   = EXCLUDED.avatar_url,
    updated_at   = now();

  -- Default role = bda (admin promotion handled client-side)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'bda')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 7. Seed: Demo tenant for demo mode                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO public.tenants (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Demo Workspace')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! All tables, functions, policies, triggers, and seed data are ready.
-- ═══════════════════════════════════════════════════════════════════════════════

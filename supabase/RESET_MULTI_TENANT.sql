-- ═══════════════════════════════════════════════════════════════════════════════
-- DIALFLOW — MULTI-TENANT SaaS ARCHITECTURE
-- Complete database reset + new schema + seed data
--
-- RUN THIS IN: Supabase Dashboard → SQL Editor
-- WARNING: This DROPS all existing tables and data!
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 0. DROP EVERYTHING                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

DROP TABLE IF EXISTS public.auth_sessions CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.call_logs CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.tenant_memberships CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

DROP FUNCTION IF EXISTS public.get_user_tenant_id CASCADE;
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.assign_leads_to_bdas CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

DROP TYPE IF EXISTS public.lead_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 1. ENUMS                                                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'interested', 'closed');

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 2. TABLES                                                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Tenants (companies)
CREATE TABLE public.tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  plan        TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- App Users (global — a user can belong to multiple tenants)
CREATE TABLE public.app_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  password_hash   TEXT NOT NULL,
  display_name    TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  avatar_color    TEXT,
  is_super_admin  BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant Memberships (user ↔ company with role)
CREATE TABLE public.tenant_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Auth Sessions (cookie-based auth with tenant context)
CREATE TABLE public.auth_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads (tenant-scoped, assigned to app_users)
CREATE TABLE public.leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  status      public.lead_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Call Logs (tenant-scoped)
CREATE TABLE public.call_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  duration_seconds  INTEGER NOT NULL DEFAULT 0,
  outcome           TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  action_url  TEXT,
  metadata    JSONB DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Settings
CREATE TABLE public.user_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
  notif_new_lead      BOOLEAN NOT NULL DEFAULT true,
  notif_missed_call   BOOLEAN NOT NULL DEFAULT true,
  notif_conversion    BOOLEAN NOT NULL DEFAULT true,
  notif_team_updates  BOOLEAN NOT NULL DEFAULT false,
  notif_daily_summary BOOLEAN NOT NULL DEFAULT true,
  auto_dial_next      BOOLEAN NOT NULL DEFAULT false,
  cooldown_timer      INTEGER NOT NULL DEFAULT 30,
  show_post_call_modal BOOLEAN NOT NULL DEFAULT true,
  call_recording      BOOLEAN NOT NULL DEFAULT true,
  default_lead_status TEXT NOT NULL DEFAULT 'new',
  auto_assign_leads   BOOLEAN NOT NULL DEFAULT false,
  timezone            TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  language            TEXT NOT NULL DEFAULT 'English',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity Logs
CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 3. INDEXES                                                                 │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE INDEX idx_tenant_memberships_user    ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant  ON public.tenant_memberships(tenant_id);
CREATE INDEX idx_leads_tenant               ON public.leads(tenant_id);
CREATE INDEX idx_leads_assigned             ON public.leads(assigned_to);
CREATE INDEX idx_call_logs_tenant           ON public.call_logs(tenant_id);
CREATE INDEX idx_call_logs_user             ON public.call_logs(user_id);
CREATE INDEX idx_call_logs_lead             ON public.call_logs(lead_id);
CREATE INDEX idx_notifications_user         ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_tenant       ON public.activity_logs(tenant_id, created_at DESC);
CREATE INDEX idx_auth_sessions_token        ON public.auth_sessions(token);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 4. FUNCTIONS & TRIGGERS                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at     BEFORE UPDATE ON public.tenants     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_app_users_updated_at   BEFORE UPDATE ON public.app_users   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_leads_updated_at       BEFORE UPDATE ON public.leads       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_settings_updated  BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 5. ROW LEVEL SECURITY (anon-permissive for cookie-based auth)              │
-- └─────────────────────────────────────────────────────────────────────────────┘

ALTER TABLE public.tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs       ENABLE ROW LEVEL SECURITY;

-- Permissive anon policies (app-layer handles authorization via cookie sessions)
CREATE POLICY anon_select_tenants ON public.tenants FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_tenants ON public.tenants FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_tenants ON public.tenants FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_tenants ON public.tenants FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_app_users ON public.app_users FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_app_users ON public.app_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_app_users ON public.app_users FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_app_users ON public.app_users FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_tenant_memberships ON public.tenant_memberships FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_tenant_memberships ON public.tenant_memberships FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_tenant_memberships ON public.tenant_memberships FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_tenant_memberships ON public.tenant_memberships FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_auth_sessions ON public.auth_sessions FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_auth_sessions ON public.auth_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_auth_sessions ON public.auth_sessions FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_auth_sessions ON public.auth_sessions FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_leads ON public.leads FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_leads ON public.leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_leads ON public.leads FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_leads ON public.leads FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_call_logs ON public.call_logs FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_call_logs ON public.call_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_call_logs ON public.call_logs FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_call_logs ON public.call_logs FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_notifications ON public.notifications FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_notifications ON public.notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_notifications ON public.notifications FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_notifications ON public.notifications FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_user_settings ON public.user_settings FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_user_settings ON public.user_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_user_settings ON public.user_settings FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_user_settings ON public.user_settings FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_activity_logs ON public.activity_logs FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_activity_logs ON public.activity_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_activity_logs ON public.activity_logs FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_activity_logs ON public.activity_logs FOR DELETE TO anon USING (true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Tenants ─────────────────────────────────────────────────────────────────

INSERT INTO public.tenants (id, name, slug, plan) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme Corporation',    'acme',       'pro'),
  ('a0000000-0000-0000-0000-000000000002', 'TechStart Solutions',  'techstart',  'pro'),
  ('a0000000-0000-0000-0000-000000000003', 'GrowthLabs Inc',      'growthlabs', 'free');

-- ── Users ───────────────────────────────────────────────────────────────────
-- Passwords are SHA-256 hex hashes (matching client-side crypto.subtle.digest)

INSERT INTO public.app_users (id, email, phone, password_hash, display_name, avatar_color, is_super_admin) VALUES
  -- Super Admin: super@dialflow.com / super123
  ('b0000000-0000-0000-0000-000000000001', 'super@dialflow.com',    '+919800000001', encode(digest('super123', 'sha256'), 'hex'), 'Platform Admin',  'violet', true),
  -- Acme Admin: admin@acme.com / admin123
  ('b0000000-0000-0000-0000-000000000002', 'admin@acme.com',        '+919800000002', encode(digest('admin123', 'sha256'), 'hex'), 'Rajesh Kumar',    'blue',   false),
  -- Acme BDAs
  ('b0000000-0000-0000-0000-000000000003', 'john@acme.com',         '+919800000003', encode(digest('pass123', 'sha256'), 'hex'),  'John Doe',        'emerald', false),
  ('b0000000-0000-0000-0000-000000000004', 'sarah@acme.com',        '+919800000004', encode(digest('pass123', 'sha256'), 'hex'),  'Sarah Wilson',    'orange',  false),
  -- TechStart Admin: admin@techstart.com / admin123
  ('b0000000-0000-0000-0000-000000000005', 'admin@techstart.com',   '+919800000005', encode(digest('admin123', 'sha256'), 'hex'), 'Priya Sharma',    'pink',   false),
  -- TechStart BDA
  ('b0000000-0000-0000-0000-000000000006', 'mike@techstart.com',    '+919800000006', encode(digest('pass123', 'sha256'), 'hex'),  'Mike Johnson',    'cyan',   false);

-- ── Memberships ─────────────────────────────────────────────────────────────

INSERT INTO public.tenant_memberships (user_id, tenant_id, role) VALUES
  -- Super admin has admin access to all companies
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'admin'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'admin'),
  -- Acme team
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'admin'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'member'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'member'),
  -- TechStart team
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'admin'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'member');

-- ── Leads (Acme — 10 leads) ────────────────────────────────────────────────

INSERT INTO public.leads (id, tenant_id, name, phone, status, assigned_to, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Vikram Patel',    '+919876543210', 'new',        'b0000000-0000-0000-0000-000000000003', now() - interval '6 days'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ananya Desai',    '+919876543211', 'contacted',  'b0000000-0000-0000-0000-000000000003', now() - interval '5 days'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Rohit Mehta',     '+919876543212', 'interested', 'b0000000-0000-0000-0000-000000000003', now() - interval '5 days'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Neha Gupta',      '+919876543213', 'closed',     'b0000000-0000-0000-0000-000000000003', now() - interval '4 days'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Arjun Nair',      '+919876543214', 'new',        'b0000000-0000-0000-0000-000000000003', now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Kavitha Reddy',   '+919876543215', 'contacted',  'b0000000-0000-0000-0000-000000000004', now() - interval '5 days'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Sanjay Iyer',     '+919876543216', 'interested', 'b0000000-0000-0000-0000-000000000004', now() - interval '4 days'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Meera Joshi',     '+919876543217', 'new',        'b0000000-0000-0000-0000-000000000004', now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Deepak Sharma',   '+919876543218', 'contacted',  'b0000000-0000-0000-0000-000000000004', now() - interval '2 days'),
  ('c000000a-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Pooja Verma',     '+919876543219', 'closed',     'b0000000-0000-0000-0000-000000000004', now() - interval '1 day');

-- ── Leads (TechStart — 5 leads) ────────────────────────────────────────────

INSERT INTO public.leads (id, tenant_id, name, phone, status, assigned_to, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Aditya Singh',    '+919876543220', 'new',        'b0000000-0000-0000-0000-000000000006', now() - interval '4 days'),
  ('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'Riya Chopra',     '+919876543221', 'contacted',  'b0000000-0000-0000-0000-000000000006', now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000002', 'Karan Malhotra',  '+919876543222', 'interested', 'b0000000-0000-0000-0000-000000000006', now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'Divya Krishnan',  '+919876543223', 'new',        'b0000000-0000-0000-0000-000000000006', now() - interval '2 days'),
  ('c0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000002', 'Manish Tiwari',   '+919876543224', 'contacted',  NULL,                                   now() - interval '1 day');

-- ── Call Logs (Acme — 20 calls) ─────────────────────────────────────────────

INSERT INTO public.call_logs (tenant_id, lead_id, user_id, duration_seconds, outcome, notes, created_at) VALUES
  -- John's calls
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 245, 'Interested',     'Showed interest in premium plan',       now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 120, 'Follow Up',      'Asked for callback next week',          now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 340, 'Interested',     'Wants detailed demo',                   now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 180, 'Closed Won',     'Signed up for annual plan',             now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 420, 'Closed Won',     'Converted to enterprise plan',          now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 60,  'Voicemail',      'Left voicemail',                        now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 150, 'Follow Up',      'Scheduling a demo',                     now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 200, 'Not Interested', 'Budget constraints',                    now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 90,  'Follow Up',      'Will call back after lunch',            now() - interval '12 hours'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 280, 'Interested',     'Ready for proposal',                    now() - interval '4 hours'),
  -- Sarah's calls
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 190, 'Follow Up',      'Needs manager approval',                now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 310, 'Interested',     'Very engaged, wants pricing',           now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 45,  'Wrong Number',   'Wrong contact info',                    now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 220, 'Interested',     'Scheduling meeting with decision maker', now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 400, 'Closed Won',     'Signed annual contract',                now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000001', 'c000000a-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 350, 'Closed Won',     'Quick close — renewal from last year',   now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 170, 'Follow Up',      'Following up on approval',              now() - interval '18 hours'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 130, 'Not Interested', 'Not looking right now',                 now() - interval '6 hours'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 260, 'Interested',     'Sending quote tomorrow',                now() - interval '3 hours'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 180, 'Interested',     'Got budget approval, moving forward',   now() - interval '1 hour');

-- ── Call Logs (TechStart — 10 calls) ────────────────────────────────────────

INSERT INTO public.call_logs (tenant_id, lead_id, user_id, duration_seconds, outcome, notes, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000006', 180, 'Follow Up',      'Initial intro call',                    now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000006', 250, 'Interested',     'Interested in starter package',         now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000006', 300, 'Interested',     'Wants custom integration',              now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000006', 110, 'Voicemail',      'Left message',                          now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000006', 380, 'Closed Won',     'Signed up for pro plan',                now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000006', 90,  'Not Interested', 'Using competitor product',               now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000006', 270, 'Follow Up',      'Needs technical review',                now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000006', 200, 'Interested',     'Ready for demo',                        now() - interval '12 hours'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000006', 140, 'Follow Up',      'Reconsidering after new features',      now() - interval '6 hours'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000006', 320, 'Interested',     'Scheduling final meeting',              now() - interval '2 hours');

-- ── Activity Logs ───────────────────────────────────────────────────────────

INSERT INTO public.activity_logs (tenant_id, user_id, action, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'call_completed',  'John Doe called Vikram Patel — Outcome: Interested',        now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'call_completed',  'Sarah Wilson called Kavitha Reddy — Outcome: Follow Up',     now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'lead_converted',  'John Doe converted Neha Gupta to Closed Won',               now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'lead_converted',  'Sarah Wilson converted Sanjay Iyer to Closed Won',          now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'lead_converted',  'Sarah Wilson converted Pooja Verma to Closed Won',          now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'bda_added',       'Rajesh Kumar added John Doe to the team',                   now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'bda_added',       'Rajesh Kumar added Sarah Wilson to the team',               now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'call_completed',  'John Doe called Arjun Nair — Outcome: Voicemail',           now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'call_completed',  'John Doe called Vikram Patel — Outcome: Follow Up',         now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'call_completed',  'Sarah Wilson called Deepak Sharma — Outcome: Interested',   now() - interval '3 hours'),
  -- TechStart
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'call_completed',  'Mike Johnson called Aditya Singh — Outcome: Follow Up',     now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'lead_converted',  'Mike Johnson converted Riya Chopra to Closed Won',          now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'call_completed',  'Mike Johnson called Karan Malhotra — Outcome: Interested',  now() - interval '2 hours');

-- ── Notifications ───────────────────────────────────────────────────────────

INSERT INTO public.notifications (tenant_id, user_id, type, title, message, priority, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'lead_assigned',       'New Lead Assigned',     'Vikram Patel has been assigned to you',   'normal', now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'achievement',         'Milestone Reached!',    'You completed 10 calls this week',       'high',   now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'system',              'Welcome to DialFlow',   'Start by calling your assigned leads',   'low',    now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'lead_assigned',       'New Lead Assigned',     'Arjun Nair has been assigned to you',    'normal', now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'lead_status_change',  'Lead Updated',          'Pooja Verma moved to Closed',            'normal', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'team_update',         'Team Update',           'Sarah Wilson joined the team',            'normal', now() - interval '6 days'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'lead_assigned',       'New Lead Assigned',     'Aditya Singh has been assigned to you',  'normal', now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'achievement',         'First Conversion!',     'You closed your first deal!',            'high',   now() - interval '2 days');

-- ── User Settings (defaults for all users) ──────────────────────────────────

INSERT INTO public.user_settings (user_id) VALUES
  ('b0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000004'),
  ('b0000000-0000-0000-0000-000000000005'),
  ('b0000000-0000-0000-0000-000000000006');


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Login credentials for testing:
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ROLE            │ COMPANY SLUG │ EMAIL                  │ PASSWORD         │
-- │─────────────────│──────────────│────────────────────────│──────────────────│
-- │ Super Admin     │ (leave empty)│ super@dialflow.com     │ super123         │
-- │ Acme Admin      │ acme         │ admin@acme.com         │ admin123         │
-- │ Acme Member     │ acme         │ john@acme.com          │ pass123          │
-- │ Acme Member     │ acme         │ sarah@acme.com         │ pass123          │
-- │ TechStart Admin │ techstart    │ admin@techstart.com    │ admin123         │
-- │ TechStart Member│ techstart    │ mike@techstart.com     │ pass123          │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- ═══════════════════════════════════════════════════════════════════════════════

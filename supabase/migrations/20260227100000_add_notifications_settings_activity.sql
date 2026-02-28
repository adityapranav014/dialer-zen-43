-- ═══════════════════════════════════════════════════════════════════════════════
-- DIALFLOW — NEW TABLES: notifications, user_settings, activity_logs
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 1. Notifications table                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,            -- 'lead_assigned','lead_status_change','call_reminder','achievement','system','team_update'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal', -- 'low','normal','high','urgent'
  is_read     BOOLEAN NOT NULL DEFAULT false,
  action_url  TEXT,                     -- optional deep-link e.g. "/leads?id=xyz"
  metadata    JSONB DEFAULT '{}',       -- arbitrary payload for frontend rendering
  read_at     TIMESTAMPTZ,             -- null until read
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Admins (or server-side) can insert notifications for any user in their tenant
CREATE POLICY "Tenant users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT get_user_tenant_id(auth.uid()))
  );

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 2. User Settings table                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.user_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notif_new_lead          BOOLEAN NOT NULL DEFAULT true,
  notif_missed_call       BOOLEAN NOT NULL DEFAULT true,
  notif_conversion        BOOLEAN NOT NULL DEFAULT true,
  notif_team_updates      BOOLEAN NOT NULL DEFAULT false,
  notif_daily_summary     BOOLEAN NOT NULL DEFAULT true,
  auto_dial_next          BOOLEAN NOT NULL DEFAULT false,
  cooldown_timer          INTEGER NOT NULL DEFAULT 30,   -- seconds
  show_post_call_modal    BOOLEAN NOT NULL DEFAULT true,
  call_recording          BOOLEAN NOT NULL DEFAULT true,
  default_lead_status     TEXT NOT NULL DEFAULT 'new',
  auto_assign_leads       BOOLEAN NOT NULL DEFAULT false,
  timezone                TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  language                TEXT NOT NULL DEFAULT 'English',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-updated_at trigger
CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 3. Activity Logs table                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,            -- 'call_completed','lead_converted','lead_assigned','bda_added','lead_created','target_reached'
  description TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',       -- lead_id, call_log_id, team_member_id, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Tenant-scoped visibility
CREATE POLICY "Users can view own tenant activity"
  ON public.activity_logs FOR SELECT
  USING (
    tenant_id = (SELECT get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Users can insert own tenant activity"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT get_user_tenant_id(auth.uid()))
  );

-- Demo tenant — allow anon access for demo mode
CREATE POLICY "Anon can view demo activity"
  ON public.activity_logs FOR SELECT
  USING (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon can insert demo activity"
  ON public.activity_logs FOR INSERT
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Index for fast tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON public.activity_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id, created_at DESC);


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 4. Demo tenant — allow anon access for notifications (demo mode)           │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "Anon can view demo notifications"
  ON public.notifications FOR SELECT
  USING (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon can insert demo notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid);

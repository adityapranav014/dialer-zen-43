    -- ═══════════════════════════════════════════════════════════════════════════════
    -- DIALFLOW — Reconcile app_users schema
    --
    -- The cookie_auth_critical migration created app_users with "mobile" column,
    -- but the application code (authService.ts) expects "phone", "is_super_admin",
    -- "is_active", "avatar_color", and a separate tenant_memberships table.
    --
    -- This migration brings the deployed DB in line with the multi-tenant model
    -- used by the application, regardless of which prior script was run.
    -- ═══════════════════════════════════════════════════════════════════════════════

    -- ┌─────────────────────────────────────────────────────────────────────────────┐
    -- │ 1. Add missing columns to app_users                                        │
    -- └─────────────────────────────────────────────────────────────────────────────┘

    -- Rename "mobile" → "phone" if it exists (from the earlier migration)
    DO $$
    BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'mobile'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.app_users RENAME COLUMN mobile TO phone;
    END IF;
    END $$;

    -- Add "phone" if it doesn't exist at all
    DO $$
    BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN phone TEXT;
    END IF;
    END $$;

    -- Add "is_super_admin"
    DO $$
    BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;
    END IF;
    END $$;

    -- Add "is_active"
    DO $$
    BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
    END $$;

    -- Add "avatar_color"
    DO $$
    BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'avatar_color'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN avatar_color TEXT;
    END IF;
    END $$;

    -- Drop the "tenant_id" NOT NULL column if it exists (multi-tenant model uses tenant_memberships instead)
    -- First drop the FK constraint, then make it nullable (we don't drop it to avoid data loss)
    DO $$
    BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'tenant_id'
    ) THEN
        -- Make tenant_id nullable (the multi-tenant model doesn't need it on app_users)
        ALTER TABLE public.app_users ALTER COLUMN tenant_id DROP NOT NULL;
    END IF;
    END $$;

    -- Drop the inline "role" column if it exists (multi-tenant model uses tenant_memberships.role)
    -- We keep the data in case it needs to be migrated
    DO $$
    BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'role'
    ) THEN
        -- Drop the CHECK constraint first (it may block future changes)
        ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
        -- Keep column for backwards compat but make nullable
        ALTER TABLE public.app_users ALTER COLUMN role DROP NOT NULL;
        ALTER TABLE public.app_users ALTER COLUMN role DROP DEFAULT;
    END IF;
    END $$;


    -- ┌─────────────────────────────────────────────────────────────────────────────┐
    -- │ 2. Ensure tenant_memberships table exists                                  │
    -- └─────────────────────────────────────────────────────────────────────────────┘

    CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, tenant_id)
    );

    ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

    -- Anon policies for tenant_memberships
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_memberships' AND policyname = 'anon_select_tenant_memberships') THEN
        CREATE POLICY anon_select_tenant_memberships ON public.tenant_memberships FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_memberships' AND policyname = 'anon_insert_tenant_memberships') THEN
        CREATE POLICY anon_insert_tenant_memberships ON public.tenant_memberships FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_memberships' AND policyname = 'anon_update_tenant_memberships') THEN
        CREATE POLICY anon_update_tenant_memberships ON public.tenant_memberships FOR UPDATE TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_memberships' AND policyname = 'anon_delete_tenant_memberships') THEN
        CREATE POLICY anon_delete_tenant_memberships ON public.tenant_memberships FOR DELETE TO anon USING (true);
    END IF;
    END $$;


    -- ┌─────────────────────────────────────────────────────────────────────────────┐
    -- │ 3. Ensure auth_sessions has tenant_id column                               │
    -- └─────────────────────────────────────────────────────────────────────────────┘

    DO $$
    BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.auth_sessions
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
    END $$;


    -- ┌─────────────────────────────────────────────────────────────────────────────┐
    -- │ 4. Ensure anon RLS policies exist on app_users & auth_sessions             │
    -- └─────────────────────────────────────────────────────────────────────────────┘

    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_users' AND policyname = 'anon_select_app_users') THEN
        CREATE POLICY anon_select_app_users ON public.app_users FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_users' AND policyname = 'anon_insert_app_users') THEN
        CREATE POLICY anon_insert_app_users ON public.app_users FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_users' AND policyname = 'anon_update_app_users') THEN
        CREATE POLICY anon_update_app_users ON public.app_users FOR UPDATE TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_users' AND policyname = 'anon_delete_app_users') THEN
        CREATE POLICY anon_delete_app_users ON public.app_users FOR DELETE TO anon USING (true);
    END IF;
    END $$;

    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auth_sessions' AND policyname = 'anon_select_auth_sessions') THEN
        CREATE POLICY anon_select_auth_sessions ON public.auth_sessions FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auth_sessions' AND policyname = 'anon_insert_auth_sessions') THEN
        CREATE POLICY anon_insert_auth_sessions ON public.auth_sessions FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auth_sessions' AND policyname = 'anon_update_auth_sessions') THEN
        CREATE POLICY anon_update_auth_sessions ON public.auth_sessions FOR UPDATE TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auth_sessions' AND policyname = 'anon_delete_auth_sessions') THEN
        CREATE POLICY anon_delete_auth_sessions ON public.auth_sessions FOR DELETE TO anon USING (true);
    END IF;
    END $$;


    -- ═══════════════════════════════════════════════════════════════════════════════
    -- DONE. After running this migration:
    --   ✓ app_users.phone column exists (renamed from mobile if needed)
    --   ✓ app_users.is_super_admin, is_active, avatar_color columns exist
    --   ✓ tenant_memberships table exists with anon policies
    --   ✓ auth_sessions.tenant_id column exists
    --   ✓ All anon RLS policies are in place
    -- ═══════════════════════════════════════════════════════════════════════════════

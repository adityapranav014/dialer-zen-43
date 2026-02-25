-- Fix handle_new_user trigger to work with Google OAuth
-- The old trigger crashed when no tenant existed (NOT NULL violation on tenant_id)
-- This migration: creates a default tenant if none exists, then safely handles the profile creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get or create a default tenant for OAuth users
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name) VALUES ('Default') RETURNING id INTO v_tenant_id;
  END IF;

  -- Insert profile, ignoring conflicts (Google re-auth may fire this twice)
  INSERT INTO public.profiles (user_id, display_name, tenant_id, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, v_tenant_id),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign role (default bda, unless specified in metadata)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'bda')
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

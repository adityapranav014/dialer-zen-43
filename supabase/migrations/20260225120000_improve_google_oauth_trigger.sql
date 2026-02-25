-- Improved handle_new_user trigger for Google OAuth + email/password signup
-- • Pulls avatar_url from Google user metadata
-- • Defaults role to 'bda' (admin is assigned client-side via upsert after login)
-- • Updates avatar_url on re-login so the photo stays fresh

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

  -- Display name: try Google full_name, then display_name, then email
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

  -- Upsert profile so re-login refreshes the photo
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

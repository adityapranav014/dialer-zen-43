-- Add customizable avatar fields to team_members
-- initials: up to 2 characters (e.g. "AP"), defaults to NULL (computed from name at app level)
-- avatar_color: a CSS-friendly color string (e.g. "violet", "blue", "emerald"), defaults to NULL (hash-computed at app level)

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS avatar_initials TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avatar_color    TEXT DEFAULT NULL;

-- Also add these to profiles so users can customize their own avatar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_initials TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avatar_color    TEXT DEFAULT NULL;

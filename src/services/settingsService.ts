/**
 * Settings Service
 *
 * Encapsulates all Supabase operations for the `user_settings` table.
 * Provides upsert semantics — a user's settings row is created on first access.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
type SettingsUpdate = Database["public"]["Tables"]["user_settings"]["Update"];

/** Default settings (mirrors DB column defaults) */
export const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  notif_new_lead: true,
  notif_missed_call: true,
  notif_conversion: true,
  notif_team_updates: false,
  notif_daily_summary: true,
  auto_dial_next: false,
  cooldown_timer: 30,
  show_post_call_modal: true,
  call_recording: true,
  default_lead_status: "new",
  auto_assign_leads: false,
  timezone: "Asia/Kolkata",
  language: "English",
};

/** Fetch settings for a user. If none exist, inserts defaults and returns them. */
export async function fetchSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  // First access — upsert default row
  const { data: created, error: insertErr } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();

  if (insertErr) throw insertErr;
  return created;
}

/** Patch (partial update) settings for a user */
export async function updateSettings(userId: string, patch: SettingsUpdate): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .update(patch)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

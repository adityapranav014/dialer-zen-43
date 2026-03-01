/**
 * Settings Service — Turso / Drizzle
 *
 * Fetches and persists per-user settings via the `user_settings` table.
 * Upsert semantics — a settings row is created on first access.
 */
import { db } from "@/integrations/turso/db";
import { user_settings } from "@/integrations/turso/schema";
import { eq } from "drizzle-orm";
import type { UserSettings } from "@/integrations/turso/types";

export type { UserSettings };

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
  const [existing] = await db
    .select()
    .from(user_settings)
    .where(eq(user_settings.user_id, userId))
    .limit(1);

  if (existing) return existing;

  // First access — create default row
  const [created] = await db
    .insert(user_settings)
    .values({ user_id: userId })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  // Race condition — another request inserted first, fetch again
  const [refetch] = await db
    .select()
    .from(user_settings)
    .where(eq(user_settings.user_id, userId))
    .limit(1);

  return refetch;
}

/** Patch (partial update) settings for a user */
export async function updateSettings(
  userId: string,
  patch: Partial<Omit<UserSettings, "id" | "user_id" | "created_at">>,
): Promise<UserSettings> {
  const [updated] = await db
    .update(user_settings)
    .set({ ...patch, updated_at: new Date().toISOString() })
    .where(eq(user_settings.user_id, userId))
    .returning();

  return updated;
}

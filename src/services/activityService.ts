/**
 * Activity Service
 *
 * Encapsulates all Supabase operations for the `activity_logs` table.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
type ActivityInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

/** Fetch recent activity logs for a tenant */
export async function fetchActivities(tenantId: string, limit = 15): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Fetch activity logs scoped to a specific user */
export async function fetchUserActivities(userId: string, limit = 10): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Insert a new activity log */
export async function createActivity(payload: ActivityInsert): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from("activity_logs")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

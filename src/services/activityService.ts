/**
 * Activity Service — Turso / Drizzle
 *
 * Encapsulates all database operations for the `activity_logs` table.
 */
import { db } from "@/integrations/turso/db";
import { activity_logs } from "@/integrations/turso/schema";
import { eq, desc } from "drizzle-orm";
import type { ActivityLog, NewActivityLog } from "@/integrations/turso/types";

export type { ActivityLog };

/** Fetch recent activity logs for a tenant */
export async function fetchActivities(tenantId: string, limit = 15): Promise<ActivityLog[]> {
  return db
    .select()
    .from(activity_logs)
    .where(eq(activity_logs.tenant_id, tenantId))
    .orderBy(desc(activity_logs.created_at))
    .limit(limit);
}

/** Fetch activity logs scoped to a specific user */
export async function fetchUserActivities(userId: string, limit = 10): Promise<ActivityLog[]> {
  return db
    .select()
    .from(activity_logs)
    .where(eq(activity_logs.user_id, userId))
    .orderBy(desc(activity_logs.created_at))
    .limit(limit);
}

/** Insert a new activity log */
export async function createActivity(payload: NewActivityLog): Promise<ActivityLog> {
  const [row] = await db.insert(activity_logs).values(payload).returning();
  return row;
}

/**
 * Notification Service — Turso / Drizzle
 *
 * Encapsulates all database operations for the `notifications` table.
 */
import { db } from "@/integrations/turso/db";
import { notifications } from "@/integrations/turso/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Notification, NewNotification } from "@/integrations/turso/types";

export type { Notification as DbNotification };

/** Fetch notifications for a user, most-recent-first */
export async function fetchNotifications(userId: string, limit = 30): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.user_id, userId))
    .orderBy(desc(notifications.created_at))
    .limit(limit);
}

/** Mark a single notification as read */
export async function markNotificationRead(id: string): Promise<void> {
  await db
    .update(notifications)
    .set({ is_read: true, read_at: new Date().toISOString() })
    .where(eq(notifications.id, id));
}

/** Mark all unread notifications as read for a user */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ is_read: true, read_at: new Date().toISOString() })
    .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)));
}

/** Delete a notification */
export async function deleteNotification(id: string): Promise<void> {
  await db.delete(notifications).where(eq(notifications.id, id));
}

/** Create a notification */
export async function createNotification(payload: NewNotification): Promise<Notification> {
  const [row] = await db.insert(notifications).values(payload).returning();
  return row;
}

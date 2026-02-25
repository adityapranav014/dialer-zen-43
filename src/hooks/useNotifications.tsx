import { useState, useCallback, useMemo } from "react";

// ─── Notification types (backend-ready) ───────────────────────────────
// These types mirror the expected DB schema for a `notifications` table.
// When integrating, replace mock data with Supabase queries.

export type NotificationType =
  | "lead_assigned"
  | "lead_status_change"
  | "call_reminder"
  | "achievement"
  | "system"
  | "team_update";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface Notification {
  /** UUID — primary key in the DB */
  id: string;
  /** FK to auth.users */
  user_id: string;
  /** Categorises the notification for icon/colour mapping */
  type: NotificationType;
  /** Short headline shown in the list */
  title: string;
  /** Longer description / body */
  message: string;
  /** Priority level — controls visual emphasis */
  priority: NotificationPriority;
  /** Has the user seen / read this notification? */
  is_read: boolean;
  /** Optional deep-link within the app (e.g. "/leads?id=xyz") */
  action_url: string | null;
  /** Optional metadata blob for frontend rendering (JSON column in DB) */
  metadata: Record<string, unknown> | null;
  /** ISO-8601 timestamp */
  created_at: string;
  /** ISO-8601 timestamp — null if not yet read */
  read_at: string | null;
}

// ─── Mock data (remove when Supabase table is wired up) ───────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    user_id: "current-user",
    type: "lead_assigned",
    title: "New Lead Assigned",
    message: "Rahul Sharma has been assigned to you. Call within 24 hours.",
    priority: "high",
    is_read: false,
    action_url: "/leads",
    metadata: { lead_id: "l1", lead_name: "Rahul Sharma" },
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
    read_at: null,
  },
  {
    id: "n2",
    user_id: "current-user",
    type: "achievement",
    title: "Milestone Reached!",
    message: "You've completed 50 calls this week. Keep it up!",
    priority: "normal",
    is_read: false,
    action_url: "/analytics",
    metadata: { milestone: "50_calls_week" },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    read_at: null,
  },
  {
    id: "n3",
    user_id: "current-user",
    type: "lead_status_change",
    title: "Lead Converted",
    message: "Priya Patel moved to 'Closed' status. Great work!",
    priority: "normal",
    is_read: false,
    action_url: "/leads",
    metadata: { lead_id: "l2", lead_name: "Priya Patel", new_status: "closed" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hrs ago
    read_at: null,
  },
  {
    id: "n4",
    user_id: "current-user",
    type: "call_reminder",
    title: "Follow-up Reminder",
    message: "Scheduled follow-up with Amit Verma in 30 minutes.",
    priority: "high",
    is_read: true,
    action_url: "/leads",
    metadata: { lead_id: "l3", lead_name: "Amit Verma" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hrs ago
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "n5",
    user_id: "current-user",
    type: "system",
    title: "System Update",
    message: "DialFlow v1.1 is rolling out tonight with performance improvements.",
    priority: "low",
    is_read: true,
    action_url: null,
    metadata: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "n6",
    user_id: "current-user",
    type: "team_update",
    title: "New Team Member",
    message: "Sneha Gupta has joined the BDA team. Say hello!",
    priority: "normal",
    is_read: true,
    action_url: null,
    metadata: { member_name: "Sneha Gupta" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
  },
];

// ─── Hook ─────────────────────────────────────────────────────────────
// TODO: Replace useState with useQuery + Supabase realtime subscription
//
// Example future implementation:
//   const { data } = useQuery({
//     queryKey: ["notifications", user.id],
//     queryFn: () => supabase
//       .from("notifications")
//       .select("*")
//       .eq("user_id", user.id)
//       .order("created_at", { ascending: false })
//       .limit(30),
//   });
//
//   // Realtime subscription for instant push
//   useEffect(() => {
//     const channel = supabase
//       .channel("notifications")
//       .on("postgres_changes", {
//         event: "INSERT",
//         schema: "public",
//         table: "notifications",
//         filter: `user_id=eq.${user.id}`,
//       }, (payload) => {
//         queryClient.invalidateQueries(["notifications"]);
//       })
//       .subscribe();
//     return () => { supabase.removeChannel(channel); };
//   }, [user.id]);

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const markAsRead = useCallback((id: string) => {
    // TODO: await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    // TODO: await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", currentUserId).eq("is_read", false);
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now })),
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    // TODO: await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

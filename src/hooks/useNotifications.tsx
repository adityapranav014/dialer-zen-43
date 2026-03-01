/**
 * useNotifications — Turso-backed notification hook
 *
 * Fetches notifications for the current user via the service layer.
 * Polls every 30 s for new notifications.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationService,
  type DbNotification,
} from "@/services/notificationService";

// Re-export the DB row type + branded aliases for consumers
export type Notification = DbNotification;

export type NotificationType =
  | "lead_assigned"
  | "lead_status_change"
  | "call_reminder"
  | "achievement"
  | "system"
  | "team_update";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

const QUERY_KEY = "notifications";

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ── Fetch ────────────────────────────────────────────────────────────
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchNotifications(user!.id),
    staleTime: 30_000,
    refetchInterval: 30_000, // poll every 30 s
  });

  // ── Derived state ────────────────────────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  // ── Mutations ────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] });
      const prev = queryClient.getQueryData<Notification[]>([QUERY_KEY, user?.id]);
      queryClient.setQueryData<Notification[]>([QUERY_KEY, user?.id], (old) =>
        (old ?? []).map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
        ),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([QUERY_KEY, user?.id], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] });
      const prev = queryClient.getQueryData<Notification[]>([QUERY_KEY, user?.id]);
      const now = new Date().toISOString();
      queryClient.setQueryData<Notification[]>([QUERY_KEY, user?.id], (old) =>
        (old ?? []).map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now })),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([QUERY_KEY, user?.id], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotificationService,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] });
      const prev = queryClient.getQueryData<Notification[]>([QUERY_KEY, user?.id]);
      queryClient.setQueryData<Notification[]>([QUERY_KEY, user?.id], (old) =>
        (old ?? []).filter((n) => n.id !== id),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([QUERY_KEY, user?.id], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] }),
  });

  // ── Stable wrappers ─────────────────────────────────────────────────
  const markAsRead = useCallback(
    (id: string) => markReadMutation.mutate(id),
    [markReadMutation],
  );

  const markAllAsRead = useCallback(
    () => markAllReadMutation.mutate(),
    [markAllReadMutation],
  );

  const deleteNotification = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation],
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

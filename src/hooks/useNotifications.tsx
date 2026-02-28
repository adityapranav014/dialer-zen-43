/**
 * useNotifications — Supabase-backed notification hook
 *
 * * Fetches notifications for the current user via the service layer
 * * Supports Supabase Realtime for instant push
 * * Falls back gracefully for demo-mode users
 */
import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  });

  // ── Realtime subscription ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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

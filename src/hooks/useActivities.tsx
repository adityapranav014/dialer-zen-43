/**
 * useActivities — Supabase-backed activity feed hook
 *
 * Provides tenant-scoped (admin) and user-scoped (BDA) activity feeds
 * via the activity_logs table.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { fetchActivities, fetchUserActivities, type ActivityLog } from "@/services/activityService";

export type { ActivityLog };

export const useActivities = (scope: "team" | "my" = "team") => {
  const { user, isAdmin } = useAuth();

  const effectiveScope = isAdmin ? "team" : "my";
  const resolvedScope = scope === "team" ? effectiveScope : scope;

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", resolvedScope, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (resolvedScope === "team") {
        const tenantId = user!.tenant_id;
        return fetchActivities(tenantId);
      }
      return fetchUserActivities(user!.id);
    },
    staleTime: 30_000,
  });

  return { activities, isLoading };
};

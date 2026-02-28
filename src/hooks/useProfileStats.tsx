/**
 * useProfileStats — Supabase-backed profile quick stats hook
 *
 * Fetches lifetime call stats for the currently logged-in user: total calls,
 * conversions, and hit rate — all from the `call_logs` table.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { fetchProfileStats, type ProfileStats } from "@/services/analyticsService";

export type { ProfileStats };

export const useProfileStats = () => {
  const { user, currentTenantId } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["profile-stats", user?.id, currentTenantId],
    enabled: !!user?.id,
    queryFn: () => fetchProfileStats(user!.id, currentTenantId ?? undefined),
    staleTime: 60_000,
  });

  return {
    stats: stats ?? { callsMade: 0, conversions: 0, hitRate: "0.0%" },
    isLoading,
  };
};

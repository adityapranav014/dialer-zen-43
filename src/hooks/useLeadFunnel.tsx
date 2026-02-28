/**
 * useLeadFunnel — Supabase-backed lead conversion funnel data
 *
 * Fetches lead status counts grouped by status from the leads table,
 * used by LeadConversionChart and admin dashboard.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { fetchLeadFunnel, type LeadFunnelItem } from "@/services/analyticsService";

export type { LeadFunnelItem };

export const useLeadFunnel = () => {
  const { user } = useAuth();

  const { data: funnel = [], isLoading } = useQuery({
    queryKey: ["lead-funnel", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const tenantId = user!.tenant_id;
      return fetchLeadFunnel(tenantId);
    },
    staleTime: 30_000,
  });

  return { funnel, isLoading };
};

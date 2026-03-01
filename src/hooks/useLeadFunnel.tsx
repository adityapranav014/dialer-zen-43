/**
 * useLeadFunnel — lead conversion funnel data (Turso / Drizzle)
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
    queryKey: ["lead-funnel", user?.tenant_id],
    enabled: !!user?.id && !!user?.tenant_id,
    queryFn: async () => {
      const tenantId = user!.tenant_id;
      if (!tenantId) return [];
      return fetchLeadFunnel(tenantId);
    },
    staleTime: 30_000,
  });

  return { funnel, isLoading };
};

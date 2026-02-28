/**
 * useAnalytics — Supabase-backed analytics hook
 *
 * Fetches all chart and summary data for the Analytics page.
 * Supports "Week", "Month", "Quarter" period filters.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  fetchSummaryStats,
  fetchWeeklyCallData,
  fetchHourlyCallData,
  fetchConversionBreakdown,
  type SummaryStats,
  type DailyCallData,
  type HourlyCallData,
  type ConversionBreakdown,
} from "@/services/analyticsService";

export type { SummaryStats, DailyCallData, HourlyCallData, ConversionBreakdown };

export const useAnalytics = (period: string = "Week") => {
  const { user, currentTenantId } = useAuth();

  const enabled = !!user?.id && !!currentTenantId;

  const { data: summaryStats, isLoading: loadingSummary } = useQuery({
    queryKey: ["analytics", "summary", period, currentTenantId],
    enabled,
    queryFn: () => fetchSummaryStats({ tenantId: currentTenantId! }),
    staleTime: 60_000,
  });

  const { data: weeklyData, isLoading: loadingWeekly } = useQuery({
    queryKey: ["analytics", "weekly", period, currentTenantId],
    enabled,
    queryFn: () => fetchWeeklyCallData(currentTenantId!),
    staleTime: 60_000,
  });

  const { data: hourlyData, isLoading: loadingHourly } = useQuery({
    queryKey: ["analytics", "hourly", period, currentTenantId],
    enabled,
    queryFn: () => fetchHourlyCallData(currentTenantId!),
    staleTime: 60_000,
  });

  const { data: conversionBreakdown, isLoading: loadingConversion } = useQuery({
    queryKey: ["analytics", "conversion-breakdown", period, currentTenantId],
    enabled,
    queryFn: () => fetchConversionBreakdown(currentTenantId!),
    staleTime: 60_000,
  });

  const loading = loadingSummary || loadingWeekly || loadingHourly || loadingConversion;

  return {
    summaryStats: summaryStats ?? { totalCalls: 0, avgDuration: "0:00", conversions: 0, hitRate: "0.0%" },
    weeklyData: weeklyData ?? [],
    hourlyData: hourlyData ?? [],
    conversionBreakdown: conversionBreakdown ?? [],
    loading,
  };
};

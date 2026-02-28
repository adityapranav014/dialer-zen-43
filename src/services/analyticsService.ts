/**
 * Analytics Service — Multi-tenant
 *
 * All queries are tenant-scoped via explicit tenant_id parameter.
 * bda_id has been renamed to user_id in the new schema.
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Lead funnel counts ───────────────────────────────────────────────
export interface LeadFunnelItem {
  stage: string;
  count: number;
  pct: string;
}

export async function fetchLeadFunnel(tenantId: string): Promise<LeadFunnelItem[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("status")
    .eq("tenant_id", tenantId);

  if (error) throw error;

  const statusOrder = ["new", "contacted", "interested", "closed"] as const;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }

  const total = data?.length || 1;
  return statusOrder.map((s) => ({
    stage: s.charAt(0).toUpperCase() + s.slice(1),
    count: counts[s] || 0,
    pct: `${Math.round(((counts[s] || 0) / total) * 100)}%`,
  }));
}

// ─── Summary stats (for Analytics page or Profile) ────────────────────
export interface SummaryStats {
  totalCalls: number;
  avgDuration: string; // "M:SS"
  conversions: number;
  hitRate: string;      // "X.X%"
}

export async function fetchSummaryStats(opts?: { userId?: string; tenantId?: string }): Promise<SummaryStats> {
  let query = supabase.from("call_logs").select("duration_seconds, outcome");
  if (opts?.tenantId) {
    query = query.eq("tenant_id", opts.tenantId);
  }
  if (opts?.userId) {
    query = query.eq("user_id", opts.userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const logs = data ?? [];
  const totalCalls = logs.length;
  const totalSeconds = logs.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
  const avgSec = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;
  const conversions = logs.filter(
    (r) => r.outcome === "Interested" || r.outcome === "Closed Won",
  ).length;
  const hitRate = totalCalls > 0 ? ((conversions / totalCalls) * 100).toFixed(1) : "0.0";

  const mins = Math.floor(avgSec / 60);
  const secs = avgSec % 60;

  return {
    totalCalls,
    avgDuration: `${mins}:${String(secs).padStart(2, "0")}`,
    conversions,
    hitRate: `${hitRate}%`,
  };
}

// ─── Weekly call data (last 7 days) ───────────────────────────────────
export interface DailyCallData {
  day: string;
  calls: number;
  conversions: number;
}

export async function fetchWeeklyCallData(tenantId: string): Promise<DailyCallData[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("call_logs")
    .select("created_at, outcome")
    .eq("tenant_id", tenantId)
    .gte("created_at", sevenDaysAgo.toISOString());

  if (error) throw error;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<string, { calls: number; conversions: number }> = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = dayNames[d.getDay()];
    buckets[key] = { calls: 0, conversions: 0 };
  }

  for (const row of data ?? []) {
    const d = new Date(row.created_at);
    const key = dayNames[d.getDay()];
    if (buckets[key]) {
      buckets[key].calls += 1;
      if (row.outcome === "Interested" || row.outcome === "Closed Won") {
        buckets[key].conversions += 1;
      }
    }
  }

  const result: DailyCallData[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = dayNames[d.getDay()];
    result.push({ day: key, ...buckets[key] });
  }
  return result;
}

// ─── Hourly distribution (today) ─────────────────────────────────────
export interface HourlyCallData {
  hour: string;
  calls: number;
}

export async function fetchHourlyCallData(tenantId: string): Promise<HourlyCallData[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("call_logs")
    .select("created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", today.toISOString());

  if (error) throw error;

  const hourLabels = [
    "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm",
  ];
  const hourStart = 9;
  const buckets: Record<string, number> = {};
  hourLabels.forEach((h) => (buckets[h] = 0));

  for (const row of data ?? []) {
    const h = new Date(row.created_at).getHours();
    const idx = h - hourStart;
    if (idx >= 0 && idx < hourLabels.length) {
      buckets[hourLabels[idx]] += 1;
    }
  }

  return hourLabels.map((hour) => ({ hour, calls: buckets[hour] }));
}

// ─── Conversion breakdown (derived %) ─────────────────────────────────
export interface ConversionBreakdown {
  label: string;
  value: number;
  text: string;
}

export async function fetchConversionBreakdown(tenantId: string): Promise<ConversionBreakdown[]> {
  const { data, error } = await supabase
    .from("call_logs")
    .select("outcome")
    .eq("tenant_id", tenantId);

  if (error) throw error;

  const logs = data ?? [];
  const total = logs.length || 1;

  const conversions = logs.filter(
    (r) => r.outcome === "Interested" || r.outcome === "Closed Won",
  ).length;
  const followUpSuccess = logs.filter((r) => r.outcome === "Follow Up").length;
  const noAnswer = logs.filter(
    (r) => r.outcome === "No Answer" || r.outcome === "Voicemail",
  ).length;

  const hitRate = +((conversions / total) * 100).toFixed(1);
  const followUpPct = +((followUpSuccess / total) * 100).toFixed(0);
  const coldCallRate = +((logs.filter((r) => r.outcome === "Not Interested").length / total) * 100).toFixed(0);
  const vmRate = +((noAnswer / total) * 100).toFixed(0);

  return [
    { label: "Overall Hit Rate", value: hitRate, text: `${hitRate}%` },
    { label: "Follow-up Success", value: followUpPct, text: `${followUpPct}%` },
    { label: "Cold Call Rate", value: coldCallRate, text: `${coldCallRate}%` },
    { label: "Voicemail Rate", value: vmRate, text: `${vmRate}%` },
  ];
}

// ─── Profile quick stats (per-user) ──────────────────────────────────
export interface ProfileStats {
  callsMade: number;
  conversions: number;
  hitRate: string;
}

export async function fetchProfileStats(userId: string, tenantId?: string): Promise<ProfileStats> {
  let query = supabase
    .from("call_logs")
    .select("outcome")
    .eq("user_id", userId);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const logs = data ?? [];
  const callsMade = logs.length;
  const conversions = logs.filter(
    (r) => r.outcome === "Interested" || r.outcome === "Closed Won",
  ).length;
  const hitRate = callsMade > 0 ? ((conversions / callsMade) * 100).toFixed(1) : "0.0";

  return {
    callsMade,
    conversions,
    hitRate: `${hitRate}%`,
  };
}

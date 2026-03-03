/**
 * Analytics Service — Turso / Drizzle
 *
 * All queries are tenant-scoped via explicit tenant_id parameter.
 */
import { db } from "@/integrations/turso/db";
import { leads, call_logs } from "@/integrations/turso/schema";
import { eq, and, gte } from "drizzle-orm";

/** Returns the start date for a given period filter */
function periodStart(period: string): Date {
  const d = new Date();
  if (period === "Quarter") d.setDate(d.getDate() - 89);
  else if (period === "Month") d.setDate(d.getDate() - 29);
  else d.setDate(d.getDate() - 6); // Week (default)
  d.setHours(0, 0, 0, 0);
  return d;
}

//  Lead funnel counts 
export interface LeadFunnelItem {
  stage: string;
  count: number;
  pct: string;
}

export async function fetchLeadFunnel(tenantId: string, statusOrder?: string[]): Promise<LeadFunnelItem[]> {
  const rows = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.tenant_id, tenantId));

  const order = statusOrder ?? ["new", "contacted", "interested", "closed"];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }
  const total = rows.length || 1;
  return order.map((s) => ({
    stage: s.charAt(0).toUpperCase() + s.slice(1),
    count: counts[s] || 0,
    pct: `${Math.round(((counts[s] || 0) / total) * 100)}%`,
  }));
}

//  Summary stats 
export interface SummaryStats {
  totalCalls: number;
  avgDuration: string;
  conversions: number;
  hitRate: string;
}

export async function fetchSummaryStats(opts?: { userId?: string; tenantId?: string; period?: string }): Promise<SummaryStats> {
  const conditions = [];
  if (opts?.tenantId) conditions.push(eq(call_logs.tenant_id, opts.tenantId));
  if (opts?.userId) conditions.push(eq(call_logs.user_id, opts.userId));
  if (opts?.period) conditions.push(gte(call_logs.created_at, periodStart(opts.period).toISOString()));

  const rows = conditions.length
    ? await db.select({ duration_seconds: call_logs.duration_seconds, outcome: call_logs.outcome }).from(call_logs).where(and(...conditions))
    : await db.select({ duration_seconds: call_logs.duration_seconds, outcome: call_logs.outcome }).from(call_logs);

  const totalCalls = rows.length;
  const totalSeconds = rows.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
  const avgSec = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;
  const conversions = rows.filter((r) => r.outcome === "Interested" || r.outcome === "Closed Won").length;
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

//  Weekly call data (last 7 days) 
export interface DailyCallData {
  day: string;
  calls: number;
  conversions: number;
}

export async function fetchWeeklyCallData(tenantId: string, period: string = "Week"): Promise<DailyCallData[]> {
  const since = periodStart(period);

  const rows = await db
    .select({ created_at: call_logs.created_at, outcome: call_logs.outcome })
    .from(call_logs)
    .where(and(eq(call_logs.tenant_id, tenantId), gte(call_logs.created_at, since.toISOString())));

  if (period === "Week") {
    // Last 7 days — one bucket per day
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets: Record<string, { calls: number; conversions: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets[dayNames[d.getDay()]] = { calls: 0, conversions: 0 };
    }
    for (const row of rows) {
      const key = dayNames[new Date(row.created_at).getDay()];
      if (buckets[key]) {
        buckets[key].calls++;
        if (row.outcome === "Interested" || row.outcome === "Closed Won") buckets[key].conversions++;
      }
    }
    const result: DailyCallData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = dayNames[d.getDay()];
      result.push({ day: key, ...buckets[key] });
    }
    return result;
  } else {
    // Month (30 days → 4 weeks) or Quarter (90 days → 13 weeks) — bucket by week
    const numWeeks = period === "Quarter" ? 13 : 4;
    const weekBuckets: { calls: number; conversions: number }[] = Array.from(
      { length: numWeeks },
      () => ({ calls: 0, conversions: 0 })
    );
    for (const row of rows) {
      const diffDays = Math.floor(
        (new Date(row.created_at).getTime() - since.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weekIdx = Math.min(Math.floor(diffDays / 7), numWeeks - 1);
      weekBuckets[weekIdx].calls++;
      if (row.outcome === "Interested" || row.outcome === "Closed Won") weekBuckets[weekIdx].conversions++;
    }
    return weekBuckets.map((b, i) => ({ day: `Wk ${i + 1}`, ...b }));
  }
}

//  Hourly distribution (today) 
export interface HourlyCallData {
  hour: string;
  calls: number;
}

export async function fetchHourlyCallData(tenantId: string, period: string = "Week"): Promise<HourlyCallData[]> {
  // Week → today only; Month/Quarter → full period for aggregate distribution
  const since = period === "Week" ? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })() : periodStart(period);

  const rows = await db
    .select({ created_at: call_logs.created_at })
    .from(call_logs)
    .where(and(eq(call_logs.tenant_id, tenantId), gte(call_logs.created_at, since.toISOString())));

  const hourLabels = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm"];
  const hourStart = 9;
  const buckets: Record<string, number> = {};
  hourLabels.forEach((h) => (buckets[h] = 0));

  for (const row of rows) {
    const idx = new Date(row.created_at).getHours() - hourStart;
    if (idx >= 0 && idx < hourLabels.length) buckets[hourLabels[idx]]++;
  }

  return hourLabels.map((hour) => ({ hour, calls: buckets[hour] }));
}

//  Conversion breakdown 
export interface ConversionBreakdown {
  label: string;
  value: number;
  text: string;
}

export async function fetchConversionBreakdown(tenantId: string, period: string = "Week"): Promise<ConversionBreakdown[]> {
  const rows = await db
    .select({ outcome: call_logs.outcome })
    .from(call_logs)
    .where(and(eq(call_logs.tenant_id, tenantId), gte(call_logs.created_at, periodStart(period).toISOString())));

  const total = rows.length || 1;
  const conversions = rows.filter((r) => r.outcome === "Interested" || r.outcome === "Closed Won").length;
  const followUpSuccess = rows.filter((r) => r.outcome === "Follow Up").length;
  const noAnswer = rows.filter((r) => r.outcome === "No Answer" || r.outcome === "Voicemail").length;
  const notInterested = rows.filter((r) => r.outcome === "Not Interested").length;

  const hitRate = +((conversions / total) * 100).toFixed(1);
  const followUpPct = +((followUpSuccess / total) * 100).toFixed(0);
  const coldCallRate = +((notInterested / total) * 100).toFixed(0);
  const vmRate = +((noAnswer / total) * 100).toFixed(0);

  return [
    { label: "Overall Hit Rate", value: hitRate, text: `${hitRate}%` },
    { label: "Follow-up Success", value: followUpPct, text: `${followUpPct}%` },
    { label: "Cold Call Rate", value: coldCallRate, text: `${coldCallRate}%` },
    { label: "Voicemail Rate", value: vmRate, text: `${vmRate}%` },
  ];
}

//  Profile quick stats (per-user) 
export interface ProfileStats {
  callsMade: number;
  conversions: number;
  hitRate: string;
}

export async function fetchProfileStats(userId: string, tenantId?: string): Promise<ProfileStats> {
  const conditions = [eq(call_logs.user_id, userId)];
  if (tenantId) conditions.push(eq(call_logs.tenant_id, tenantId));

  const rows = await db
    .select({ outcome: call_logs.outcome })
    .from(call_logs)
    .where(and(...conditions));

  const callsMade = rows.length;
  const conversions = rows.filter((r) => r.outcome === "Interested" || r.outcome === "Closed Won").length;
  const hitRate = callsMade > 0 ? ((conversions / callsMade) * 100).toFixed(1) : "0.0";

  return { callsMade, conversions, hitRate: `${hitRate}%` };
}

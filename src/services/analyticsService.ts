/**
 * Analytics Service — Turso / Drizzle
 *
 * All queries are tenant-scoped via explicit tenant_id parameter.
 */
import { db } from "@/integrations/turso/db";
import { leads, call_logs } from "@/integrations/turso/schema";
import { eq, and, gte } from "drizzle-orm";

//  Lead funnel counts 
export interface LeadFunnelItem {
  stage: string;
  count: number;
  pct: string;
}

export async function fetchLeadFunnel(tenantId: string): Promise<LeadFunnelItem[]> {
  const rows = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.tenant_id, tenantId));

  const statusOrder = ["new", "contacted", "interested", "closed"] as const;
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }
  const total = rows.length || 1;
  return statusOrder.map((s) => ({
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

export async function fetchSummaryStats(opts?: { userId?: string; tenantId?: string }): Promise<SummaryStats> {
  const conditions = [];
  if (opts?.tenantId) conditions.push(eq(call_logs.tenant_id, opts.tenantId));
  if (opts?.userId) conditions.push(eq(call_logs.user_id, opts.userId));

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

export async function fetchWeeklyCallData(tenantId: string): Promise<DailyCallData[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ created_at: call_logs.created_at, outcome: call_logs.outcome })
    .from(call_logs)
    .where(and(eq(call_logs.tenant_id, tenantId), gte(call_logs.created_at, sevenDaysAgo.toISOString())));

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<string, { calls: number; conversions: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
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
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = dayNames[d.getDay()];
    result.push({ day: key, ...buckets[key] });
  }
  return result;
}

//  Hourly distribution (today) 
export interface HourlyCallData {
  hour: string;
  calls: number;
}

export async function fetchHourlyCallData(tenantId: string): Promise<HourlyCallData[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ created_at: call_logs.created_at })
    .from(call_logs)
    .where(and(eq(call_logs.tenant_id, tenantId), gte(call_logs.created_at, today.toISOString())));

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

export async function fetchConversionBreakdown(tenantId: string): Promise<ConversionBreakdown[]> {
  const rows = await db
    .select({ outcome: call_logs.outcome })
    .from(call_logs)
    .where(eq(call_logs.tenant_id, tenantId));

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

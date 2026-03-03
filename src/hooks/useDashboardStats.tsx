import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/turso/db";
import { call_logs, tenant_memberships, app_users, leads } from "@/integrations/turso/schema";
import { eq, and, gte, inArray, desc } from "drizzle-orm";
import { useAuth } from "./useAuth";

export const useDashboardStats = (period?: string) => {
    const { user, isAdmin, currentTenantId } = useAuth();

    // 1. Call Stats for Today
    const { data: callStats, isLoading: loadingCalls } = useQuery({
        queryKey: ["stats", "calls", isAdmin ? "team" : "my", user?.id, currentTenantId],
        enabled: !!user?.id && !!currentTenantId,
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const conditions = [
                eq(call_logs.tenant_id, currentTenantId!),
                gte(call_logs.created_at, today.toISOString()),
            ];
            if (!isAdmin) conditions.push(eq(call_logs.user_id, user!.id));

            const data = await db
                .select({ duration_seconds: call_logs.duration_seconds, outcome: call_logs.outcome, user_id: call_logs.user_id })
                .from(call_logs)
                .where(and(...conditions));

            const totalCalls = data.length;
            const totalSeconds = data.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
            const conversions = data.filter((c) => c.outcome === "Interested" || c.outcome === "Closed Won").length;

            return { totalCalls, totalMinutes: Math.round(totalSeconds / 60), conversions };
        }
    });

    // 2. Leaderboard
    const { data: bdaStats = [], isLoading: loadingBdas } = useQuery({
        queryKey: ["stats", "leaderboard", period ?? "all", currentTenantId],
        enabled: !!user?.id && !!currentTenantId,
        queryFn: async () => {
            const memberships = await db
                .select({ user_id: tenant_memberships.user_id })
                .from(tenant_memberships)
                .where(and(eq(tenant_memberships.tenant_id, currentTenantId!), eq(tenant_memberships.is_active, true)));

            if (!memberships.length) return [];

            const userIds = memberships.map((m) => m.user_id);

            // Compute date filter based on period
            const logsConditions: ReturnType<typeof eq>[] = [
                eq(call_logs.tenant_id, currentTenantId!),
                inArray(call_logs.user_id, userIds) as any,
            ];
            if (period) {
                const days = period === "Quarter" ? 90 : period === "Month" ? 30 : 7;
                const since = new Date();
                since.setDate(since.getDate() - (days - 1));
                since.setHours(0, 0, 0, 0);
                logsConditions.push(gte(call_logs.created_at, since.toISOString()) as any);
            }

            const [users, logs] = await Promise.all([
                db.select({ id: app_users.id, display_name: app_users.display_name })
                    .from(app_users)
                    .where(inArray(app_users.id, userIds)),
                db.select({ user_id: call_logs.user_id, outcome: call_logs.outcome, duration_seconds: call_logs.duration_seconds })
                    .from(call_logs)
                    .where(and(...logsConditions)),
            ]);

            const userMap = Object.fromEntries(users.map((u) => [u.id, u.display_name]));

            return memberships.map((m) => {
                const name = userMap[m.user_id] || "Unknown";
                const userLogs = logs.filter((l) => l.user_id === m.user_id);
                return {
                    id: m.user_id,
                    name,
                    initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
                    calls: userLogs.length,
                    conversions: userLogs.filter((l) => l.outcome === "Interested" || l.outcome === "Closed Won").length,
                    talkTimeMins: Math.round(userLogs.reduce((sum, l) => sum + (l.duration_seconds || 0), 0) / 60),
                    status: "active" as const,
                };
            }).sort((a, b) => b.conversions - a.conversions || b.calls - a.calls);
        }
    });

    // 3. Activity Feed — recent call logs
    const { data: activities = [], isLoading: loadingActivities } = useQuery({
        queryKey: ["stats", "activities", isAdmin ? "team" : "my", currentTenantId],
        enabled: !!user?.id && !!currentTenantId,
        queryFn: async () => {
            const conditions = [eq(call_logs.tenant_id, currentTenantId!)];
            if (!isAdmin) conditions.push(eq(call_logs.user_id, user!.id));

            const rows = await db
                .select({
                    id: call_logs.id,
                    created_at: call_logs.created_at,
                    outcome: call_logs.outcome,
                    notes: call_logs.notes,
                    lead_id: call_logs.lead_id,
                    user_id: call_logs.user_id,
                })
                .from(call_logs)
                .where(and(...conditions))
                .orderBy(desc(call_logs.created_at))
                .limit(10);

            if (!rows.length) return [];

            const leadIds = [...new Set(rows.map((r) => r.lead_id))];
            const userIds = [...new Set(rows.map((r) => r.user_id))];

            const [leadRows, userRows] = await Promise.all([
                db.select({ id: leads.id, name: leads.name }).from(leads).where(inArray(leads.id, leadIds)),
                db.select({ id: app_users.id, display_name: app_users.display_name }).from(app_users).where(inArray(app_users.id, userIds)),
            ]);

            const leadMap = Object.fromEntries(leadRows.map((l) => [l.id, l.name]));
            const userMap = Object.fromEntries(userRows.map((u) => [u.id, u.display_name]));

            return rows.map((a) => ({
                id: a.id,
                text: `${userMap[a.user_id] || "Someone"} called ${leadMap[a.lead_id] || "a lead"} — Outcome: ${a.outcome || "N/A"}`,
                time: a.created_at,
                dot: a.outcome === "Closed Won" ? "bg-success" : a.outcome === "Interested" ? "bg-warning" : "bg-primary",
            }));
        }
    });

    return {
        stats: callStats || { totalCalls: 0, totalMinutes: 0, conversions: 0 },
        leaderboard: bdaStats,
        activities,
        loading: loadingCalls || loadingBdas || loadingActivities
    };
};

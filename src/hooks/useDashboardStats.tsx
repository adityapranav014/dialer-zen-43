import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useDashboardStats = () => {
    const { user, isAdmin, currentTenantId } = useAuth();

    // 1. Team/My Call Stats for Today
    const { data: callStats, isLoading: loadingCalls } = useQuery({
        queryKey: ["stats", "calls", isAdmin ? "team" : "my", user?.id, currentTenantId],
        enabled: !!user?.id && !!currentTenantId,
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let query = supabase
                .from("call_logs")
                .select("duration_seconds, outcome, user_id")
                .eq("tenant_id", currentTenantId!)
                .gte("created_at", today.toISOString());

            if (!isAdmin) {
                query = query.eq("user_id", user!.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const totalCalls = data?.length || 0;
            const totalSeconds = data?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0;
            const conversions = data?.filter(c => c.outcome === "Interested" || c.outcome === "Closed Won").length || 0;

            return {
                totalCalls,
                totalMinutes: Math.round(totalSeconds / 60),
                conversions,
            };
        }
    });

    // 2. Leaderboard — tenant scoped via tenant_memberships
    const { data: bdaStats = [], isLoading: loadingBdas } = useQuery({
        queryKey: ["stats", "leaderboard", currentTenantId],
        enabled: !!user?.id && !!currentTenantId,
        queryFn: async () => {
            // Get members of this tenant
            const { data: memberships, error: mError } = await supabase
                .from("tenant_memberships")
                .select("user_id, app_users ( id, display_name )")
                .eq("tenant_id", currentTenantId!)
                .eq("is_active", true);

            if (mError) throw mError;
            if (!memberships || memberships.length === 0) return [];

            const userIds = memberships.map(m => m.user_id);

            const { data: logs, error: lError } = await supabase
                .from("call_logs")
                .select("user_id, outcome, duration_seconds")
                .eq("tenant_id", currentTenantId!)
                .in("user_id", userIds);

            if (lError) throw lError;

            return memberships.map(m => {
                const u = m.app_users as any;
                const name = u?.display_name || "Unknown";
                const userLogs = (logs || []).filter(l => l.user_id === m.user_id);
                return {
                    id: m.user_id,
                    name,
                    initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
                    calls: userLogs.length,
                    conversions: userLogs.filter(l => l.outcome === "Interested" || l.outcome === "Closed Won").length,
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
            let query = supabase
                .from("call_logs")
                .select(`
                    id,
                    created_at,
                    outcome,
                    notes,
                    lead_id,
                    leads ( name ),
                    app_users!call_logs_user_id_fkey ( display_name )
                `)
                .eq("tenant_id", currentTenantId!)
                .order("created_at", { ascending: false })
                .limit(10);

            if (!isAdmin) {
                query = query.eq("user_id", user!.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data ?? []).map((a: any) => ({
                id: a.id,
                text: `${a.app_users?.display_name || "Someone"} called ${a.leads?.name || "a lead"} — Outcome: ${a.outcome || "N/A"}`,
                time: a.created_at,
                dot: a.outcome === "Closed Won" ? "bg-success" : a.outcome === "Interested" ? "bg-warning" : "bg-primary"
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

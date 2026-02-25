import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const MOCK_STATS = {
    totalCalls: 1458,
    totalMinutes: 5240,
    conversions: 284,
};

const MOCK_ACTIVITIES = [
    { id: "a1", text: "Sarah Chen called Rishabh Malhotra — Outcome: Interested", time: new Date(Date.now() - 300000).toISOString(), dot: "bg-warning" },
    { id: "a2", text: "Michael Ross called Ananya Sharma — Outcome: Closed Won", time: new Date(Date.now() - 900000).toISOString(), dot: "bg-success" },
    { id: "a3", text: "Emma Wilson called Vikram Sethi — Outcome: No Answer", time: new Date(Date.now() - 1500000).toISOString(), dot: "bg-primary" },
    { id: "a4", text: "David Park called Priya Das — Outcome: Busy", time: new Date(Date.now() - 2400000).toISOString(), dot: "bg-primary" },
    { id: "a5", text: "Aditya Admin assigned Lead: Kunal Kapoor to Jessica Pearson", time: new Date(Date.now() - 3600000).toISOString(), dot: "bg-accent" },
    { id: "a6", text: "Harvey Specter called Sneha Reddy — Outcome: Interested", time: new Date(Date.now() - 5400000).toISOString(), dot: "bg-warning" },
    { id: "a7", text: "Rachel Zane called Arjun Mehra — Outcome: Closed Won", time: new Date(Date.now() - 7200000).toISOString(), dot: "bg-success" },
    { id: "a8", text: "Louis Litt called Deepak Verma — Outcome: No Answer", time: new Date(Date.now() - 10800000).toISOString(), dot: "bg-primary" },
    { id: "a9", text: "Donna Paulsen called Isha Gupta — Outcome: Interested", time: new Date(Date.now() - 14400000).toISOString(), dot: "bg-warning" },
    { id: "a10", text: "Sarah Chen called Rohan Das — Outcome: Busy", time: new Date(Date.now() - 18000000).toISOString(), dot: "bg-primary" },
    { id: "a11", text: "Michael Ross called Sanya Malhotra — Outcome: Closed Won", time: new Date(Date.now() - 21600000).toISOString(), dot: "bg-success" },
];

export const useDashboardStats = () => {
    const { user, isAdmin } = useAuth();
    const isMockUser = user?.id === "admin-id" || user?.id?.startsWith("bda-");

    // 1. Team/My Call Stats for Today
    const { data: callStats, isLoading: loadingCalls } = useQuery({
        queryKey: ["stats", "calls", isAdmin ? "team" : "my", user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            if (isMockUser) {
                return isAdmin ? MOCK_STATS : { totalCalls: 12, totalMinutes: 45, conversions: 2 };
            }

            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let query = supabase
                    .from("call_logs")
                    .select("duration_seconds, outcome, bda_id")
                    .gte("created_at", today.toISOString());

                if (!isAdmin) {
                    query = query.eq("bda_id", user?.id);
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
                    raw: data || []
                };
            } catch (error) {
                console.error("Dashboard stats error:", error);
                return isAdmin ? MOCK_STATS : { totalCalls: 0, totalMinutes: 0, conversions: 0 };
            }
        }
    });

    // 2. Leaderboard (for All if Admin, or just for context)
    const { data: bdaStats = [], isLoading: loadingBdas } = useQuery({
        queryKey: ["stats", "leaderboard"],
        queryFn: async () => {
            if (isMockUser) {
                return [
                    { id: "bda-1", name: "Sarah Chen", initials: "SC", calls: 45, conversions: 8, talkTimeMins: 120, status: "active" as const },
                    { id: "bda-2", name: "Michael Ross", initials: "MR", calls: 38, conversions: 5, talkTimeMins: 95, status: "active" as const },
                    { id: "bda-3", name: "Emma Wilson", initials: "EW", calls: 32, conversions: 4, talkTimeMins: 80, status: "idle" as const },
                    { id: "bda-4", name: "David Park", initials: "DP", calls: 28, conversions: 3, talkTimeMins: 70, status: "offline" as const },
                ];
            }

            try {
                const { data: profiles, error: pError } = await supabase
                    .from("profiles")
                    .select("user_id, display_name");

                if (pError) throw pError;

                const { data: logs, error: lError } = await supabase
                    .from("call_logs")
                    .select("bda_id, outcome, duration_seconds");

                if (lError) throw lError;

                return profiles.map(p => {
                    const bdaLogs = logs.filter(l => l.bda_id === p.user_id);
                    return {
                        id: p.user_id,
                        name: p.display_name || "Unknown",
                        initials: (p.display_name || "U").split(" ").map(n => n[0]).join("").toUpperCase(),
                        calls: bdaLogs.length,
                        conversions: bdaLogs.filter(l => l.outcome === "Interested" || l.outcome === "Closed Won").length,
                        talkTimeMins: Math.round(bdaLogs.reduce((sum, l) => sum + (l.duration_seconds || 0), 0) / 60),
                        status: "active" as const // Placeholder
                    };
                }).sort((a, b) => b.conversions - a.conversions || b.calls - a.calls);
            } catch (error) {
                console.error("Leaderboard error:", error);
                return [];
            }
        }
    });

    // 3. Activity Feed
    const { data: activities = [], isLoading: loadingActivities } = useQuery({
        queryKey: ["stats", "activities", isAdmin ? "team" : "my"],
        queryFn: async () => {
            if (isMockUser) return MOCK_ACTIVITIES;

            try {
                let query = supabase
                    .from("call_logs")
                    .select(`
                        id,
                        created_at,
                        outcome,
                        notes,
                        lead_id,
                        leads ( name ),
                        profiles ( display_name )
                    `)
                    .order("created_at", { ascending: false })
                    .limit(10);

                if (!isAdmin) {
                    query = query.eq("bda_id", user?.id);
                }

                const { data, error } = await query;
                if (error) throw error;

                if (!data || data.length === 0) return MOCK_ACTIVITIES;

                return data.map((a: any) => ({
                    id: a.id,
                    text: `${a.profiles?.display_name || "Someone"} called ${a.leads?.name || "a lead"} — Outcome: ${a.outcome}`,
                    time: a.created_at,
                    dot: a.outcome === "Closed Won" ? "bg-success" : a.outcome === "Interested" ? "bg-warning" : "bg-primary"
                }));
            } catch (error) {
                console.error("Activity feed error:", error);
                return MOCK_ACTIVITIES;
            }
        }
    });

    return {
        stats: callStats || { totalCalls: 0, totalMinutes: 0, conversions: 0 },
        leaderboard: bdaStats,
        activities,
        loading: loadingCalls || loadingBdas || loadingActivities
    };
};

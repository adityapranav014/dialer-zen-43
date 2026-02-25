import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BDAStatus = "active" | "idle" | "offline";

/** Well-known UUID for the demo workspace tenant (see migration). */
const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export interface TeamMember {
    id: string;
    profileId: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    status: BDAStatus;
    joinedAt: string;
    totalLeads: number;
    activeLeads: number;
    closedLeads: number;
    conversionRate: number;
    totalCalls: number;
    talkTimeMinutes: number;
    lastActiveAt: string | null;
}

export interface TeamStats {
    totalMembers: number;
    activeMembers: number;
    idleMembers: number;
    offlineMembers: number;
    avgConversionRate: number;
    totalLeadsAssigned: number;
    totalCallsToday: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTeam = () => {
    const queryClient = useQueryClient();
    const { user, isDemo } = useAuth();

    // Resolve tenant_id — demo mode uses the well-known demo tenant,
    // real users look up their tenant from the profiles table.
    const getTenantId = async (): Promise<string> => {
        if (isDemo) return DEMO_TENANT_ID;

        if (!user) throw new Error("Not authenticated");
        const { data } = await supabase
            .from("profiles")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();
        if (!data?.tenant_id) throw new Error("No tenant found for current user");
        return data.tenant_id;
    };

    // Fetch team members — always from Supabase
    const { data: members = [], isLoading: loading } = useQuery({
        queryKey: ["team", "members", user?.id, isDemo],
        queryFn: async () => {
            if (!user) return [];

            try {
                const tenantId = await getTenantId();

                const { data: teamRows, error } = await supabase
                    .from("team_members")
                    .select("*")
                    .eq("tenant_id", tenantId)
                    .order("created_at", { ascending: true });

                if (error) {
                    console.error("Error fetching team_members:", error);
                    return [];
                }
                if (!teamRows || teamRows.length === 0) return [];

                const linkedIds = teamRows
                    .map(r => r.linked_user_id)
                    .filter((id): id is string => !!id);

                let leadsMap: Record<string, { total: number; active: number; closed: number }> = {};
                let callsMap: Record<string, { total: number; talkMins: number; lastAt: string | null }> = {};

                if (linkedIds.length > 0) {
                    const { data: leads } = await supabase
                        .from("leads")
                        .select("assigned_to, status")
                        .in("assigned_to", linkedIds);

                    const { data: calls } = await supabase
                        .from("call_logs")
                        .select("bda_id, duration_seconds, created_at")
                        .in("bda_id", linkedIds);

                    for (const uid of linkedIds) {
                        const bdaLeads = (leads || []).filter(l => l.assigned_to === uid);
                        const closed = bdaLeads.filter(l => l.status === "closed").length;
                        leadsMap[uid] = {
                            total: bdaLeads.length,
                            active: bdaLeads.filter(l => l.status !== "closed").length,
                            closed,
                        };

                        const bdaCalls = (calls || []).filter(c => c.bda_id === uid);
                        const sorted = [...bdaCalls].sort(
                            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                        callsMap[uid] = {
                            total: bdaCalls.length,
                            talkMins: Math.round(bdaCalls.reduce((s, c) => s + (c.duration_seconds || 0), 0) / 60),
                            lastAt: sorted[0]?.created_at || null,
                        };
                    }
                }

                return teamRows.map(row => {
                    const uid = row.linked_user_id;
                    const ls = uid ? leadsMap[uid] : undefined;
                    const cs = uid ? callsMap[uid] : undefined;
                    const totalLeads = ls?.total ?? 0;
                    const closedLeads = ls?.closed ?? 0;

                    let status: BDAStatus = "offline";
                    if (row.status === "active") status = "active";
                    else if (row.status === "idle") status = "idle";

                    return {
                        id: row.id,
                        profileId: row.id,
                        name: row.name,
                        email: row.email,
                        phone: row.phone || "",
                        avatarUrl: null,
                        status,
                        joinedAt: row.created_at,
                        totalLeads,
                        activeLeads: ls?.active ?? 0,
                        closedLeads,
                        conversionRate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 1000) / 10 : 0,
                        totalCalls: cs?.total ?? 0,
                        talkTimeMinutes: cs?.talkMins ?? 0,
                        lastActiveAt: cs?.lastAt ?? null,
                    } as TeamMember;
                });
            } catch (error) {
                console.error("useTeam fetch error:", error);
                return [];
            }
        },
        enabled: !!user,
    });

    // Computed stats
    const stats: TeamStats = {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === "active").length,
        idleMembers: members.filter(m => m.status === "idle").length,
        offlineMembers: members.filter(m => m.status === "offline").length,
        avgConversionRate: members.length > 0
            ? Math.round(members.reduce((s, m) => s + m.conversionRate, 0) / members.length * 10) / 10
            : 0,
        totalLeadsAssigned: members.reduce((s, m) => s + m.totalLeads, 0),
        totalCallsToday: members.reduce((s, m) => s + m.totalCalls, 0),
    };

    // ── Add a BDA member ───────────────────────────────────────────────
    const addMemberMutation = useMutation({
        mutationFn: async (member: { name: string; email: string; phone?: string }) => {
            const tenantId = await getTenantId();

            const { data, error } = await supabase
                .from("team_members")
                .insert({
                    tenant_id: tenantId,
                    name: member.name.trim(),
                    email: member.email.trim(),
                    phone: member.phone?.trim() || "",
                    status: "offline",
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    // ── Add members in bulk ────────────────────────────────────────────
    const addMembersBulkMutation = useMutation({
        mutationFn: async (membersList: { name: string; email: string; phone?: string }[]) => {
            const tenantId = await getTenantId();

            const rows = membersList.map(m => ({
                tenant_id: tenantId,
                name: m.name.trim(),
                email: m.email.trim(),
                phone: m.phone?.trim() || "",
                status: "offline",
            }));

            // Use upsert to skip duplicates (same email within the tenant)
            const { data, error } = await supabase
                .from("team_members")
                .upsert(rows, { onConflict: "tenant_id,email", ignoreDuplicates: true })
                .select();

            if (error) {
                console.error("Bulk import error:", error);
                throw new Error(error.message || "Database insert failed");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    // ── Update member ──────────────────────────────────────────────────
    const updateMemberMutation = useMutation({
        mutationFn: async ({ memberId, updates }: { memberId: string; updates: { name?: string; phone?: string; email?: string } }) => {
            const updatePayload: Record<string, string> = {};
            if (updates.name) updatePayload.name = updates.name;
            if (updates.phone !== undefined) updatePayload.phone = updates.phone;
            if (updates.email) updatePayload.email = updates.email;

            const { error } = await supabase
                .from("team_members")
                .update(updatePayload)
                .eq("id", memberId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    // ── Remove member ──────────────────────────────────────────────────
    const removeMemberMutation = useMutation({
        mutationFn: async (memberId: string) => {
            const { error } = await supabase
                .from("team_members")
                .delete()
                .eq("id", memberId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    return {
        members,
        stats,
        loading,
        addMember: addMemberMutation.mutateAsync,
        addMembersBulk: addMembersBulkMutation.mutateAsync,
        updateMember: updateMemberMutation.mutateAsync,
        removeMember: removeMemberMutation.mutateAsync,
        addingMember: addMemberMutation.isPending,
        addingBulk: addMembersBulkMutation.isPending,
        updating: updateMemberMutation.isPending,
        removing: removeMemberMutation.isPending,
    };
};

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberRole = "admin" | "member";

export interface TeamMember {
    /** app_users.id */
    id: string;
    /** tenant_memberships.id */
    membershipId: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    avatarColor: string | null;
    role: MemberRole;
    isActive: boolean;
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
    adminCount: number;
    avgConversionRate: number;
    totalLeadsAssigned: number;
    totalCalls: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTeam = () => {
    const queryClient = useQueryClient();
    const { user, currentTenantId } = useAuth();

    // Fetch team members via tenant_memberships JOIN app_users
    const { data: members = [], isLoading: loading } = useQuery({
        queryKey: ["team", "members", currentTenantId],
        queryFn: async () => {
            if (!currentTenantId) return [];

            try {
                // Fetch memberships with user data
                const { data: memberships, error } = await supabase
                    .from("tenant_memberships")
                    .select("id, user_id, role, is_active, joined_at, app_users ( id, email, phone, display_name, avatar_url, avatar_color, is_active )")
                    .eq("tenant_id", currentTenantId)
                    .order("joined_at", { ascending: true });

                if (error) {
                    console.error("Error fetching team:", error);
                    return [];
                }
                if (!memberships || memberships.length === 0) return [];

                const userIds = memberships.map(m => m.user_id);

                // Fetch leads assigned to these users in this tenant
                let leadsMap: Record<string, { total: number; active: number; closed: number }> = {};
                let callsMap: Record<string, { total: number; talkMins: number; lastAt: string | null }> = {};

                if (userIds.length > 0) {
                    const { data: leads } = await supabase
                        .from("leads")
                        .select("assigned_to, status")
                        .eq("tenant_id", currentTenantId)
                        .in("assigned_to", userIds);

                    for (const l of leads || []) {
                        const uid = l.assigned_to;
                        if (!uid) continue;
                        if (!leadsMap[uid]) leadsMap[uid] = { total: 0, active: 0, closed: 0 };
                        leadsMap[uid].total++;
                        if (l.status === "closed") leadsMap[uid].closed++;
                        else leadsMap[uid].active++;
                    }

                    const { data: calls } = await supabase
                        .from("call_logs")
                        .select("user_id, duration_seconds, created_at")
                        .eq("tenant_id", currentTenantId)
                        .in("user_id", userIds);

                    const talkSecsAccum: Record<string, number> = {};
                    for (const c of calls || []) {
                        const uid = c.user_id;
                        if (!uid) continue;
                        if (!callsMap[uid]) callsMap[uid] = { total: 0, talkMins: 0, lastAt: null };
                        callsMap[uid].total++;
                        talkSecsAccum[uid] = (talkSecsAccum[uid] || 0) + (c.duration_seconds || 0);
                        if (!callsMap[uid].lastAt || c.created_at > callsMap[uid].lastAt!) {
                            callsMap[uid].lastAt = c.created_at;
                        }
                    }
                    for (const uid in talkSecsAccum) {
                        callsMap[uid].talkMins = Math.round(talkSecsAccum[uid] / 60);
                    }
                }

                return memberships.map(row => {
                    const u = row.app_users as any;
                    const uid = row.user_id;
                    const ls = leadsMap[uid];
                    const cs = callsMap[uid];
                    const totalLeads = ls?.total ?? 0;
                    const closedLeads = ls?.closed ?? 0;

                    return {
                        id: uid,
                        membershipId: row.id,
                        name: u?.display_name || u?.email || "Unknown",
                        email: u?.email || "",
                        phone: u?.phone || "",
                        avatarUrl: u?.avatar_url || null,
                        avatarColor: u?.avatar_color || null,
                        role: row.role as MemberRole,
                        isActive: row.is_active && (u?.is_active ?? true),
                        joinedAt: row.joined_at,
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
        enabled: !!user && !!currentTenantId,
        staleTime: 30_000,
    });

    // Computed stats
    const stats: TeamStats = useMemo(() => {
        let adminCount = 0, convSum = 0, leadsSum = 0, callsSum = 0;
        const activeMembers = members.filter(m => m.isActive);
        for (const m of members) {
            if (m.role === "admin") adminCount++;
            convSum += m.conversionRate;
            leadsSum += m.totalLeads;
            callsSum += m.totalCalls;
        }
        return {
            totalMembers: members.length,
            activeMembers: activeMembers.length,
            adminCount,
            avgConversionRate: members.length > 0
                ? Math.round(convSum / members.length * 10) / 10
                : 0,
            totalLeadsAssigned: leadsSum,
            totalCalls: callsSum,
        };
    }, [members]);

    // ── Add a member (create app_user + membership) ────────────────────
    const addMemberMutation = useMutation({
        mutationFn: async (member: { name: string; email: string; phone?: string; password: string; role?: MemberRole }) => {
            if (!currentTenantId) throw new Error("No company context");

            // Hash password
            const encoder = new TextEncoder();
            const data = encoder.encode(member.password);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

            // Check if user already exists
            const { data: existing } = await supabase
                .from("app_users")
                .select("id")
                .eq("email", member.email.toLowerCase().trim())
                .maybeSingle();

            let userId: string;

            if (existing) {
                userId = existing.id;
                // Check if already a member of this tenant
                const { data: existingMem } = await supabase
                    .from("tenant_memberships")
                    .select("id")
                    .eq("user_id", userId)
                    .eq("tenant_id", currentTenantId)
                    .maybeSingle();

                if (existingMem) throw new Error("This user is already a member of this company.");
            } else {
                // Create new user
                const { data: newUser, error } = await supabase
                    .from("app_users")
                    .insert({
                        email: member.email.toLowerCase().trim(),
                        phone: member.phone?.trim() || null,
                        password_hash: passwordHash,
                        display_name: member.name.trim(),
                    })
                    .select()
                    .single();

                if (error || !newUser) throw new Error(error?.message || "Failed to create user.");
                userId = newUser.id;
            }

            // Create membership
            const { data: mem, error: memErr } = await supabase
                .from("tenant_memberships")
                .insert({
                    user_id: userId,
                    tenant_id: currentTenantId,
                    role: member.role || "member",
                })
                .select("id, user_id, role, is_active, joined_at, app_users ( id, email, phone, display_name, avatar_url, avatar_color, is_active )")
                .single();

            if (memErr || !mem) throw new Error(memErr?.message || "Failed to add member.");
            return mem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", "members", currentTenantId] });
        },
    });

    // ── Update member role ─────────────────────────────────────────────
    const updateMemberMutation = useMutation({
        mutationFn: async ({ membershipId, updates }: { membershipId: string; updates: { role?: MemberRole; is_active?: boolean } }) => {
            const { error } = await supabase
                .from("tenant_memberships")
                .update(updates)
                .eq("id", membershipId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", "members", currentTenantId] });
        },
    });

    // ── Remove member ──────────────────────────────────────────────────
    const removeMemberMutation = useMutation({
        mutationFn: async (membershipId: string) => {
            const { error } = await supabase
                .from("tenant_memberships")
                .delete()
                .eq("id", membershipId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", "members", currentTenantId] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    return {
        members,
        stats,
        loading,
        addMember: addMemberMutation.mutateAsync,
        updateMember: updateMemberMutation.mutateAsync,
        removeMember: removeMemberMutation.mutateAsync,
        addingMember: addMemberMutation.isPending,
        updating: updateMemberMutation.isPending,
        removing: removeMemberMutation.isPending,
    };
};

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/turso/db";
import { app_users, tenant_memberships, leads, call_logs } from "@/integrations/turso/schema";
import { eq, and, inArray } from "drizzle-orm";
import { useAuth } from "./useAuth";

export type MemberRole = "admin" | "member";

export interface TeamMember {
    id: string;
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

export const useTeam = () => {
    const queryClient = useQueryClient();
    const { user, currentTenantId } = useAuth();

    const { data: members = [], isLoading: loading } = useQuery({
        queryKey: ["team", "members", currentTenantId],
        queryFn: async () => {
            if (!currentTenantId) return [];
            try {
                // 1. Fetch memberships
                const memberships = await db
                    .select()
                    .from(tenant_memberships)
                    .where(eq(tenant_memberships.tenant_id, currentTenantId));

                if (!memberships.length) return [];

                const userIds = memberships.map((m) => m.user_id);

                // 2. Fetch users in batch
                const users = await db
                    .select({
                        id: app_users.id,
                        email: app_users.email,
                        phone: app_users.phone,
                        display_name: app_users.display_name,
                        avatar_url: app_users.avatar_url,
                        avatar_color: app_users.avatar_color,
                        is_active: app_users.is_active,
                    })
                    .from(app_users)
                    .where(inArray(app_users.id, userIds));

                const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

                // 3. Fetch leads stats
                const leadsRows = await db
                    .select({ assigned_to: leads.assigned_to, status: leads.status })
                    .from(leads)
                    .where(and(eq(leads.tenant_id, currentTenantId), inArray(leads.assigned_to, userIds)));

                const leadsMap: Record<string, { total: number; active: number; closed: number }> = {};
                for (const l of leadsRows) {
                    const uid = l.assigned_to;
                    if (!uid) continue;
                    if (!leadsMap[uid]) leadsMap[uid] = { total: 0, active: 0, closed: 0 };
                    leadsMap[uid].total++;
                    if (l.status === "closed") leadsMap[uid].closed++;
                    else leadsMap[uid].active++;
                }

                // 4. Fetch call stats
                const callRows = await db
                    .select({ user_id: call_logs.user_id, duration_seconds: call_logs.duration_seconds, created_at: call_logs.created_at })
                    .from(call_logs)
                    .where(and(eq(call_logs.tenant_id, currentTenantId), inArray(call_logs.user_id, userIds)));

                const callsMap: Record<string, { total: number; talkMins: number; lastAt: string | null }> = {};
                const talkSecs: Record<string, number> = {};
                for (const c of callRows) {
                    const uid = c.user_id;
                    if (!callsMap[uid]) callsMap[uid] = { total: 0, talkMins: 0, lastAt: null };
                    callsMap[uid].total++;
                    talkSecs[uid] = (talkSecs[uid] || 0) + (c.duration_seconds || 0);
                    if (!callsMap[uid].lastAt || c.created_at > callsMap[uid].lastAt!) {
                        callsMap[uid].lastAt = c.created_at;
                    }
                }
                for (const uid in talkSecs) {
                    callsMap[uid].talkMins = Math.round(talkSecs[uid] / 60);
                }

                return memberships.map((row) => {
                    const u = userMap[row.user_id];
                    const ls = leadsMap[row.user_id];
                    const cs = callsMap[row.user_id];
                    const totalLeads = ls?.total ?? 0;
                    const closedLeads = ls?.closed ?? 0;
                    return {
                        id: row.user_id,
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

    const stats: TeamStats = useMemo(() => {
        let adminCount = 0, convSum = 0, leadsSum = 0, callsSum = 0;
        const activeMembers = members.filter((m) => m.isActive);
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
            avgConversionRate: members.length > 0 ? Math.round((convSum / members.length) * 10) / 10 : 0,
            totalLeadsAssigned: leadsSum,
            totalCalls: callsSum,
        };
    }, [members]);

    //  Add a member 
    const addMemberMutation = useMutation({
        mutationFn: async (member: { name: string; email: string; phone?: string; password: string; role?: MemberRole }) => {
            if (!currentTenantId) throw new Error("No company context");

            const encoder = new TextEncoder();
            const data = encoder.encode(member.password);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const passwordHash = Array.from(new Uint8Array(hashBuffer))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            const [existing] = await db
                .select({ id: app_users.id })
                .from(app_users)
                .where(eq(app_users.email, member.email.toLowerCase().trim()))
                .limit(1);

            let userId: string;

            if (existing) {
                userId = existing.id;
                const [existingMem] = await db
                    .select({ id: tenant_memberships.id })
                    .from(tenant_memberships)
                    .where(and(eq(tenant_memberships.user_id, userId), eq(tenant_memberships.tenant_id, currentTenantId)))
                    .limit(1);
                if (existingMem) throw new Error("This user is already a member of this company.");
            } else {
                const [newUser] = await db
                    .insert(app_users)
                    .values({
                        email: member.email.toLowerCase().trim(),
                        phone: member.phone?.trim() || null,
                        password_hash: passwordHash,
                        display_name: member.name.trim(),
                    })
                    .returning();
                if (!newUser) throw new Error("Failed to create user.");
                userId = newUser.id;
            }

            const [mem] = await db
                .insert(tenant_memberships)
                .values({ user_id: userId, tenant_id: currentTenantId, role: member.role || "member" })
                .returning();

            if (!mem) throw new Error("Failed to add member.");
            return mem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", "members", currentTenantId] });
        },
    });

    //  Update member role/status 
    const updateMemberMutation = useMutation({
        mutationFn: async ({ membershipId, updates }: { membershipId: string; updates: { role?: MemberRole; is_active?: boolean } }) => {
            await db
                .update(tenant_memberships)
                .set(updates)
                .where(eq(tenant_memberships.id, membershipId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", "members", currentTenantId] });
        },
    });

    //  Remove member 
    const removeMemberMutation = useMutation({
        mutationFn: async (membershipId: string) => {
            await db.delete(tenant_memberships).where(eq(tenant_memberships.id, membershipId));
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/turso/db";
import { leads } from "@/integrations/turso/schema";
import { eq, and, desc } from "drizzle-orm";
import { useAuth } from "./useAuth";
import { createActivity } from "@/services/activityService";
import { createNotification } from "@/services/notificationService";
import type { Lead, LeadStatus } from "@/integrations/turso/types";

export type { Lead, LeadStatus };

export const useLeads = () => {
    const queryClient = useQueryClient();
    const { user, currentTenantId } = useAuth();

    //  Fetch all leads (admin) — tenant scoped 
    const { data: allLeads = [], isLoading: loadingAll } = useQuery({
        queryKey: ["leads", "all", currentTenantId],
        enabled: !!user && !!currentTenantId,
        queryFn: async () => {
            if (!currentTenantId) return [];
            return db
                .select()
                .from(leads)
                .where(eq(leads.tenant_id, currentTenantId))
                .orderBy(desc(leads.created_at));
        },
        staleTime: 30_000,
    });

    //  Fetch my leads (member) 
    const { data: myLeads = [], isLoading: loadingMy } = useQuery({
        queryKey: ["leads", "my", user?.id, currentTenantId],
        enabled: !!user?.id && !!currentTenantId,
        queryFn: async () => {
            if (!user?.id || !currentTenantId) return [];
            return db
                .select()
                .from(leads)
                .where(and(eq(leads.tenant_id, currentTenantId), eq(leads.assigned_to, user.id)))
                .orderBy(desc(leads.created_at));
        },
        staleTime: 30_000,
    });

    //  Update lead status (optimistic) 
    const updateStatusMutation = useMutation({
        mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
            await db
                .update(leads)
                .set({ status, updated_at: new Date().toISOString() })
                .where(eq(leads.id, leadId));
            return { leadId, status };
        },
        onMutate: async ({ leadId, status }) => {
            await queryClient.cancelQueries({ queryKey: ["leads"] });
            const previousAll = queryClient.getQueryData<Lead[]>(["leads", "all", currentTenantId]);
            const previousMy = queryClient.getQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId]);
            const patchLead = (ls: Lead[] | undefined) =>
                ls?.map((l) => (l.id === leadId ? { ...l, status, updated_at: new Date().toISOString() } : l)) ?? [];
            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], patchLead);
            if (previousMy) queryClient.setQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId], patchLead);
            return { previousAll, previousMy };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousAll) queryClient.setQueryData(["leads", "all", currentTenantId], context.previousAll);
            if (context?.previousMy) queryClient.setQueryData(["leads", "my", user?.id, currentTenantId], context.previousMy);
        },
        onSuccess: (_data, variables) => {
            if (user && currentTenantId) {
                const statusLabel = variables.status.charAt(0).toUpperCase() + variables.status.slice(1);
                const cachedLeads = queryClient.getQueryData<Lead[]>(["leads", "all", currentTenantId]);
                const lead = cachedLeads?.find(l => l.id === variables.leadId);
                const actorName = user.display_name?.split(" ")[0] || "Someone";
                const leadName = lead?.name || "a lead";
                createActivity({
                    tenant_id: currentTenantId,
                    user_id: user.id,
                    action: variables.status === "closed" ? "milestone" : "info",
                    description: `${actorName} moved ${leadName} → ${statusLabel}`,
                }).catch(() => {});
            }
            queryClient.invalidateQueries({ queryKey: ["activities"] });
        },
    });

    //  Assign lead to user (optimistic) 
    const assignLeadMutation = useMutation({
        mutationFn: async ({ leadId, userId }: { leadId: string; userId: string | null }) => {
            await db
                .update(leads)
                .set({ assigned_to: userId, updated_at: new Date().toISOString() })
                .where(eq(leads.id, leadId));
        },
        onMutate: async ({ leadId, userId }) => {
            await queryClient.cancelQueries({ queryKey: ["leads"] });
            const previousAll = queryClient.getQueryData<Lead[]>(["leads", "all", currentTenantId]);
            const previousMy = queryClient.getQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId]);
            const patchLead = (ls: Lead[] | undefined) =>
                ls?.map((l) => (l.id === leadId ? { ...l, assigned_to: userId, updated_at: new Date().toISOString() } : l)) ?? [];
            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], patchLead);
            if (previousMy) queryClient.setQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId], patchLead);
            return { previousAll, previousMy };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousAll) queryClient.setQueryData(["leads", "all", currentTenantId], context.previousAll);
            if (context?.previousMy) queryClient.setQueryData(["leads", "my", user?.id, currentTenantId], context.previousMy);
        },
        onSuccess: (_data, variables) => {
            if (currentTenantId) {
                const cachedLeads = queryClient.getQueryData<Lead[]>(["leads", "all", currentTenantId]);
                const cachedMembers = queryClient.getQueryData<{ id: string; name: string }[]>(["team", "members", currentTenantId]);
                const lead = cachedLeads?.find(l => l.id === variables.leadId);
                const leadName = lead?.name || "a lead";

                if (variables.userId) {
                    // Notify the assigned BDA
                    createNotification({
                        tenant_id: currentTenantId,
                        user_id: variables.userId,
                        type: "lead_assigned",
                        title: "New Lead Assigned",
                        message: `${leadName} has been assigned to you`,
                        priority: "normal",
                        action_url: "/leads",
                    }).catch(() => {});

                    const assignee = cachedMembers?.find(m => m.id === variables.userId);
                    const bdaName = assignee?.name || "a team member";
                    createActivity({
                        tenant_id: currentTenantId,
                        user_id: user?.id ?? variables.userId,
                        action: "info",
                        description: `${leadName} assigned to ${bdaName}`,
                    }).catch(() => {});
                } else if (user) {
                    // Unassign — still worth logging
                    createActivity({
                        tenant_id: currentTenantId,
                        user_id: user.id,
                        action: "neutral",
                        description: `${leadName} unassigned`,
                    }).catch(() => {});
                }
            }
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["activities"] });
        },
    });

    //  Add a single lead 
    const addLeadMutation = useMutation({
        mutationFn: async (lead: { name: string; phone: string; status?: LeadStatus }) => {
            if (!currentTenantId) throw new Error("No company context");
            const [row] = await db
                .insert(leads)
                .values({
                    name: lead.name.trim(),
                    phone: lead.phone.trim(),
                    status: lead.status || "new",
                    tenant_id: currentTenantId,
                })
                .returning();
            return row as Lead;
        },
        onSuccess: (newLead) => {
            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], (old) =>
                old ? [newLead, ...old] : [newLead],
            );
        },
    });

    //  Add leads in bulk 
    const addLeadsBulkMutation = useMutation({
        mutationFn: async (newLeads: { name: string; phone: string; status?: LeadStatus }[]) => {
            if (!currentTenantId) throw new Error("No company context");
            const rows = newLeads.map((l) => ({
                name: l.name.trim(),
                phone: l.phone.trim(),
                status: (l.status || "new") as LeadStatus,
                tenant_id: currentTenantId,
            }));
            return db.insert(leads).values(rows).returning() as Promise<Lead[]>;
        },
        onSuccess: (inserted) => {
            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], (old) =>
                old ? [...inserted, ...old] : inserted,
            );
        },
    });

    return {
        allLeads,
        myLeads,
        loading: loadingAll || loadingMy,
        updateStatus: updateStatusMutation.mutate,
        assignLead: assignLeadMutation.mutate,
        addLead: addLeadMutation.mutateAsync,
        addLeadsBulk: addLeadsBulkMutation.mutateAsync,
        addingLead: addLeadMutation.isPending,
        addingBulk: addLeadsBulkMutation.isPending,
    };
};

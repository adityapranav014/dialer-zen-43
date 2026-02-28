import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];

export const useLeads = () => {
    const queryClient = useQueryClient();
    const { user, currentTenantId } = useAuth();

    // ── Fetch all leads (admin) — tenant scoped ───────────────────────
    const { data: allLeads = [], isLoading: loadingAll } = useQuery({
        queryKey: ["leads", "all", currentTenantId],
        enabled: !!user && !!currentTenantId,
        queryFn: async () => {
            if (!currentTenantId) return [];

            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("tenant_id", currentTenantId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as Lead[];
        },
        staleTime: 30_000,
    });

    // ── Fetch my leads (member) — assigned_to = user.id directly ──────
    const { data: myLeads = [], isLoading: loadingMy } = useQuery({
        queryKey: ["leads", "my", user?.id, currentTenantId],
        enabled: !!user?.id && !!currentTenantId,
        queryFn: async () => {
            if (!user?.id || !currentTenantId) return [];

            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("tenant_id", currentTenantId)
                .eq("assigned_to", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as Lead[];
        },
        staleTime: 30_000,
    });

    // ── Update lead status (optimistic) ──────────────────────────────
    const updateStatusMutation = useMutation({
        mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
            const { error } = await supabase
                .from("leads")
                .update({ status, updated_at: new Date().toISOString() })
                .eq("id", leadId);

            if (error) throw error;
        },
        onMutate: async ({ leadId, status }) => {
            await queryClient.cancelQueries({ queryKey: ["leads"] });

            const previousAll = queryClient.getQueryData<Lead[]>(["leads", "all", currentTenantId]);
            const previousMy = queryClient.getQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId]);

            const patchLead = (leads: Lead[] | undefined) =>
                leads?.map((l) => (l.id === leadId ? { ...l, status, updated_at: new Date().toISOString() } : l)) ?? [];

            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], patchLead);
            if (previousMy) {
                queryClient.setQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId], patchLead);
            }

            return { previousAll, previousMy };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousAll) queryClient.setQueryData(["leads", "all", currentTenantId], context.previousAll);
            if (context?.previousMy) queryClient.setQueryData(["leads", "my", user?.id, currentTenantId], context.previousMy);
        },
    });

    // ── Assign lead to user (optimistic) ─────────────────────────────
    const assignLeadMutation = useMutation({
        mutationFn: async ({ leadId, userId }: { leadId: string; userId: string | null }) => {
            const { error } = await supabase
                .from("leads")
                .update({ assigned_to: userId, updated_at: new Date().toISOString() })
                .eq("id", leadId);

            if (error) throw error;
        },
        onMutate: async ({ leadId, userId }) => {
            await queryClient.cancelQueries({ queryKey: ["leads"] });

            const previousAll = queryClient.getQueryData<Lead[]>(["leads", "all", currentTenantId]);
            const previousMy = queryClient.getQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId]);

            const patchLead = (leads: Lead[] | undefined) =>
                leads?.map((l) => (l.id === leadId ? { ...l, assigned_to: userId, updated_at: new Date().toISOString() } : l)) ?? [];

            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], patchLead);
            if (previousMy) {
                queryClient.setQueryData<Lead[]>(["leads", "my", user?.id, currentTenantId], patchLead);
            }

            return { previousAll, previousMy };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousAll) queryClient.setQueryData(["leads", "all", currentTenantId], context.previousAll);
            if (context?.previousMy) queryClient.setQueryData(["leads", "my", user?.id, currentTenantId], context.previousMy);
        },
    });

    // ── Add a single lead ─────────────────────────────────────────────
    const addLeadMutation = useMutation({
        mutationFn: async (lead: { name: string; phone: string; status?: LeadStatus }) => {
            if (!currentTenantId) throw new Error("No company context");

            const { data, error } = await supabase
                .from("leads")
                .insert({
                    name: lead.name.trim(),
                    phone: lead.phone.trim(),
                    status: lead.status || "new",
                    tenant_id: currentTenantId,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Lead;
        },
        onSuccess: (newLead) => {
            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], (old) =>
                old ? [newLead, ...old] : [newLead],
            );
        },
    });

    // ── Add leads in bulk (CSV import) ────────────────────────────────
    const addLeadsBulkMutation = useMutation({
        mutationFn: async (leads: { name: string; phone: string; status?: LeadStatus }[]) => {
            if (!currentTenantId) throw new Error("No company context");

            const rows = leads.map((l) => ({
                name: l.name.trim(),
                phone: l.phone.trim(),
                status: l.status || ("new" as LeadStatus),
                tenant_id: currentTenantId,
            }));

            const { data, error } = await supabase
                .from("leads")
                .insert(rows)
                .select();

            if (error) throw error;
            return (data ?? []) as Lead[];
        },
        onSuccess: (newLeads) => {
            queryClient.setQueryData<Lead[]>(["leads", "all", currentTenantId], (old) =>
                old ? [...newLeads, ...old] : newLeads,
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];

/** Well-known UUID for the demo workspace tenant (same as useTeam). */
const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export const useLeads = () => {
    const queryClient = useQueryClient();
    const { user, isDemo } = useAuth();

    // ── Resolve tenant_id ─────────────────────────────────────────────
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

    // ── Fetch all leads (admin) ───────────────────────────────────────
    const { data: allLeads = [], isLoading: loadingAll } = useQuery({
        queryKey: ["leads", "all"],
        queryFn: async () => {
            const tenantId = await getTenantId();

            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as Lead[];
        },
    });

    // ── Fetch my leads (BDA) ──────────────────────────────────────────
    // Skip for demo users — "admin-id" / "bda-*" are not valid UUIDs
    // and would cause a 400 against the UUID column.
    const { data: myLeads = [], isLoading: loadingMy } = useQuery({
        queryKey: ["leads", "my", user?.id],
        enabled: !!user?.id && !isDemo,
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("assigned_to", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as Lead[];
        },
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
            const previous = queryClient.getQueryData<Lead[]>(["leads", "all"]);
            queryClient.setQueryData<Lead[]>(["leads", "all"], (old) =>
                old?.map((l) => (l.id === leadId ? { ...l, status } : l)) ?? [],
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(["leads", "all"], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    // ── Assign lead to BDA (optimistic) ──────────────────────────────
    const assignLeadMutation = useMutation({
        mutationFn: async ({ leadId, bdaId }: { leadId: string; bdaId: string | null }) => {
            const { error } = await supabase
                .from("leads")
                .update({ assigned_to: bdaId, updated_at: new Date().toISOString() })
                .eq("id", leadId);

            if (error) throw error;
        },
        onMutate: async ({ leadId, bdaId }) => {
            await queryClient.cancelQueries({ queryKey: ["leads"] });
            const previous = queryClient.getQueryData<Lead[]>(["leads", "all"]);
            queryClient.setQueryData<Lead[]>(["leads", "all"], (old) =>
                old?.map((l) => (l.id === leadId ? { ...l, assigned_to: bdaId } : l)) ?? [],
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(["leads", "all"], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    // ── Add a single lead ─────────────────────────────────────────────
    const addLeadMutation = useMutation({
        mutationFn: async (lead: { name: string; phone: string; status?: LeadStatus }) => {
            const tenantId = await getTenantId();

            const { data, error } = await supabase
                .from("leads")
                .insert({
                    name: lead.name.trim(),
                    phone: lead.phone.trim(),
                    status: lead.status || "new",
                    tenant_id: tenantId,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Lead;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    // ── Add leads in bulk (CSV import) ────────────────────────────────
    const addLeadsBulkMutation = useMutation({
        mutationFn: async (leads: { name: string; phone: string; status?: LeadStatus }[]) => {
            const tenantId = await getTenantId();

            const rows = leads.map((l) => ({
                name: l.name.trim(),
                phone: l.phone.trim(),
                status: l.status || ("new" as LeadStatus),
                tenant_id: tenantId,
            }));

            const { data, error } = await supabase
                .from("leads")
                .insert(rows)
                .select();

            if (error) throw error;
            return (data ?? []) as Lead[];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
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

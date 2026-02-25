import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];

const MOCK_LEADS: Lead[] = [
    // Unassigned / New
    { id: "l1", tenant_id: "t1", name: "Rishabh Malhotra", phone: "+91 98765 43210", status: "new", assigned_to: null, created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l6", tenant_id: "t1", name: "Kunal Kapoor", phone: "+91 91234 56789", status: "new", assigned_to: null, created_at: new Date(Date.now() - 4200000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l7", tenant_id: "t1", name: "Sneha Reddy", phone: "+91 98111 22233", status: "new", assigned_to: null, created_at: new Date(Date.now() - 8600000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l8", tenant_id: "t1", name: "Arjun Mehra", phone: "+91 99887 76655", status: "new", assigned_to: null, created_at: new Date(Date.now() - 17200000).toISOString(), updated_at: new Date().toISOString() },

    // Contacted
    { id: "l2", tenant_id: "t1", name: "Ananya Sharma", phone: "+91 87654 32109", status: "contacted", assigned_to: "bda-1", created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l9", tenant_id: "t1", name: "Deepak Verma", phone: "+91 95555 44444", status: "contacted", assigned_to: "bda-2", created_at: new Date(Date.now() - 9500000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l10", tenant_id: "t1", name: "Isha Gupta", phone: "+91 94444 33333", status: "contacted", assigned_to: "bda-3", created_at: new Date(Date.now() - 12000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l11", tenant_id: "t1", name: "Rohan Das", phone: "+91 93333 22222", status: "contacted", assigned_to: "bda-4", created_at: new Date(Date.now() - 15000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l12", tenant_id: "t1", name: "Sanya Malhotra", phone: "+91 92222 11111", status: "contacted", assigned_to: "bda-1", created_at: new Date(Date.now() - 20000000).toISOString(), updated_at: new Date().toISOString() },

    // Interested
    { id: "l3", tenant_id: "t1", name: "Vikram Sethi", phone: "+91 76543 21098", status: "interested", assigned_to: "bda-2", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l4", tenant_id: "t1", name: "Priya Das", phone: "+91 65432 10987", status: "interested", assigned_to: "bda-1", created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l13", tenant_id: "t1", name: "Amit Trivedi", phone: "+91 90000 80000", status: "interested", assigned_to: "bda-5", created_at: new Date(Date.now() - 200000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l14", tenant_id: "t1", name: "Neha Kakkar", phone: "+91 98888 77777", status: "interested", assigned_to: "bda-6", created_at: new Date(Date.now() - 250000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l15", tenant_id: "t1", name: "Varun Dhawan", phone: "+91 97777 66666", status: "interested", assigned_to: "bda-7", created_at: new Date(Date.now() - 300000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l16", tenant_id: "t1", name: "Kriti Sanon", phone: "+91 96666 55555", status: "interested", assigned_to: "bda-2", created_at: new Date(Date.now() - 350000000).toISOString(), updated_at: new Date().toISOString() },

    // Closed / Won
    { id: "l5", tenant_id: "t1", name: "Siddharth Jain", phone: "+91 99988 77766", status: "closed", assigned_to: "bda-3", created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l17", tenant_id: "t1", name: "Ayushmann Khurrana", phone: "+91 95555 66666", status: "closed", assigned_to: "bda-8", created_at: new Date(Date.now() - 400000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l18", tenant_id: "t1", name: "Rajkummar Rao", phone: "+91 94444 55555", status: "closed", assigned_to: "bda-9", created_at: new Date(Date.now() - 450000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l19", tenant_id: "t1", name: "Pankaj Tripathi", phone: "+91 93333 44444", status: "closed", assigned_to: "bda-1", created_at: new Date(Date.now() - 500000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l20", tenant_id: "t1", name: "Nawazuddin Siddiqui", phone: "+91 92222 33333", status: "closed", assigned_to: "bda-4", created_at: new Date(Date.now() - 550000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l21", tenant_id: "t1", name: "Manoj Bajpayee", phone: "+91 91111 22222", status: "closed", assigned_to: "bda-5", created_at: new Date(Date.now() - 600000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l22", tenant_id: "t1", name: "Vicky Kaushal", phone: "+91 90000 11111", status: "closed", assigned_to: "bda-6", created_at: new Date(Date.now() - 650000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l23", tenant_id: "t1", name: "Kartik Aaryan", phone: "+91 89999 00000", status: "closed", assigned_to: "bda-7", created_at: new Date(Date.now() - 700000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l24", tenant_id: "t1", name: "Kiara Advani", phone: "+91 88888 99999", status: "closed", assigned_to: "bda-8", created_at: new Date(Date.now() - 750000000).toISOString(), updated_at: new Date().toISOString() },
    { id: "l25", tenant_id: "t1", name: "Ranbir Kapoor", phone: "+91 87777 88888", status: "closed", assigned_to: "bda-9", created_at: new Date(Date.now() - 800000000).toISOString(), updated_at: new Date().toISOString() },
];

export const useLeads = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isMockUser = user?.id === "admin-id" || user?.id?.startsWith("bda-");

    // Fetch all leads (for admin)
    const { data: allLeads = [], isLoading: loadingAll } = useQuery({
        queryKey: ["leads", "all"],
        queryFn: async () => {
            if (isMockUser) return MOCK_LEADS;

            try {
                const { data, error } = await supabase
                    .from("leads")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                return (data && data.length > 0) ? data as Lead[] : MOCK_LEADS;
            } catch (error) {
                console.error("Supabase error in useLeads (all), falling back to mock:", error);
                return MOCK_LEADS;
            }
        },
    });

    // Fetch my leads (for BDA)
    const { data: myLeads = [], isLoading: loadingMy } = useQuery({
        queryKey: ["leads", "my", user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            // Instant return for mock agents
            if (isMockUser) {
                const filteredMocks = MOCK_LEADS.filter(l => l.assigned_to === user?.id);
                // If the generic BDA agent with no assignments in mock, give them some
                if (filteredMocks.length === 0 && user?.id?.startsWith("bda")) {
                    return MOCK_LEADS.filter(l => l.assigned_to === "bda-1");
                }
                return filteredMocks;
            }

            try {
                const { data, error } = await supabase
                    .from("leads")
                    .select("*")
                    .eq("assigned_to", user?.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                return (data && data.length > 0) ? data as Lead[] : [];
            } catch (error) {
                console.error("Supabase error in useLeads (my), returning empty:", error);
                return [];
            }
        },
    });

    // Update lead status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
            const { error } = await supabase
                .from("leads")
                .update({ status, updated_at: new Date().toISOString() })
                .eq("id", leadId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    // Assign lead to BDA
    const assignLeadMutation = useMutation({
        mutationFn: async ({ leadId, bdaId }: { leadId: string; bdaId: string | null }) => {
            const { error } = await supabase
                .from("leads")
                .update({ assigned_to: bdaId, updated_at: new Date().toISOString() })
                .eq("id", leadId);

            if (error) throw error;
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
    };
};

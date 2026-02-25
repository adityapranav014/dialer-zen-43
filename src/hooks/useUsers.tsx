import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const MOCK_PROFILES: Profile[] = [
    { id: "p1", user_id: "admin-id", tenant_id: "t1", display_name: "Aditya Admin", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p2", user_id: "bda-1", tenant_id: "t1", display_name: "Sarah Chen", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p3", user_id: "bda-2", tenant_id: "t1", display_name: "Michael Ross", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p4", user_id: "bda-3", tenant_id: "t1", display_name: "Emma Wilson", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p5", user_id: "bda-4", tenant_id: "t1", display_name: "David Park", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p6", user_id: "bda-5", tenant_id: "t1", display_name: "Jessica Pearson", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p7", user_id: "bda-6", tenant_id: "t1", display_name: "Harvey Specter", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p8", user_id: "bda-7", tenant_id: "t1", display_name: "Rachel Zane", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p9", user_id: "bda-8", tenant_id: "t1", display_name: "Louis Litt", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "p10", user_id: "bda-9", tenant_id: "t1", display_name: "Donna Paulsen", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const useUsers = () => {
    const { user } = useAuth();
    const isMockUser = user?.id === "admin-id" || user?.id?.startsWith("bda-");

    // Fetch all BDAs (users with role 'bda')
    const { data: bdas = [], isLoading: loadingBDAs } = useQuery({
        queryKey: ["users", "bdas"],
        queryFn: async () => {
            // Instant return for mock users to avoid Supabase errors/hangs
            if (isMockUser) return MOCK_PROFILES;

            try {
                // First get user IDs with BDA role
                const { data: roles, error: rolesError } = await supabase
                    .from("user_roles")
                    .select("user_id")
                    .eq("role", "bda");

                if (rolesError) throw rolesError;

                // If no roles found, return mock data for demo
                if (!roles || roles.length === 0) return MOCK_PROFILES;

                const userIds = roles.map(r => r.user_id);

                // Then fetch their profiles
                const { data: profiles, error: profilesError } = await supabase
                    .from("profiles")
                    .select("*")
                    .in("user_id", userIds);

                if (profilesError) throw profilesError;

                // Fallback to mock if profiles are empty
                return (profiles && profiles.length > 0) ? profiles as Profile[] : MOCK_PROFILES;
            } catch (error) {
                console.error("Supabase error in useUsers, falling back to mock:", error);
                return MOCK_PROFILES;
            }
        },
    });

    return {
        bdas,
        loading: loadingBDAs,
    };
};

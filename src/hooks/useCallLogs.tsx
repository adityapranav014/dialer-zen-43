import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useCallLogs = () => {
    const queryClient = useQueryClient();
    const { user, currentTenantId } = useAuth();

    const logCallMutation = useMutation({
        mutationFn: async ({
            leadId,
            durationSeconds,
            notes,
            outcome
        }: {
            leadId: string;
            durationSeconds: number;
            notes: string;
            outcome: string;
        }) => {
            if (!user) throw new Error("User must be logged in to log a call");
            if (!currentTenantId) throw new Error("No company context selected");

            const { error } = await supabase.from("call_logs").insert({
                user_id: user.id,
                tenant_id: currentTenantId,
                lead_id: leadId,
                duration_seconds: durationSeconds,
                notes,
                outcome,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["call_logs"] });
            queryClient.invalidateQueries({ queryKey: ["leads", "activity"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
        },
    });

    return {
        logCall: logCallMutation.mutateAsync,
        isLogging: logCallMutation.isPending,
    };
};

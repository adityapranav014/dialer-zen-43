import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useCallLogs = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

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

            const { error } = await supabase.from("call_logs").insert({
                bda_id: user.id,
                lead_id: leadId,
                duration_seconds: durationSeconds,
                notes,
                outcome,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate relevant queries if needed
            queryClient.invalidateQueries({ queryKey: ["call_logs"] });
            queryClient.invalidateQueries({ queryKey: ["leads", "activity"] });
        },
    });

    return {
        logCall: logCallMutation.mutateAsync,
        isLogging: logCallMutation.isPending,
    };
};

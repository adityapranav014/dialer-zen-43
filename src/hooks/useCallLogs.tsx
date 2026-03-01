import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { db } from "@/integrations/turso/db";
import { call_logs, leads } from "@/integrations/turso/schema";
import { useAuth } from "./useAuth";
import { createActivity } from "@/services/activityService";
import { createNotification } from "@/services/notificationService";

/** Determine new lead status after a call outcome. Returns null if no change needed. */
const computeLeadStatus = (outcome: string, currentStatus: string): string | null => {
    if (outcome === "Closed Won") return "closed";
    if (outcome === "Interested") {
        // Don't downgrade an already-closed lead
        if (currentStatus === "closed") return null;
        return "interested";
    }
    // Follow Up, Not Interested, Voicemail, Wrong Number — move "new" → "contacted"
    if (currentStatus === "new") return "contacted";
    return null;
};

export const useCallLogs = () => {
    const queryClient = useQueryClient();
    const { user, currentTenantId } = useAuth();

    const logCallMutation = useMutation({
        mutationFn: async ({
            leadId,
            durationSeconds,
            notes,
            outcome,
            currentLeadStatus = "new",
        }: {
            leadId: string;
            durationSeconds: number;
            notes: string;
            outcome: string;
            currentLeadStatus?: string;
        }) => {
            if (!user) throw new Error("User must be logged in to log a call");
            if (!currentTenantId) throw new Error("No company context selected");

            await db.insert(call_logs).values({
                user_id: user.id,
                tenant_id: currentTenantId,
                lead_id: leadId,
                duration_seconds: durationSeconds,
                notes,
                outcome,
            });

            const newStatus = computeLeadStatus(outcome, currentLeadStatus);
            if (newStatus) {
                await db
                    .update(leads)
                    .set({ status: newStatus, updated_at: new Date().toISOString() })
                    .where(eq(leads.id, leadId));
            }
        },
        onSuccess: (_data, variables) => {
            // Log activity
            if (user && currentTenantId) {
                const outcomeLabel = variables.outcome || "Call";
                createActivity({
                    tenant_id: currentTenantId,
                    user_id: user.id,
                    action: outcomeLabel === "Closed Won" || outcomeLabel === "Interested" ? "success" : "neutral",
                    description: `Logged call — ${outcomeLabel}`,
                }).catch(() => {});

                // Trigger conversion notification for admins when a deal is closed
                if (outcomeLabel === "Closed Won" || outcomeLabel === "Interested") {
                    createNotification({
                        tenant_id: currentTenantId,
                        user_id: user.id,
                        type: "conversion",
                        title: "Lead Conversion",
                        message: `Call outcome: ${outcomeLabel}`,
                        priority: "normal",
                    }).catch(() => {});
                }
            }

            queryClient.invalidateQueries({ queryKey: ["call_logs"] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["lead-funnel"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    return {
        logCall: logCallMutation.mutateAsync,
        isLogging: logCallMutation.isPending,
    };
};

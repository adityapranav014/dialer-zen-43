/**
 * useSettings — user settings hook (Turso / Drizzle)
 *
 * Fetches and persists per-user settings (notifications, calling, leads, general)
 * to the `user_settings` table via the service layer.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  fetchSettings,
  updateSettings,
  DEFAULT_SETTINGS,
  type UserSettings,
} from "@/services/settingsService";

export type { UserSettings } from "@/services/settingsService";

const QUERY_KEY = "user-settings";

export const useSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ── Fetch current settings ───────────────────────────────────────────
  const { data: settings, isLoading } = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchSettings(user!.id),
    staleTime: 60_000,
  });

  // ── Patch a single field (or multiple) ───────────────────────────────
  const patchMutation = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => updateSettings(user!.id, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] });
      const prev = queryClient.getQueryData<UserSettings>([QUERY_KEY, user?.id]);
      queryClient.setQueryData<UserSettings>([QUERY_KEY, user?.id], (old) =>
        old ? { ...old, ...patch } : old,
      );
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([QUERY_KEY, user?.id], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] }),
  });

  /** Toggle a boolean setting */
  const toggle = (key: keyof UserSettings) => {
    const current = settings?.[key];
    if (typeof current === "boolean") {
      patchMutation.mutate({ [key]: !current });
    }
  };

  /** Set a setting to a specific value */
  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    patchMutation.mutate({ [key]: value });
  };

  // For demo mode, return in-memory defaults that won't persist
  const resolved = settings ?? ({
    ...DEFAULT_SETTINGS,
    id: "",
    user_id: user?.id ?? "",
    created_at: "",
    updated_at: "",
  } as UserSettings);

  return {
    settings: resolved,
    isLoading,
    isSaving: patchMutation.isPending,
    toggle,
    set,
    patch: patchMutation.mutate,
  };
};

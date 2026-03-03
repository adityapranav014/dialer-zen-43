/**
 * useStatusConfig – provides the resolved status pipeline for the active tenant.
 *
 * Reads `tenants.settings.lead_statuses` via React-Query and resolves the
 * StatusDef[] into fully-coloured ResolvedStatus[].
 *
 * Falls back to DEFAULT_LEAD_STATUSES when:
 *   • the tenant has no overrides yet, OR
 *   • we're in platform-view (no tenant selected)
 *
 * Components should replace every hard-coded status list / colour map with
 * values from this hook.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/turso/db";
import { tenants } from "@/integrations/turso/schema";
import { eq } from "drizzle-orm";
import { useAuth } from "./useAuth";
import {
  DEFAULT_LEAD_STATUSES,
  resolveStatuses,
  statusMap,
  type StatusDef,
  type ResolvedStatus,
  type TenantStatusConfig,
} from "@/config/statusConfig";

// ─── Query key ────────────────────────────────────────────────────────────────

const statusKey = (tenantId: string | null) => ["tenant-statuses", tenantId ?? "__none__"];

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchTenantStatuses(tenantId: string): Promise<StatusDef[]> {
  const rows = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const settings = rows[0]?.settings as Record<string, unknown> | undefined;
  const raw = settings?.lead_statuses;

  if (Array.isArray(raw) && raw.length > 0) {
    // Validate shape – each entry must have id, label, color
    const valid = raw.every(
      (s: any) => typeof s.id === "string" && typeof s.label === "string" && typeof s.color === "string",
    );
    if (valid) return raw as StatusDef[];
  }

  return DEFAULT_LEAD_STATUSES;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function saveTenantStatuses(tenantId: string, defs: TenantStatusConfig): Promise<void> {
  // Read existing settings first so we don't overwrite other keys
  const rows = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const existing = (rows[0]?.settings ?? {}) as Record<string, unknown>;
  const merged = { ...existing, lead_statuses: defs };

  await db.update(tenants).set({ settings: merged }).where(eq(tenants.id, tenantId));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface StatusConfigResult {
  /** Ordered resolved statuses */
  statuses: ResolvedStatus[];
  /** Lookup by id */
  map: Record<string, ResolvedStatus>;
  /** StatusDef for a given id (unresolved) — useful for editing */
  defs: StatusDef[];
  /** List of status ids in order */
  ids: string[];
  /** Array suitable for filter tabs: [{id, label}] with an "all" entry prepended */
  filterTabs: { id: string; label: string }[];
  /** Is data still loading? */
  isLoading: boolean;
  /** Save new status config for a given tenant (super-admin only) */
  saveStatuses: (tenantId: string, defs: StatusDef[]) => Promise<void>;
  isSaving: boolean;
}

export function useStatusConfig(): StatusConfigResult {
  const { currentTenantId } = useAuth();
  const qc = useQueryClient();

  const { data: defs = DEFAULT_LEAD_STATUSES, isLoading } = useQuery({
    queryKey: statusKey(currentTenantId),
    queryFn: () => (currentTenantId ? fetchTenantStatuses(currentTenantId) : Promise.resolve(DEFAULT_LEAD_STATUSES)),
    staleTime: 5 * 60_000, // 5 min cache
    gcTime: 30 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: ({ tenantId, defs }: { tenantId: string; defs: StatusDef[] }) =>
      saveTenantStatuses(tenantId, defs),
    onSuccess: (_data, variables) => {
      // Invalidate the query for the saved tenant
      qc.invalidateQueries({ queryKey: statusKey(variables.tenantId) });
    },
  });

  const resolved = resolveStatuses(defs);
  const map_ = statusMap(resolved);

  const filterTabs = [
    { id: "all", label: "All Leads" },
    ...resolved.map((s) => ({ id: s.id, label: s.label })),
  ];

  const saveStatuses = async (tenantId: string, newDefs: StatusDef[]) => {
    await mutation.mutateAsync({ tenantId, defs: newDefs });
  };

  return {
    statuses: resolved,
    map: map_,
    defs,
    ids: defs.map((d) => d.id),
    filterTabs,
    isLoading,
    saveStatuses,
    isSaving: mutation.isPending,
  };
}

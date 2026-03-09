/**
 * StatusConfigModal — Super-Admin status pipeline editor per tenant.
 *
 * Opened from Platform.tsx company cards.
 * Lets the super admin rename / recolour / reorder / add / remove statuses,
 * then persists them to `tenants.settings.lead_statuses`.
 */
import { useEffect, useState } from "react";
import {
  X,
  GripVertical,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  RotateCcw,
} from "lucide-react";
import { db } from "@/integrations/turso/db";
import { tenants as tenants_table } from "@/integrations/turso/schema";
import { eq } from "drizzle-orm";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  COLOUR_PRESETS,
  DEFAULT_LEAD_STATUSES,
  type StatusDef,
  type StatusColorKey,
} from "@/config/statusConfig";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRESET_KEYS = Object.keys(COLOUR_PRESETS) as StatusColorKey[];

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatusConfigModal({ tenantId, tenantName, onClose }: Props) {
  const qc = useQueryClient();
  const [statuses, setStatuses] = useState<StatusDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  // ── Load tenant's current config ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await db
          .select({ settings: tenants_table.settings })
          .from(tenants_table)
          .where(eq(tenants_table.id, tenantId))
          .limit(1);
        const settings = rows[0]?.settings as Record<string, unknown> | undefined;
        const raw = settings?.lead_statuses;
        if (!cancelled) {
          if (Array.isArray(raw) && raw.length > 0) {
            setStatuses(raw as StatusDef[]);
          } else {
            setStatuses(DEFAULT_LEAD_STATUSES.map((d) => ({ ...d })));
          }
        }
      } catch {
        if (!cancelled) setStatuses(DEFAULT_LEAD_STATUSES.map((d) => ({ ...d })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  // ── Mutations ─────────────────────────────────────────────────────
  const handleSave = async () => {
    // Validate: must have at least 2 statuses, all with non-empty labels
    if (statuses.length < 2) {
      toast.error("At least 2 statuses are required");
      return;
    }
    if (statuses.some((s) => !s.label.trim())) {
      toast.error("All statuses must have a label");
      return;
    }
    // Check duplicate ids
    const ids = statuses.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      toast.error("Duplicate status IDs detected");
      return;
    }

    setSaving(true);
    try {
      const rows = await db
        .select({ settings: tenants_table.settings })
        .from(tenants_table)
        .where(eq(tenants_table.id, tenantId))
        .limit(1);
      const existing = (rows[0]?.settings ?? {}) as Record<string, unknown>;
      const merged = { ...existing, lead_statuses: statuses };
      await db.update(tenants_table).set({ settings: merged }).where(eq(tenants_table.id, tenantId));
      qc.invalidateQueries({ queryKey: ["tenant-statuses"] });
      toast.success("Statuses saved for " + tenantName);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setStatuses(DEFAULT_LEAD_STATUSES.map((d) => ({ ...d })));
    toast("Reset to default statuses");
  };

  const updateLabel = (idx: number, label: string) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], label, id: slugify(label) || next[idx].id };
      return next;
    });
  };

  const updateColor = (idx: number, color: StatusColorKey) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], color };
      return next;
    });
    setPickerIndex(null);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setStatuses((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setStatuses((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const removeStatus = (idx: number) => {
    if (statuses.length <= 2) {
      toast.error("Minimum 2 statuses required");
      return;
    }
    setStatuses((prev) => prev.filter((_, i) => i !== idx));
  };

  const addStatus = () => {
    if (statuses.length >= 10) {
      toast.error("Maximum 10 statuses allowed");
      return;
    }
    // Pick a colour not yet used, or fall back to neutral
    const usedColors = new Set(statuses.map((s) => s.color));
    const nextColor = PRESET_KEYS.find((k) => !usedColors.has(k)) ?? "neutral";
    setStatuses((prev) => [
      ...prev,
      { id: `status_${Date.now()}`, label: "", color: nextColor },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground">Lead Status Pipeline</h2>
            <p className="text-[11px] text-foreground/40 mt-0.5">{tenantName}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-foreground/40 hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {statuses.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 group"
                >
                  {/* Grip */}
                  <GripVertical className="h-4 w-4 text-foreground/20 shrink-0" />

                  {/* Colour swatch */}
                  <div className="relative">
                    <button
                      onClick={() => setPickerIndex(pickerIndex === idx ? null : idx)}
                      className={`h-8 w-8 rounded-xl shrink-0 ring-2 ring-offset-2 ring-offset-card transition-shadow ${COLOUR_PRESETS[s.color]?.swatch ?? "bg-foreground/30"} ${
                        pickerIndex === idx ? "ring-primary" : "ring-transparent hover:ring-foreground/20"
                      }`}
                      title="Change colour"
                    />
                    {/* Colour picker popover */}
                    {pickerIndex === idx && (
                      <div className="absolute top-10 left-0 z-50 bg-card border border-border rounded-xl shadow-xl p-2 grid grid-cols-4 gap-1.5 w-36">
                        {PRESET_KEYS.map((key) => (
                          <button
                            key={key}
                            onClick={() => updateColor(idx, key)}
                            className={`h-7 w-7 rounded-lg flex items-center justify-center ${COLOUR_PRESETS[key].swatch} transition-transform hover:scale-110`}
                            title={COLOUR_PRESETS[key].label}
                          >
                            {s.color === key && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Label input */}
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    placeholder="Status name…"
                    className="flex-1 h-9 px-3 bg-muted/60 border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />

                  {/* ID badge */}
                  <span className="text-[10px] text-foreground/30 font-mono w-20 truncate text-right hidden sm:block" title={s.id}>
                    {s.id}
                  </span>

                  {/* Move buttons */}
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-foreground/30 hover:text-foreground hover:bg-accent transition-colors disabled:opacity-20 disabled:pointer-events-none"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === statuses.length - 1}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-foreground/30 hover:text-foreground hover:bg-accent transition-colors disabled:opacity-20 disabled:pointer-events-none"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => removeStatus(idx)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-foreground/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add button */}
              <button
                onClick={addStatus}
                className="w-full h-9 border border-dashed border-border rounded-xl text-foreground/40 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-primary/40 hover:text-primary transition-colors mt-3"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Status
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={resetToDefaults}
            className="h-9 px-3 text-xs font-medium text-foreground/50 hover:text-foreground flex items-center gap-1.5 rounded-xl hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 text-sm font-medium text-foreground/60 hover:text-foreground rounded-xl hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 bg-primary text-primary-foreground text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 btn-depth"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

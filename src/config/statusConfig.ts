/**
 * Lead Status Configuration — Shared across the entire app.
 *
 * Status definitions are per-tenant (stored in `tenants.settings.lead_statuses`).
 * Super Admin configures these from the Platform console.
 *
 * Components read the active config via the `useStatusConfig()` hook.
 * This module provides the default config, types, and colour presets.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatusDef {
  /** Machine key, e.g. "new" */
  id: string;
  /** Human label, e.g. "New" */
  label: string;
  /** Colour preset key – maps to COLOUR_PRESETS */
  color: StatusColorKey;
}

/** Fields resolved at runtime from a StatusDef + COLOUR_PRESETS */
export interface ResolvedStatus extends StatusDef {
  pill: string;
  dot: string;
  border: string;
  /** Kanban column colours */
  kanban: { color: string; bg: string; headerBg: string; border: string; dot: string; dropBg: string };
  /** Activity pill */
  activityPill: string;
  /** Icon emoji for Kanban header */
  icon: string;
  /** Hex colour for charts */
  hex: string;
}

export type StatusColorKey =
  | "neutral"
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "red"
  | "pink"
  | "cyan"
  | "orange"
  | "indigo"
  | "teal";

// ─── Colour Presets ───────────────────────────────────────────────────────────

export const COLOUR_PRESETS: Record<StatusColorKey, {
  pill: string;
  dot: string;
  border: string;
  kanbanColor: string;
  kanbanBg: string;
  kanbanBorder: string;
  kanbanDot: string;
  kanbanDropBg: string;
  activityPill: string;
  icon: string;
  /** For display in the config UI */
  swatch: string;
  label: string;
  /** Hex colour for charts (Recharts, etc.) */
  hex: string;
}> = {
  neutral: {
    pill: "bg-accent text-foreground",
    dot: "bg-foreground",
    border: "border-border",
    kanbanColor: "text-foreground",
    kanbanBg: "bg-muted/50 dark:bg-muted/30",
    kanbanBorder: "border-border/60",
    kanbanDot: "bg-foreground/70",
    kanbanDropBg: "bg-foreground/[0.02]",
    activityPill: "bg-accent text-foreground",
    icon: "🔵",
    swatch: "bg-foreground/60",
    label: "Neutral",
    hex: "#6b7280",
  },
  blue: {
    pill: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    dot: "bg-blue-500",
    border: "border-blue-200/60 dark:border-blue-800/60",
    kanbanColor: "text-blue-600 dark:text-blue-400",
    kanbanBg: "bg-blue-50/40 dark:bg-blue-950/20",
    kanbanBorder: "border-blue-200/40 dark:border-blue-800/50",
    kanbanDot: "bg-blue-500",
    kanbanDropBg: "bg-blue-50/30 dark:bg-blue-950/10",
    activityPill: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    icon: "📞",
    swatch: "bg-blue-500",
    label: "Blue",
    hex: "#3b82f6",
  },
  emerald: {
    pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60 dark:border-emerald-800/60",
    kanbanColor: "text-emerald-600 dark:text-emerald-400",
    kanbanBg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    kanbanBorder: "border-emerald-200/40 dark:border-emerald-800/50",
    kanbanDot: "bg-emerald-500",
    kanbanDropBg: "bg-emerald-50/30 dark:bg-emerald-950/10",
    activityPill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: "🔥",
    swatch: "bg-emerald-500",
    label: "Emerald",
    hex: "#10b981",
  },
  purple: {
    pill: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
    dot: "bg-purple-500",
    border: "border-purple-200/60 dark:border-purple-800/60",
    kanbanColor: "text-purple-600 dark:text-purple-400",
    kanbanBg: "bg-purple-50/40 dark:bg-purple-950/20",
    kanbanBorder: "border-purple-200/40 dark:border-purple-800/50",
    kanbanDot: "bg-purple-500",
    kanbanDropBg: "bg-purple-50/30 dark:bg-purple-950/10",
    activityPill: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
    icon: "✅",
    swatch: "bg-purple-500",
    label: "Purple",
    hex: "#8b5cf6",
  },
  amber: {
    pill: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-200/60 dark:border-amber-800/60",
    kanbanColor: "text-amber-600 dark:text-amber-400",
    kanbanBg: "bg-amber-50/40 dark:bg-amber-950/20",
    kanbanBorder: "border-amber-200/40 dark:border-amber-800/50",
    kanbanDot: "bg-amber-500",
    kanbanDropBg: "bg-amber-50/30 dark:bg-amber-950/10",
    activityPill: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    icon: "⏳",
    swatch: "bg-amber-500",
    label: "Amber",
    hex: "#f59e0b",
  },
  red: {
    pill: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    dot: "bg-red-500",
    border: "border-red-200/60 dark:border-red-800/60",
    kanbanColor: "text-red-600 dark:text-red-400",
    kanbanBg: "bg-red-50/40 dark:bg-red-950/20",
    kanbanBorder: "border-red-200/40 dark:border-red-800/50",
    kanbanDot: "bg-red-500",
    kanbanDropBg: "bg-red-50/30 dark:bg-red-950/10",
    activityPill: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    icon: "🚫",
    swatch: "bg-red-500",
    label: "Red",
    hex: "#ef4444",
  },
  pink: {
    pill: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400",
    dot: "bg-pink-500",
    border: "border-pink-200/60 dark:border-pink-800/60",
    kanbanColor: "text-pink-600 dark:text-pink-400",
    kanbanBg: "bg-pink-50/40 dark:bg-pink-950/20",
    kanbanBorder: "border-pink-200/40 dark:border-pink-800/50",
    kanbanDot: "bg-pink-500",
    kanbanDropBg: "bg-pink-50/30 dark:bg-pink-950/10",
    activityPill: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400",
    icon: "💖",
    swatch: "bg-pink-500",
    label: "Pink",
    hex: "#ec4899",
  },
  cyan: {
    pill: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400",
    dot: "bg-cyan-500",
    border: "border-cyan-200/60 dark:border-cyan-800/60",
    kanbanColor: "text-cyan-600 dark:text-cyan-400",
    kanbanBg: "bg-cyan-50/40 dark:bg-cyan-950/20",
    kanbanBorder: "border-cyan-200/40 dark:border-cyan-800/50",
    kanbanDot: "bg-cyan-500",
    kanbanDropBg: "bg-cyan-50/30 dark:bg-cyan-950/10",
    activityPill: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400",
    icon: "💎",
    swatch: "bg-cyan-500",
    label: "Cyan",
    hex: "#06b6d4",
  },
  orange: {
    pill: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
    dot: "bg-orange-500",
    border: "border-orange-200/60 dark:border-orange-800/60",
    kanbanColor: "text-orange-600 dark:text-orange-400",
    kanbanBg: "bg-orange-50/40 dark:bg-orange-950/20",
    kanbanBorder: "border-orange-200/40 dark:border-orange-800/50",
    kanbanDot: "bg-orange-500",
    kanbanDropBg: "bg-orange-50/30 dark:bg-orange-950/10",
    activityPill: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
    icon: "🟠",
    swatch: "bg-orange-500",
    label: "Orange",
    hex: "#f97316",
  },
  indigo: {
    pill: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
    dot: "bg-indigo-500",
    border: "border-indigo-200/60 dark:border-indigo-800/60",
    kanbanColor: "text-indigo-600 dark:text-indigo-400",
    kanbanBg: "bg-indigo-50/40 dark:bg-indigo-950/20",
    kanbanBorder: "border-indigo-200/40 dark:border-indigo-800/50",
    kanbanDot: "bg-indigo-500",
    kanbanDropBg: "bg-indigo-50/30 dark:bg-indigo-950/10",
    activityPill: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
    icon: "🔮",
    swatch: "bg-indigo-500",
    label: "Indigo",
    hex: "#6366f1",
  },
  teal: {
    pill: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
    dot: "bg-teal-500",
    border: "border-teal-200/60 dark:border-teal-800/60",
    kanbanColor: "text-teal-600 dark:text-teal-400",
    kanbanBg: "bg-teal-50/40 dark:bg-teal-950/20",
    kanbanBorder: "border-teal-200/40 dark:border-teal-800/50",
    kanbanDot: "bg-teal-500",
    kanbanDropBg: "bg-teal-50/30 dark:bg-teal-950/10",
    activityPill: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
    icon: "🌊",
    swatch: "bg-teal-500",
    label: "Teal",
    hex: "#14b8a6",
  },
};

// ─── Default Status Config ────────────────────────────────────────────────────

/** Default 4-stage pipeline shipped with every new tenant */
export const DEFAULT_LEAD_STATUSES: StatusDef[] = [
  { id: "new",        label: "New",        color: "neutral" },
  { id: "contacted",  label: "Contacted",  color: "blue" },
  { id: "interested", label: "Interested", color: "emerald" },
  { id: "closed",     label: "Closed",     color: "purple" },
];

// ─── Resolver ─────────────────────────────────────────────────────────────────

/** Resolve a StatusDef list into fully-resolved statuses with all Tailwind classes */
export function resolveStatuses(defs: StatusDef[]): ResolvedStatus[] {
  return defs.map((def) => {
    const preset = COLOUR_PRESETS[def.color] ?? COLOUR_PRESETS.neutral;
    return {
      ...def,
      pill: preset.pill,
      dot: preset.dot,
      border: preset.border,
      kanban: {
        color: preset.kanbanColor,
        bg: preset.kanbanBg,
        headerBg: "bg-card",
        border: preset.kanbanBorder,
        dot: preset.kanbanDot,
        dropBg: preset.kanbanDropBg,
      },
      activityPill: preset.activityPill,
      icon: preset.icon,
      hex: preset.hex,
    };
  });
}

/** Build a lookup map by status id */
export function statusMap(statuses: ResolvedStatus[]): Record<string, ResolvedStatus> {
  const map: Record<string, ResolvedStatus> = {};
  for (const s of statuses) map[s.id] = s;
  return map;
}

/** The serialisable shape stored in tenants.settings.lead_statuses */
export type TenantStatusConfig = StatusDef[];

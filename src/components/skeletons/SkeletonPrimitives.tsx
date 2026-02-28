/**
 * Skeleton primitives — small composable building blocks.
 * Uses the enhanced <Skeleton /> with shimmer from ui/skeleton.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ─── Stat Card ────────────────────────────────── */
export const SkeletonStatCard = () => (
  <div className="surface-card p-4 flex items-center gap-4">
    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-6 w-16 rounded-md" />
      <Skeleton className="h-2.5 w-20 rounded-full" />
    </div>
  </div>
);

/* ─── Stats Row (n cards in a grid) ────────────── */
export const SkeletonStatsRow = ({ count = 4, cols }: { count?: number; cols?: string }) => (
  <div className={cn("grid gap-4 mb-6", cols ?? (count === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"))}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStatCard key={i} />
    ))}
  </div>
);

/* ─── Page Header (title + subtitle) ──────────── */
export const SkeletonPageHeader = ({ withButton = false }: { withButton?: boolean }) => (
  <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
    <div className="space-y-2">
      <Skeleton className="h-6 w-48 rounded-lg" />
      <Skeleton className="h-3.5 w-64 rounded-full" />
    </div>
    {withButton && <Skeleton className="h-10 w-32 rounded-xl shrink-0" />}
  </div>
);

/* ─── Section Header (card title row) ─────────── */
export const SkeletonSectionHeader = () => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-28 rounded-md" />
    </div>
    <Skeleton className="h-5 w-12 rounded-md" />
  </div>
);

/* ─── BentoCard wrapper ───────────────────────── */
export const SkeletonBentoCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("surface-card p-5", className)}>{children}</div>
);

/* ─── Table Row ───────────────────────────────── */
export const SkeletonTableRow = ({ cols = 5 }: { cols?: number }) => (
  <div className="flex items-center gap-4 py-3 px-2 border-b border-foreground/[0.04] last:border-0">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Skeleton className="h-7 w-7 rounded-full shrink-0" />
      <Skeleton className="h-3.5 w-24 rounded-md" />
    </div>
    {Array.from({ length: cols - 1 }).map((_, i) => (
      <Skeleton key={i} className="h-3.5 w-12 rounded-md shrink-0" />
    ))}
  </div>
);

/* ─── Activity Feed Item ──────────────────────── */
export const SkeletonActivityItem = () => (
  <div className="flex items-start gap-3">
    <Skeleton className="h-2 w-2 mt-[7px] rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3 w-full max-w-[280px] rounded-md" />
      <Skeleton className="h-2.5 w-16 rounded-full" />
    </div>
  </div>
);

/* ─── Lead Card (Kanban) ──────────────────────── */
export const SkeletonLeadCard = () => (
  <div className="surface-card p-3.5 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-3.5 w-28 rounded-md" />
      <Skeleton className="h-4 w-10 rounded-md" />
    </div>
    <div className="flex items-center gap-1.5">
      <Skeleton className="h-3 w-3 rounded" />
      <Skeleton className="h-2.5 w-24 rounded-full" />
    </div>
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/40">
      <Skeleton className="h-5 w-5 rounded-full shrink-0" />
      <Skeleton className="h-2.5 w-20 rounded-full" />
    </div>
    <div className="flex items-center justify-between pt-2.5 border-t border-foreground/[0.04]">
      <Skeleton className="h-2.5 w-14 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </div>
  </div>
);

/* ─── Lead Card (List — MyLeads style) ────────── */
export const SkeletonLeadListCard = () => (
  <div className="surface-card p-4">
    <div className="flex items-start gap-3 pl-3">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-2.5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-3 w-16 rounded-md" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-2.5 w-14 rounded-full" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Leaderboard Row ─────────────────────────── */
export const SkeletonLeaderboardRow = () => (
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
    <Skeleton className="h-3 w-5 rounded" />
    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
    <Skeleton className="h-3.5 w-28 rounded-md flex-1" />
    <div className="text-right space-y-1">
      <Skeleton className="h-3 w-14 rounded-md ml-auto" />
      <Skeleton className="h-2.5 w-12 rounded-full ml-auto" />
    </div>
  </div>
);

/* ─── Chart Placeholder ───────────────────────── */
export const SkeletonChart = ({ height = "h-48" }: { height?: string }) => (
  <div className={cn("w-full rounded-lg overflow-hidden", height)}>
    <div className="h-full flex items-end gap-2 px-4 pb-4">
      {[40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 65, 55].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-md"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

/* ─── Donut / Radial Placeholder ──────────────── */
export const SkeletonDonut = () => (
  <div className="flex items-center justify-center py-4">
    <Skeleton className="h-32 w-32 rounded-full" />
  </div>
);

/* ─── Search Bar ──────────────────────────────── */
export const SkeletonSearchBar = () => (
  <Skeleton className="h-10 w-full rounded-xl" />
);

/* ─── Filter Tabs ─────────────────────────────── */
export const SkeletonFilterTabs = ({ count = 5 }: { count?: number }) => (
  <div className="flex items-center gap-2 border-b border-border pb-0">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-20 rounded-lg shrink-0" />
    ))}
  </div>
);

/* ─── Team Table Row (full-width grid) ────────── */
export const SkeletonTeamTableRow = () => (
  <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 items-center py-3.5 border-b border-foreground/[0.04]">
    {/* Member */}
    <div className="flex items-center gap-3.5 px-5 min-w-0">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-2 w-36 rounded-full" />
      </div>
    </div>
    {/* Status */}
    <div className="px-3">
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    {/* Leads */}
    <div className="px-3 space-y-1.5">
      <Skeleton className="h-3.5 w-8 rounded-md" />
      <div className="flex gap-1">
        <Skeleton className="h-4 w-14 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
      </div>
    </div>
    {/* Conversion */}
    <div className="px-3 flex items-center gap-2">
      <Skeleton className="h-3.5 w-10 rounded-md" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    {/* Calls */}
    <div className="px-3 space-y-1.5">
      <Skeleton className="h-3.5 w-10 rounded-md" />
      <Skeleton className="h-2 w-8 rounded-full" />
    </div>
    {/* Talk Time */}
    <div className="px-3 space-y-1.5">
      <Skeleton className="h-3.5 w-12 rounded-md" />
      <Skeleton className="h-2 w-8 rounded-full" />
    </div>
    {/* Joined */}
    <div className="px-3">
      <Skeleton className="h-3 w-10 rounded-md" />
    </div>
    {/* Actions */}
    <div className="px-2">
      <Skeleton className="h-7 w-7 rounded-lg" />
    </div>
  </div>
);

/* ─── Top Performer Card ──────────────────────── */
export const SkeletonPerformerCard = () => (
  <div className="surface-card p-4">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-24 rounded-md" />
        <Skeleton className="h-2 w-32 rounded-full" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center px-2 py-1.5 rounded-lg bg-muted">
          <Skeleton className="h-4 w-8 rounded-md mx-auto mb-1" />
          <Skeleton className="h-2 w-10 rounded-full mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

/* ─── Kanban Column ───────────────────────────── */
export const SkeletonKanbanColumn = ({ cardCount = 3 }: { cardCount?: number }) => (
  <div className="flex flex-col rounded-xl border border-border bg-card min-h-0 h-full" style={{ minWidth: "240px" }}>
    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
      <Skeleton className="h-4 w-6 rounded-full" />
    </div>
    <div className="flex flex-col gap-2.5 p-2.5 flex-1 overflow-hidden">
      {Array.from({ length: cardCount }).map((_, i) => (
        <SkeletonLeadCard key={i} />
      ))}
    </div>
  </div>
);

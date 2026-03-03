/**
 * Full-page skeleton screens that mirror the exact layout of each page.
 * These are inserted as the loading state so the UI feels instant.
 */
import {
  SkeletonPageHeader,
  SkeletonStatsRow,
  SkeletonSectionHeader,
  SkeletonBentoCard,
  SkeletonTableRow,
  SkeletonActivityItem,
  SkeletonChart,
  SkeletonDonut,
  SkeletonLeaderboardRow,
  SkeletonLeadListCard,
  SkeletonSearchBar,
  SkeletonFilterTabs,
  SkeletonTeamTableRow,
  SkeletonPerformerCard,
  SkeletonKanbanColumn,
} from "./SkeletonPrimitives";
import { Skeleton } from "@/components/ui/skeleton";

/* ═══════════════════════════════════════════════════
   1. ADMIN DASHBOARD
   Header → 4 stat cards → BDA table + activity → chart
   ═══════════════════════════════════════════════════ */
export const AdminDashboardSkeleton = () => (
  <div className="flex flex-col md:h-full md:min-h-0 animate-fade-in">
    <div className="shrink-0">
      <SkeletonPageHeader withButton />
      <SkeletonStatsRow count={4} />
    </div>

    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container pb-6">
      {/* BDA Table + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <SkeletonBentoCard className="xl:col-span-2">
          <SkeletonSectionHeader />
          {/* Table header shimmer */}
          <div className="flex items-center gap-4 py-2 px-2 mb-2 border-b border-border">
            {["w-24", "w-10", "w-10", "w-10", "w-14"].map((w, i) => (
              <Skeleton key={i} className={`h-2.5 ${w} rounded-full`} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTableRow key={i} cols={5} />
          ))}
        </SkeletonBentoCard>

        <SkeletonBentoCard>
          <SkeletonSectionHeader />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonActivityItem key={i} />
            ))}
          </div>
        </SkeletonBentoCard>
      </div>

      {/* Conversion chart */}
      <SkeletonBentoCard>
        <SkeletonSectionHeader />
        <SkeletonChart height="h-52" />
      </SkeletonBentoCard>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   2. BDA DASHBOARD
   Header → 4 stat cards → Leaderboard + right column
   ═══════════════════════════════════════════════════ */
export const BdaDashboardSkeleton = () => (
  <div className="flex flex-col md:h-full md:min-h-0 animate-fade-in">
    <div className="shrink-0">
      <SkeletonPageHeader withButton />
      <SkeletonStatsRow count={4} />
    </div>

    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Leaderboard */}
        <SkeletonBentoCard className="lg:col-span-2">
          <SkeletonSectionHeader />
          <div className="space-y-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLeaderboardRow key={i} />
            ))}
          </div>
        </SkeletonBentoCard>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Talk Time */}
          <SkeletonBentoCard>
            <SkeletonSectionHeader />
            <SkeletonDonut />
          </SkeletonBentoCard>

          {/* Activity */}
          <SkeletonBentoCard>
            <SkeletonSectionHeader />
            <div className="space-y-3.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonActivityItem key={i} />
              ))}
            </div>
          </SkeletonBentoCard>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   3. ADMIN LEADS (Kanban Board)
   Header → Team workload bar → Search + Stats → Columns
   ═══════════════════════════════════════════════════ */
export const AdminLeadsSkeleton = () => (
  <div className="flex flex-col h-full min-h-0 animate-fade-in">
    <div className="shrink-0 space-y-4 pb-4">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-3.5 w-52 rounded-full" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
      </div>

      {/* Team workload pills */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
        <div className="flex gap-2 flex-1 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Search + sort bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-xs rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>

    {/* Kanban columns */}
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="flex gap-3 h-full overflow-x-auto pb-4">
        <SkeletonKanbanColumn cardCount={3} />
        <SkeletonKanbanColumn cardCount={2} />
        <SkeletonKanbanColumn cardCount={2} />
        <SkeletonKanbanColumn cardCount={1} />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   4. MY LEADS (BDA Pipeline — Split Pane)
   Left: List header + search + tabs + lead rows
   Right: Detail panel with stats & timeline
   ═══════════════════════════════════════════════════ */
export const MyLeadsSkeleton = () => (
  <div className="flex h-full min-h-0 -mx-4 sm:-mx-6 -mt-6 border border-border rounded-xl overflow-hidden bg-card animate-fade-in">
    {/* Left panel */}
    <div className="flex flex-col w-full md:w-[380px] lg:w-[420px] md:shrink-0 md:border-r border-border bg-card h-full min-h-0">
      <div className="shrink-0 px-4 pt-4 pb-0 space-y-3">
        {/* Title + stats */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-12 rounded-lg" />
            <Skeleton className="h-6 w-14 rounded-lg" />
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>

        {/* Search */}
        <SkeletonSearchBar />

        {/* Filter tabs */}
        <SkeletonFilterTabs count={5} />
      </div>

      {/* Lead rows */}
      <div className="flex-1 overflow-hidden min-h-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-2.5 w-10 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Right panel — hidden on mobile */}
    <div className="hidden md:flex flex-1 min-w-0 flex-col h-full">
      {/* Detail header */}
      <div className="shrink-0 border-b border-border bg-card px-5 py-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <div className="flex items-center gap-2 mt-1">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded-full shrink-0" />
        </div>
      </div>

      {/* Stats strip */}
      <div className="shrink-0 grid grid-cols-4 gap-px bg-border border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card p-3 flex flex-col items-center gap-1.5">
            <Skeleton className="h-3.5 w-3.5 rounded" />
            <Skeleton className="h-4 w-10 rounded-md" />
            <Skeleton className="h-2 w-8 rounded-full" />
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-10 rounded-full" />
                </div>
                <Skeleton className="h-3 w-14 rounded-md" />
              </div>
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-xl shrink-0" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   5. TEAM MANAGEMENT
   Header → Top performers → Search/Filter → Table rows
   ═══════════════════════════════════════════════════ */
export const TeamManagementSkeleton = () => (
  <div className="flex flex-col md:h-full md:min-h-0 animate-fade-in">
    <div className="shrink-0 mb-6">
      {/* Page header */}
      <SkeletonPageHeader withButton />

      {/* Top performers */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3.5 w-28 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SkeletonPerformerCard />
          <SkeletonPerformerCard />
          <SkeletonPerformerCard />
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <SkeletonSearchBar />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg shrink-0" />
          ))}
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="md:flex-1 md:min-h-0 flex flex-col pb-4">
      <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden md:flex-1 md:min-h-0">
        {/* Table header */}
        <div className="shrink-0 border-b border-border">
          <div className="overflow-hidden">
            <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 min-w-[900px]">
              {["w-16", "w-12", "w-10", "w-18", "w-10", "w-16", "w-12", "w-4"].map((w, i) => (
                <div key={i} className="px-5 py-3">
                  <Skeleton className={`h-2.5 ${w} rounded-full`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-hidden min-w-[900px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonTeamTableRow key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

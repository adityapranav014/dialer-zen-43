import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Phone,
  ArrowRight,
  Clock,
  Hash,
  X,
  UserCheck,
} from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useTeam, type TeamMember } from "@/hooks/useTeam";
import { useAuth } from "@/hooks/useAuth";

// ─── Status badge config ──────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  contacted: { label: "Contacted", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  interested: { label: "Interested", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  closed: { label: "Closed", color: "text-foreground", bg: "bg-muted" },
};

// ─── Search result type ───────────────────────────────────────────────
type ResultCategory = "leads" | "team";

interface SearchResult {
  id: string;
  category: ResultCategory;
  label: string;
  desc: string;
  icon: typeof Search;
  iconBg: string;
  iconColor: string;
  path: string;
  meta?: string;
}

// ─── Recents (persisted in localStorage) ──────────────────────────────
const RECENTS_KEY = "dialflow_recent_searches";
const MAX_RECENTS = 5;

function getRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const recents = getRecents().filter((r) => r !== term);
  recents.unshift(term);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

function clearRecents() {
  localStorage.removeItem(RECENTS_KEY);
}

// ─── Component ────────────────────────────────────────────────────────
const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recents, setRecents] = useState<string[]>(getRecents);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { allLeads } = useLeads();
  const { members: teamMembers } = useTeam();

  // ── Keyboard shortcut ⌘K / Ctrl+K ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIdx(0);
    } else {
      setRecents(getRecents());
    }
  }, [open]);

  // ── Build results ────────────────────────────────────────────────────
  const results: SearchResult[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const out: SearchResult[] = [];

    // 1. Leads
    const matchedLeads = (allLeads || [])
      .filter(
        (l: Lead) =>
          l.name.toLowerCase().includes(q) || l.phone.includes(q),
      )
      .slice(0, 6);

    matchedLeads.forEach((l: Lead) => {
      const s = statusConfig[l.status] || statusConfig.new;
      out.push({
        id: `lead-${l.id}`,
        category: "leads",
        label: l.name,
        desc: l.phone,
        icon: Phone,
        iconBg: s.bg,
        iconColor: s.color,
        path: "/leads",
        meta: s.label,
      });
    });

    // 2. Team members (admin only)
    if (isAdmin) {
      const matchedTeam = (teamMembers || [])
        .filter((m: TeamMember) =>
          m.name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.phone?.includes(q),
        )
        .slice(0, 4);

      matchedTeam.forEach((m: TeamMember) => {
        out.push({
          id: `team-${m.id}`,
          category: "team",
          label: m.name || "Unknown",
          desc: m.email || "BDA Agent",
          icon: UserCheck,
          iconBg: "bg-purple-50 dark:bg-purple-950/30",
          iconColor: "text-purple-500",
          path: "/team",
        });
      });
    }

    return out;
  }, [query, allLeads, teamMembers, isAdmin]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-search-idx="${selectedIdx}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIdx]);

  // ── Navigate to result & open detail popup ─────────────────────────
  const selectResult = useCallback(
    (result: SearchResult) => {
      if (query.trim()) saveRecent(query.trim());
      setOpen(false);

      // Extract the raw entity ID (strip "lead-" / "team-" prefix)
      const entityId = result.id.replace(/^(lead|team)-/, "");

      // Store pending detail so the target page can open the popup
      // (covers cross-page navigation where the target component isn't mounted yet)
      if (result.category === "leads") {
        sessionStorage.setItem("dialflow_pending_action", "open-lead-detail");
        sessionStorage.setItem("dialflow_pending_detail_id", entityId);
      } else if (result.category === "team") {
        sessionStorage.setItem("dialflow_pending_action", "open-team-detail");
        sessionStorage.setItem("dialflow_pending_detail_id", entityId);
      }

      navigate(result.path);

      // Also dispatch a custom event for same-page navigation
      // (component already mounted → useEffect won't re-fire)
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("dialflow-open-detail", {
            detail: { type: result.category, id: entityId },
          }),
        );
      }, 50);
    },
    [navigate, query],
  );

  // ── Keyboard nav ───────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        e.preventDefault();
        selectResult(results[selectedIdx]);
      }
    },
    [results, selectedIdx, selectResult],
  );

  // ── Group results by category ──────────────────────────────────────
  const groupedResults = useMemo(() => {
    const groups: { key: ResultCategory; label: string; icon: typeof Search; items: SearchResult[] }[] = [];
    const catMap: Record<ResultCategory, { label: string; icon: typeof Search }> = {
      leads: { label: "Leads", icon: Users },
      team: { label: "Team Members", icon: UserCheck },
    };

    let idx = 0;
    for (const cat of ["leads", "team"] as ResultCategory[]) {
      const items = results.filter((r) => r.category === cat);
      if (items.length > 0) {
        groups.push({ key: cat, ...catMap[cat], items: items.map((item) => ({ ...item, _idx: idx++ } as any)) });
      }
    }
    return groups;
  }, [results]);

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && results.length === 0;

  return (
    <>
      {/* Desktop trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2.5 h-9 pl-3 pr-2.5 min-w-[210px] rounded-xl border border-border bg-card hover:bg-accent/60 text-foreground/40 hover:text-foreground/60 transition-all duration-200 shadow-sm"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left text-[13px] font-medium">Search…</span>
        <span className="flex items-center gap-0.5">
          <kbd className="text-[10px] font-semibold text-foreground/35 border border-border rounded-md px-1.5 py-0.5 bg-accent leading-none">⌘</kbd>
          <kbd className="text-[10px] font-semibold text-foreground/35 border border-border rounded-md px-1.5 py-0.5 bg-accent leading-none">K</kbd>
        </span>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden h-8 w-8 rounded-xl flex items-center justify-center bg-accent/60 hover:bg-accent border border-border text-foreground/50 hover:text-foreground transition-all duration-200"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="search-overlay bg-black/50 backdrop-blur-sm !animate-none" />
          <DialogPrimitive.Content
            className="search-modal fixed left-[50%] top-[12%] sm:top-[18%] z-50 w-[calc(100vw-32px)] max-w-[560px] rounded-2xl border border-border/80 shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4),0_2px_12px_rgba(0,0,0,0.2)] bg-card overflow-hidden outline-none"
          >
            <DialogTitle className="sr-only">Global Search</DialogTitle>

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 sm:px-5 h-14 border-b border-border/60">
              <Search className="h-4 w-4 text-foreground/35 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search leads, team members, phone numbers…"
                autoFocus
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground/30 focus:outline-none font-medium leading-none"
              />
              {hasQuery ? (
                <button
                  onClick={() => setQuery("")}
                  className="h-5 w-5 rounded-full flex items-center justify-center bg-foreground/8 hover:bg-foreground/15 text-foreground/40 hover:text-foreground/60 transition-colors duration-150 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              ) : (
                <kbd className="hidden sm:block text-[10px] font-semibold text-foreground/25 border border-border/60 rounded-md px-1.5 py-0.5 bg-accent/60 leading-none shrink-0">ESC</kbd>
              )}
            </div>

          {/* Results area */}
          <div ref={listRef} className="max-h-[min(60vh,440px)] overflow-y-auto scroll-container">

            {/* ── Empty state: no query — show recents & suggestions ── */}
            {!hasQuery && (
              <div className="py-2">
                {/* Recent searches */}
                {recents.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-foreground/45 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </p>
                      <button
                        onClick={() => { clearRecents(); setRecents([]); }}
                        className="text-[10px] font-medium text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    {recents.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent transition-colors duration-200 group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent/80 transition-colors duration-200">
                          <Clock className="h-3 w-3 text-foreground/45" />
                        </div>
                        <span className="text-[13px] text-foreground/60 font-medium">{term}</span>
                        <ArrowRight className="h-3 w-3 text-foreground/15 ml-auto group-hover:text-foreground/40 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}


              </div>
            )}

            {/* ── No results ── */}
            {noResults && (
              <div className="flex flex-col items-center justify-center py-14 px-6">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-4">
                  <Search className="h-5 w-5 text-foreground/40" />
                </div>
                <p className="text-sm font-bold text-foreground/50 mb-1">
                  No results for "{query}"
                </p>
                <p className="text-[12px] text-foreground/45 text-center max-w-[240px]">
                  Try searching for lead names, phone numbers, or pages like "dashboard".
                </p>
              </div>
            )}

            {/* ── Grouped results ── */}
            {hasQuery && results.length > 0 && (
              <div className="py-2">
                {groupedResults.map((group) => (
                  <div key={group.key} className="px-2 py-1">
                    <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-foreground/45 flex items-center gap-1.5">
                      <group.icon className="h-3 w-3" />
                      {group.label}
                      <span className="ml-auto bg-accent rounded px-1.5 py-0.5 text-[10px] font-semibold text-foreground/40">
                        {group.items.length}
                      </span>
                    </p>
                    {group.items.map((result: any) => {
                      const itemIdx = result._idx as number;
                      const isSelected = itemIdx === selectedIdx;
                      const Icon = result.icon;
                      return (
                        <button
                          key={result.id}
                          data-search-idx={itemIdx}
                          onClick={() => selectResult(result)}
                          onMouseEnter={() => setSelectedIdx(itemIdx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 group ${
                            isSelected ? "bg-accent" : "hover:bg-muted"
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-xl ${result.iconBg} flex items-center justify-center shrink-0 transition-colors`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${result.iconColor}`} />
                          </div>
                          <div className="min-w-0 text-left flex-1">
                            <p className="text-[13px] font-medium text-foreground truncate">
                              {result.label}
                            </p>
                            <p className="text-[10px] text-foreground/45 truncate">{result.desc}</p>
                          </div>
                          {result.meta && (
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                statusConfig[result.meta.toLowerCase()]?.bg || "bg-muted"
                              } ${statusConfig[result.meta.toLowerCase()]?.color || "text-foreground/40"}`}
                            >
                              {result.meta}
                            </span>
                          )}
                          <ArrowRight
                            className={`h-3 w-3 shrink-0 transition-colors ${
                              isSelected ? "text-foreground/40" : "text-foreground/10"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between px-4 sm:px-5 h-9 border-t border-border/50 bg-accent/30">
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-foreground/30 font-medium">
                <kbd className="px-1 py-px rounded border border-border/60 bg-card text-[9px] font-bold leading-none">↑↓</kbd>
                Navigate
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-foreground/30 font-medium">
                <kbd className="px-1 py-px rounded border border-border/60 bg-card text-[9px] font-bold leading-none">↵</kbd>
                Open
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-foreground/30 font-medium">
                <kbd className="px-1 py-px rounded border border-border/60 bg-card text-[9px] font-bold leading-none">ESC</kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-medium">
              <Hash className="h-2.5 w-2.5" />
              {results.length > 0 ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "DialFlow Search"}
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export default GlobalSearch;

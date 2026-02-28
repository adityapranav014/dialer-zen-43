import { useEffect, useState, useCallback, useMemo } from "react";
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
        className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-muted hover:bg-accent text-sm text-foreground/40 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="font-medium">Search…</span>
        <kbd className="ml-4 text-[10px] font-semibold text-foreground/25 border border-border rounded px-1 py-0.5 bg-card">
          ⌘K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted text-foreground/50 transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/50" />
          <DialogPrimitive.Content
            className="fixed left-[50%] translate-x-[-50%] top-[12%] sm:top-[18%] z-50 w-[calc(100vw-32px)] max-w-[560px] rounded-2xl border border-border shadow-2xl bg-card overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 outline-none"
          >
            <DialogTitle className="sr-only">Global Search</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 sm:px-5 h-14 border-b border-border">
            <Search className="h-4 w-4 text-foreground/30 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search leads, actions, team…"
              autoFocus
              className="flex-1 text-sm text-foreground placeholder:text-foreground/30 bg-transparent outline-none font-medium"
            />
            {hasQuery && (
              <button
                onClick={() => setQuery("")}
                className="h-5 w-5 rounded flex items-center justify-center text-foreground/25 hover:text-foreground/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results area */}
          <div className="max-h-[min(60vh,440px)] overflow-y-auto scroll-container">

            {/* ── Empty state: no query — show recents & suggestions ── */}
            {!hasQuery && (
              <div className="py-2">
                {/* Recent searches */}
                {recents.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/30 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </p>
                      <button
                        onClick={() => { clearRecents(); setRecents([]); }}
                        className="text-[10px] font-medium text-foreground/25 hover:text-foreground/50 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    {recents.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                          <Clock className="h-3 w-3 text-foreground/30" />
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
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-5 w-5 text-foreground/20" />
                </div>
                <p className="text-sm font-semibold text-foreground/50 mb-1">
                  No results for "{query}"
                </p>
                <p className="text-[12px] text-foreground/30 text-center max-w-[240px]">
                  Try searching for lead names, phone numbers, or pages like "dashboard".
                </p>
              </div>
            )}

            {/* ── Grouped results ── */}
            {hasQuery && results.length > 0 && (
              <div className="py-2">
                {groupedResults.map((group) => (
                  <div key={group.key} className="px-2 py-1">
                    <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-foreground/30 flex items-center gap-1.5">
                      <group.icon className="h-3 w-3" />
                      {group.label}
                      <span className="ml-auto bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold text-foreground/25">
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
                          onClick={() => selectResult(result)}
                          onMouseEnter={() => setSelectedIdx(itemIdx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                            isSelected ? "bg-accent" : "hover:bg-muted"
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-lg ${result.iconBg} flex items-center justify-center shrink-0 transition-colors`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${result.iconColor}`} />
                          </div>
                          <div className="min-w-0 text-left flex-1">
                            <p className="text-[13px] font-medium text-foreground truncate">
                              {result.label}
                            </p>
                            <p className="text-[10px] text-foreground/30 truncate">{result.desc}</p>
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
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-border bg-muted">
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-foreground/25 font-medium">
                <kbd className="px-1 py-0.5 rounded border border-border bg-card text-[9px] font-semibold">↑↓</kbd>
                Navigate
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-foreground/25 font-medium">
                <kbd className="px-1 py-0.5 rounded border border-border bg-card text-[9px] font-semibold">↵</kbd>
                Select
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-foreground/25 font-medium">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[9px] font-semibold">ESC</kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/20 font-medium">
              <Hash className="h-3 w-3" />
              {results.length > 0 ? `${results.length} results` : "Search DialFlow"}
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export default GlobalSearch;

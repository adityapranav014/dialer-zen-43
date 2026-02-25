import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  UserPlus,
  BarChart3,
  LayoutDashboard,
  Phone,
  ArrowRight,
  Clock,
  Sparkles,
  Hash,
  X,
  UserCheck,
  UsersRound,
  Zap,
} from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useUsers, type Profile } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";

// ─── Status badge config ──────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue-600", bg: "bg-blue-50" },
  contacted: { label: "Contacted", color: "text-amber-600", bg: "bg-amber-50" },
  interested: { label: "Interested", color: "text-emerald-600", bg: "bg-emerald-50" },
  closed: { label: "Closed", color: "text-[#1f1f1f]", bg: "bg-[#f4f4f4]" },
};

// ─── Quick actions ────────────────────────────────────────────────────
interface QuickAction {
  id: string;
  label: string;
  desc: string;
  icon: typeof Search;
  iconBg: string;
  iconColor: string;
  path: string;
  keywords: string[];
}

const quickActions: QuickAction[] = [
  {
    id: "go-dashboard",
    label: "Go to Dashboard",
    desc: "Overview, stats & activity feed",
    icon: LayoutDashboard,
    iconBg: "bg-[#f6f7ed]",
    iconColor: "text-[#1f1f1f]",
    path: "/dashboard",
    keywords: ["dashboard", "home", "overview", "stats"],
  },
  {
    id: "go-leads",
    label: "Go to Leads",
    desc: "View and manage all leads",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    path: "/leads",
    keywords: ["leads", "contacts", "pipeline", "prospects"],
  },
  {
    id: "go-analytics",
    label: "Go to Analytics",
    desc: "Performance metrics & charts",
    icon: BarChart3,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    path: "/analytics",
    keywords: ["analytics", "reports", "charts", "performance", "metrics"],
  },
  {
    id: "go-team",
    label: "Go to Team",
    desc: "BDA management & performance",
    icon: UsersRound,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    path: "/team",
    keywords: ["team", "bda", "agents", "members", "staff", "people"],
  },
  {
    id: "new-lead",
    label: "Add New Lead",
    desc: "Create a new lead entry",
    icon: UserPlus,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    path: "/leads",
    keywords: ["new", "add", "create", "lead"],
  },
  {
    id: "new-bda",
    label: "Add Team Member",
    desc: "Add a new BDA to the team",
    icon: UserPlus,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    path: "/team",
    keywords: ["new", "add", "create", "bda", "member", "team", "agent", "hire"],
  },
];

// ─── Search result type ───────────────────────────────────────────────
type ResultCategory = "actions" | "leads" | "team";

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
  const { bdas } = useUsers();

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

    // 1. Quick actions
    quickActions.forEach((a) => {
      if (
        a.label.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.includes(q))
      ) {
        out.push({
          id: a.id,
          category: "actions",
          label: a.label,
          desc: a.desc,
          icon: a.icon,
          iconBg: a.iconBg,
          iconColor: a.iconColor,
          path: a.path,
        });
      }
    });

    // 2. Leads
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

    // 3. Team members (admin only)
    if (isAdmin) {
      const matchedTeam = (bdas || [])
        .filter((p: Profile) =>
          p.display_name?.toLowerCase().includes(q),
        )
        .slice(0, 4);

      matchedTeam.forEach((p: Profile) => {
        out.push({
          id: `team-${p.id}`,
          category: "team",
          label: p.display_name || "Unknown",
          desc: "BDA Agent",
          icon: UserCheck,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-500",
          path: "/dashboard",
        });
      });
    }

    return out;
  }, [query, allLeads, bdas, isAdmin]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  // ── Navigate to result ──────────────────────────────────────────────
  const selectResult = useCallback(
    (result: SearchResult) => {
      if (query.trim()) saveRecent(query.trim());
      setOpen(false);
      navigate(result.path);
      if (result.id === "new-lead") {
        setTimeout(() => window.dispatchEvent(new CustomEvent("open-add-lead-modal")), 100);
      }
      if (result.id === "new-bda") {
        setTimeout(() => window.dispatchEvent(new CustomEvent("open-add-bda-modal")), 100);
      }
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
      actions: { label: "Quick Actions", icon: Zap },
      leads: { label: "Leads", icon: Users },
      team: { label: "Team Members", icon: UserCheck },
    };

    let idx = 0;
    for (const cat of ["actions", "leads", "team"] as ResultCategory[]) {
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
        className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-black/[0.08] bg-[#f4f4f4] hover:bg-[#f6f7ed] text-sm text-[#1f1f1f]/40 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="font-medium">Search…</span>
        <kbd className="ml-4 text-[10px] font-semibold text-[#1f1f1f]/25 border border-black/[0.08] rounded px-1 py-0.5 bg-white">
          ⌘K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#f4f4f4] text-[#1f1f1f]/50 transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/50" />
          <DialogPrimitive.Content
            className="fixed left-[50%] translate-x-[-50%] top-[12%] sm:top-[18%] z-50 w-[calc(100vw-32px)] max-w-[560px] rounded-2xl border border-black/[0.06] shadow-2xl bg-white overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 outline-none"
          >
            <DialogTitle className="sr-only">Global Search</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 sm:px-5 h-14 border-b border-black/[0.06]">
            <Search className="h-4 w-4 text-[#1f1f1f]/30 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search leads, actions, team…"
              autoFocus
              className="flex-1 text-sm text-[#1f1f1f] placeholder:text-[#1f1f1f]/30 bg-transparent outline-none font-medium"
            />
            {hasQuery && (
              <button
                onClick={() => setQuery("")}
                className="h-5 w-5 rounded flex items-center justify-center text-[#1f1f1f]/25 hover:text-[#1f1f1f]/60 transition-colors"
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
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[#1f1f1f]/30 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </p>
                      <button
                        onClick={() => { clearRecents(); setRecents([]); }}
                        className="text-[10px] font-medium text-[#1f1f1f]/25 hover:text-[#1f1f1f]/50 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    {recents.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f4f4f4] transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-md bg-[#f4f4f4] flex items-center justify-center shrink-0 group-hover:bg-[#f6f7ed] transition-colors">
                          <Clock className="h-3 w-3 text-[#1f1f1f]/30" />
                        </div>
                        <span className="text-[13px] text-[#1f1f1f]/60 font-medium">{term}</span>
                        <ArrowRight className="h-3 w-3 text-[#1f1f1f]/15 ml-auto group-hover:text-[#1f1f1f]/40 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                <div className="px-2 py-1">
                  <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[#1f1f1f]/30 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Suggestions
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 px-2 pb-2">
                    {[
                      { label: "New leads", emoji: "🟢", q: "new" },
                      { label: "Interested", emoji: "🔥", q: "interested" },
                      { label: "Dashboard", emoji: "📊", q: "dashboard" },
                      { label: "Analytics", emoji: "📈", q: "analytics" },
                    ].map((s) => (
                      <button
                        key={s.q}
                        onClick={() => setQuery(s.q)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-black/[0.04] bg-[#f9f9f9] hover:bg-[#f6f7ed] hover:border-black/[0.08] transition-all text-left group"
                      >
                        <span className="text-sm">{s.emoji}</span>
                        <span className="text-[12px] font-medium text-[#1f1f1f]/50 group-hover:text-[#1f1f1f] transition-colors">
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="px-2 py-1 border-t border-black/[0.04]">
                  <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[#1f1f1f]/30 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" />
                    Quick Actions
                  </p>
                  {quickActions.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setOpen(false);
                        navigate(a.path);
                        if (a.id === "new-lead") {
                          setTimeout(() => window.dispatchEvent(new CustomEvent("open-add-lead-modal")), 100);
                        }
                        if (a.id === "new-bda") {
                          setTimeout(() => window.dispatchEvent(new CustomEvent("open-add-bda-modal")), 100);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f4f4f4] transition-colors group"
                    >
                      <div className={`h-7 w-7 rounded-md ${a.iconBg} flex items-center justify-center shrink-0 transition-colors`}>
                        <a.icon className={`h-3.5 w-3.5 ${a.iconColor}`} />
                      </div>
                      <div className="min-w-0 text-left flex-1">
                        <p className="text-[13px] font-medium text-[#1f1f1f]">{a.label}</p>
                        <p className="text-[10px] text-[#1f1f1f]/30">{a.desc}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-[#1f1f1f]/10 group-hover:text-[#1f1f1f]/40 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── No results ── */}
            {noResults && (
              <div className="flex flex-col items-center justify-center py-14 px-6">
                <div className="h-12 w-12 rounded-full bg-[#f4f4f4] flex items-center justify-center mb-4">
                  <Search className="h-5 w-5 text-[#1f1f1f]/20" />
                </div>
                <p className="text-sm font-semibold text-[#1f1f1f]/50 mb-1">
                  No results for "{query}"
                </p>
                <p className="text-[12px] text-[#1f1f1f]/30 text-center max-w-[240px]">
                  Try searching for lead names, phone numbers, or pages like "dashboard".
                </p>
              </div>
            )}

            {/* ── Grouped results ── */}
            {hasQuery && results.length > 0 && (
              <div className="py-2">
                {groupedResults.map((group) => (
                  <div key={group.key} className="px-2 py-1">
                    <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[#1f1f1f]/30 flex items-center gap-1.5">
                      <group.icon className="h-3 w-3" />
                      {group.label}
                      <span className="ml-auto bg-[#f4f4f4] rounded px-1.5 py-0.5 text-[9px] font-semibold text-[#1f1f1f]/25">
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
                            isSelected ? "bg-[#f6f7ed]" : "hover:bg-[#f4f4f4]"
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-lg ${result.iconBg} flex items-center justify-center shrink-0 transition-colors`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${result.iconColor}`} />
                          </div>
                          <div className="min-w-0 text-left flex-1">
                            <p className="text-[13px] font-medium text-[#1f1f1f] truncate">
                              {result.label}
                            </p>
                            <p className="text-[10px] text-[#1f1f1f]/30 truncate">{result.desc}</p>
                          </div>
                          {result.meta && (
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                statusConfig[result.meta.toLowerCase()]?.bg || "bg-[#f4f4f4]"
                              } ${statusConfig[result.meta.toLowerCase()]?.color || "text-[#1f1f1f]/40"}`}
                            >
                              {result.meta}
                            </span>
                          )}
                          <ArrowRight
                            className={`h-3 w-3 shrink-0 transition-colors ${
                              isSelected ? "text-[#1f1f1f]/40" : "text-[#1f1f1f]/10"
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
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-black/[0.06] bg-[#fafafa]">
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#1f1f1f]/25 font-medium">
                <kbd className="px-1 py-0.5 rounded border border-black/[0.06] bg-white text-[9px] font-semibold">↑↓</kbd>
                Navigate
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#1f1f1f]/25 font-medium">
                <kbd className="px-1 py-0.5 rounded border border-black/[0.06] bg-white text-[9px] font-semibold">↵</kbd>
                Select
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#1f1f1f]/25 font-medium">
                <kbd className="px-1.5 py-0.5 rounded border border-black/[0.06] bg-white text-[9px] font-semibold">ESC</kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#1f1f1f]/20 font-medium">
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

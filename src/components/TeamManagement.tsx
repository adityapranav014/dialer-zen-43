import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Users,
    Search,
    Plus,
    Trophy,
    Phone,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Trash2,
    X,
    Check,
    Mail,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Loader2,
    PhoneCall,
    Headphones,
    ShieldCheck,
} from "lucide-react";
import { useTeam, TeamMember, MemberRole } from "@/hooks/useTeam";
import AddBDAModal from "./AddBDAModal";
import TeamMemberDetailPopup from "./TeamMemberDetailPopup";
import { TeamManagementSkeleton } from "@/components/skeletons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLOR_MAP: Record<string, { bg: string; text: string; swatch: string }> = {
    violet:  { bg: "bg-violet-100 dark:bg-violet-900/40",  text: "text-violet-600 dark:text-violet-300",  swatch: "bg-violet-400" },
    blue:    { bg: "bg-blue-100 dark:bg-blue-900/40",      text: "text-blue-600 dark:text-blue-300",      swatch: "bg-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-300", swatch: "bg-emerald-400" },
    orange:  { bg: "bg-orange-100 dark:bg-orange-900/40",  text: "text-orange-600 dark:text-orange-300",  swatch: "bg-orange-400" },
    pink:    { bg: "bg-pink-100 dark:bg-pink-900/40",      text: "text-pink-600 dark:text-pink-300",      swatch: "bg-pink-400" },
    cyan:    { bg: "bg-cyan-100 dark:bg-cyan-900/40",      text: "text-cyan-600 dark:text-cyan-300",      swatch: "bg-cyan-400" },
    lime:    { bg: "bg-lime-100 dark:bg-lime-900/40",      text: "text-lime-600 dark:text-lime-300",      swatch: "bg-lime-400" },
    fuchsia: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40", text: "text-fuchsia-600 dark:text-fuchsia-300", swatch: "bg-fuchsia-400" },
    red:     { bg: "bg-red-100 dark:bg-red-900/40",        text: "text-red-600 dark:text-red-300",        swatch: "bg-red-400" },
    amber:   { bg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-600 dark:text-amber-300",    swatch: "bg-amber-400" },
    indigo:  { bg: "bg-indigo-100 dark:bg-indigo-900/40",  text: "text-indigo-600 dark:text-indigo-300",  swatch: "bg-indigo-400" },
    teal:    { bg: "bg-teal-100 dark:bg-teal-900/40",      text: "text-teal-600 dark:text-teal-300",      swatch: "bg-teal-400" },
};

const getAvatarClasses = (colorName: string | null, fallbackId: string) => {
    if (colorName && AVATAR_COLOR_MAP[colorName]) {
        const c = AVATAR_COLOR_MAP[colorName];
        return `${c.bg} ${c.text}`;
    }
    const fallbackColors = Object.values(AVATAR_COLOR_MAP);
    let hash = 0;
    for (let i = 0; i < fallbackId.length; i++) hash = fallbackId.charCodeAt(i) + ((hash << 5) - hash);
    const c = fallbackColors[Math.abs(hash) % fallbackColors.length];
    return `${c.bg} ${c.text}`;
};

const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const daysSince = (iso: string) =>
    Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

type SortKey = "name" | "leads" | "conversion" | "calls" | "talkTime" | "joined";
type FilterStatus = "all" | "active" | "inactive";

const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => {
    if (!active) return <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-30 transition-opacity" />;
    return asc
        ? <ChevronUp className="h-3 w-3 text-foreground" />
        : <ChevronDown className="h-3 w-3 text-foreground" />;
};

// ─── Role Change Sheet ────────────────────────────────────────────────────────

interface RoleSheetProps {
    member: TeamMember | null;
    onSave: (membershipId: string, updates: { role?: MemberRole; is_active?: boolean }) => void;
    onClose: () => void;
    saving: boolean;
}

const RoleSheet = ({ member, onSave, onClose, saving }: RoleSheetProps) => {
    const [role, setRole] = useState<MemberRole>("member");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (member) {
            setRole(member.role);
            setIsActive(member.isActive);
        }
    }, [member]);

    if (!member) return null;

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl overflow-y-auto max-h-full scroll-container">
                    <div className="flex items-start justify-between p-5 pb-3">
                        <div>
                            <p className="text-sm font-bold text-foreground">Edit Member</p>
                            <p className="text-xs text-foreground/40 mt-0.5">{member.name}</p>
                        </div>
                        <button onClick={onClose} className="h-7 w-7 rounded-xl bg-accent flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors duration-200">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="px-5 space-y-4">
                        {/* Role */}
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35 mb-2 block">Role</label>
                            <div className="flex gap-2">
                                {(["member", "admin"] as MemberRole[]).map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRole(r)}
                                        className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-semibold transition-all ${
                                            role === r
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted text-foreground/45 border-border hover:border-foreground/15"
                                        }`}
                                    >
                                        {r === "admin" && <ShieldCheck className="h-3.5 w-3.5" />}
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-accent/60 border border-border">
                            <div>
                                <p className="text-xs font-bold text-foreground">Active Status</p>
                                <p className="text-[10px] text-foreground/35">Inactive members cannot log in</p>
                            </div>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-primary" : "bg-muted"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>

                    <div className="px-5 pt-4 pb-5">
                        <button
                            onClick={() => onSave(member.membershipId, { role, is_active: isActive })}
                            disabled={saving}
                            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-200 disabled:opacity-40"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-3.5 w-3.5" />Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
    member: TeamMember | null;
    onConfirm: (membershipId: string) => void;
    onClose: () => void;
    deleting: boolean;
}

const DeleteConfirm = ({ member, onConfirm, onClose, deleting }: DeleteConfirmProps) => {
    if (!member) return null;
    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">Remove Team Member</p>
                        <p className="text-xs text-foreground/40 mt-0.5">This will unassign all their leads</p>
                    </div>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/40 dark:border-red-800 mb-4">
                    <p className="text-xs text-red-600 dark:text-red-400">
                        You're about to remove <strong>{member.name}</strong> from the team.
                        Their {member.activeLeads} active lead{member.activeLeads !== 1 ? "s" : ""} will be unassigned.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-foreground/60 hover:bg-accent transition-colors duration-200">Cancel</button>
                    <button onClick={() => onConfirm(member.membershipId)} disabled={deleting} className="flex-1 h-10 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors duration-200 disabled:opacity-40">
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-3.5 w-3.5" />Remove</>}
                    </button>
                </div>
            </div>
        </>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeamManagement = () => {
    const { members, stats, loading, updateMember, removeMember, updating, removing } = useTeam();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [sortBy, setSortBy] = useState<SortKey>("conversion");
    const [sortAsc, setSortAsc] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
    const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    // Listen for global "open-add-bda-modal" event
    useEffect(() => {
        const pending = sessionStorage.getItem("dialflow_pending_action");
        if (pending === "open-add-bda-modal") {
            sessionStorage.removeItem("dialflow_pending_action");
            setAddOpen(true);
        }
        const handler = () => setAddOpen(true);
        window.addEventListener("open-add-bda-modal", handler);
        return () => window.removeEventListener("open-add-bda-modal", handler);
    }, []);

    // Open detail popup when navigated from GlobalSearch
    const openPendingTeamDetail = useCallback((targetId: string) => {
        if (!targetId || members.length === 0) return;
        const found = members.find(m => m.id === targetId || m.membershipId === targetId);
        if (found) {
            sessionStorage.removeItem("dialflow_pending_action");
            sessionStorage.removeItem("dialflow_pending_detail_id");
            setViewingMember(found);
        }
    }, [members]);

    useEffect(() => {
        const pending = sessionStorage.getItem("dialflow_pending_action");
        if (pending === "open-team-detail" && members.length > 0) {
            const targetId = sessionStorage.getItem("dialflow_pending_detail_id");
            if (targetId) openPendingTeamDetail(targetId);
        }
    }, [members, openPendingTeamDetail]);

    useEffect(() => {
        const handler = (e: Event) => {
            const { type, id } = (e as CustomEvent).detail || {};
            if (type === "team" && id) openPendingTeamDetail(id);
        };
        window.addEventListener("dialflow-open-detail", handler);
        return () => window.removeEventListener("dialflow-open-detail", handler);
    }, [openPendingTeamDetail]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
                setActionMenuId(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Sort & filter
    const filteredMembers = useMemo(() => {
        let list = [...members];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                m.phone.includes(q)
            );
        }
        if (filterStatus === "active") list = list.filter(m => m.isActive);
        if (filterStatus === "inactive") list = list.filter(m => !m.isActive);

        list.sort((a, b) => {
            let cmp = 0;
            switch (sortBy) {
                case "name": cmp = a.name.localeCompare(b.name); break;
                case "leads": cmp = a.totalLeads - b.totalLeads; break;
                case "conversion": cmp = a.conversionRate - b.conversionRate; break;
                case "calls": cmp = a.totalCalls - b.totalCalls; break;
                case "talkTime": cmp = a.talkTimeMinutes - b.talkTimeMinutes; break;
                case "joined": cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(); break;
            }
            return sortAsc ? cmp : -cmp;
        });
        return list;
    }, [members, search, filterStatus, sortBy, sortAsc]);

    const topPerformers = useMemo(() =>
        [...members]
            .filter(m => m.totalLeads >= 5)
            .sort((a, b) => b.conversionRate - a.conversionRate)
            .slice(0, 3),
        [members]
    );

    const handleSort = (key: SortKey) => {
        if (sortBy === key) setSortAsc(!sortAsc);
        else { setSortBy(key); setSortAsc(false); }
    };

    const handleEdit = useCallback(async (membershipId: string, updates: { role?: MemberRole; is_active?: boolean }) => {
        await updateMember({ membershipId, updates });
        setEditingMember(null);
    }, [updateMember]);

    const handleDelete = useCallback(async (membershipId: string) => {
        await removeMember(membershipId);
        setDeletingMember(null);
    }, [removeMember]);

    if (loading) return <TeamManagementSkeleton />;

    const podiumLabels = ["🥇", "🥈", "🥉"];
    const activeCount = members.filter(m => m.isActive).length;
    const inactiveCount = members.length - activeCount;

    return (
        <div className="flex flex-col md:h-full md:min-h-0">
            <div className="shrink-0 mb-6">
                {/* Page Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Team Management</h2>
                        <p className="text-xs text-foreground/40 mt-1">Monitor performance and manage your sales team</p>
                    </div>
                    <button onClick={() => setAddOpen(true)} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all duration-200 shrink-0 shadow-sm">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Member</span>
                    </button>
                </div>

                {/* Top Performers */}
                {topPerformers.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-bold text-foreground tracking-tight">Top Performers</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {topPerformers.map((m, i) => (
                                <div key={m.id} className={`surface-card p-4 relative overflow-hidden ${i === 0 ? "ring-1 ring-amber-200/60" : ""}`}>
                                    <div className="absolute top-3 right-3 text-lg">{podiumLabels[i]}</div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`h-10 w-10 rounded-full ${getAvatarClasses(m.avatarColor, m.id)} flex items-center justify-center text-xs font-bold shrink-0 relative`}>
                                            {getInitials(m.name)}
                                            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${m.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <button onClick={() => setViewingMember(m)} className="text-xs font-bold text-foreground truncate text-left hover:text-primary hover:underline decoration-primary/30 underline-offset-2 transition-colors duration-200 cursor-pointer block max-w-full" title="View member details">{m.name}</button>
                                            <p className="text-[10px] text-foreground/35">{m.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center px-2 py-1.5 rounded-xl bg-accent">
                                            <p className="text-sm font-bold text-foreground">{m.conversionRate}%</p>
                                            <p className="text-[9px] text-foreground/30 font-medium uppercase">Conv.</p>
                                        </div>
                                        <div className="text-center px-2 py-1.5 rounded-xl bg-accent">
                                            <p className="text-sm font-bold text-foreground">{m.closedLeads}</p>
                                            <p className="text-[9px] text-foreground/30 font-medium uppercase">Closed</p>
                                        </div>
                                        <div className="text-center px-2 py-1.5 rounded-xl bg-accent">
                                            <p className="text-sm font-bold text-foreground">{m.totalCalls}</p>
                                            <p className="text-[9px] text-foreground/30 font-medium uppercase">Calls</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search + Filter Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative group flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/25 group-focus-within:text-foreground transition-colors pointer-events-none" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email…" className="h-9 w-full pl-9 pr-3 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all duration-200" />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <Filter className="h-3.5 w-3.5 text-foreground/25 shrink-0" />
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {([
                                { id: "all" as FilterStatus, label: `All (${stats.totalMembers})` },
                                { id: "active" as FilterStatus, label: `Active (${activeCount})` },
                                { id: "inactive" as FilterStatus, label: `Inactive (${inactiveCount})` },
                            ]).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setFilterStatus(s.id)}
                                    className={`h-8 px-3 rounded-xl text-[11px] font-bold capitalize border transition-all duration-200 whitespace-nowrap shrink-0 ${
                                        filterStatus === s.id
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-card text-foreground/45 border-border hover:border-foreground/15 hover:text-foreground"
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="md:flex-1 md:min-h-0 flex flex-col pb-4">
                <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden md:flex-1 md:min-h-0 shadow-sm">
                    {/* Header */}
                    <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur-sm z-10">
                        <div className="overflow-x-auto">
                            <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 min-w-[900px]">
                                <button onClick={() => handleSort("name")} className="flex items-center gap-1.5 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/40 hover:text-foreground transition-colors group">Member <SortIcon active={sortBy === "name"} asc={sortAsc} /></button>
                                <div className="flex items-center px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/40">Status</div>
                                <button onClick={() => handleSort("leads")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/40 hover:text-foreground transition-colors">Leads <SortIcon active={sortBy === "leads"} asc={sortAsc} /></button>
                                <button onClick={() => handleSort("conversion")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/40 hover:text-foreground transition-colors">Conversion <SortIcon active={sortBy === "conversion"} asc={sortAsc} /></button>
                                <button onClick={() => handleSort("calls")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/40 hover:text-foreground transition-colors">Calls <SortIcon active={sortBy === "calls"} asc={sortAsc} /></button>
                                <button onClick={() => handleSort("talkTime")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/40 hover:text-foreground transition-colors">Talk Time <SortIcon active={sortBy === "talkTime"} asc={sortAsc} /></button>
                                <button onClick={() => handleSort("joined")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/40 hover:text-foreground transition-colors">Joined <SortIcon active={sortBy === "joined"} asc={sortAsc} /></button>
                                <div className="px-2 py-3" />
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[60vh] md:max-h-none md:flex-1 overflow-y-auto overflow-x-auto min-h-0 scroll-container">
                        <div className="min-w-[900px]">
                            {filteredMembers.length === 0 && (
                                <div className="py-16 text-center">
                                    <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                                        <Users className="h-6 w-6 text-foreground/20" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground/35">No team members found</p>
                                    {search && <p className="text-xs text-foreground/20 mt-1.5">Try adjusting your search or filters</p>}
                                    {!search && (
                                        <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm">
                                            <Plus className="h-3.5 w-3.5" />Add your first member
                                        </button>
                                    )}
                                </div>
                            )}

                            {filteredMembers.map((member, idx) => {
                                const isMenuOpen = actionMenuId === member.id;
                                const isLast = idx === filteredMembers.length - 1;
                                const daysJoined = daysSince(member.joinedAt);
                                const callsPerLead = member.totalLeads > 0 ? Math.round(member.totalCalls / member.totalLeads) : 0;
                                const avgTalk = member.totalCalls > 0 ? Math.round(member.talkTimeMinutes / member.totalCalls) : 0;

                                return (
                                    <div
                                        key={member.id}
                                        className={`grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 items-center transition-all duration-150 group hover:bg-accent/40 ${!isLast ? "border-b border-foreground/[0.04]" : ""}`}
                                    >
                                        {/* Member */}
                                        <div className="flex items-center gap-3.5 px-5 py-3.5 min-w-0">
                                            <div className={`h-9 w-9 rounded-full ${getAvatarClasses(member.avatarColor, member.id)} flex items-center justify-center text-[10px] font-bold shrink-0 relative ring-2 ring-card shadow-sm`}>
                                                {getInitials(member.name)}
                                                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-card ${member.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <button onClick={() => setViewingMember(member)} className="text-[13px] font-bold text-foreground truncate leading-tight text-left hover:text-primary hover:underline decoration-primary/30 underline-offset-2 transition-colors duration-200 cursor-pointer block max-w-full" title="View member details">{member.name}</button>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Mail className="h-2.5 w-2.5 text-foreground/15 shrink-0" />
                                                    <p className="text-[10px] text-foreground/30 truncate leading-tight">{member.email}</p>
                                                </div>
                                                {member.phone && (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Phone className="h-2.5 w-2.5 text-foreground/15 shrink-0" />
                                                        <p className="text-[10px] text-foreground/20 truncate leading-tight">{member.phone}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="px-3 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                                                member.isActive
                                                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800"
                                                    : "bg-gray-100 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-gray-700"
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                                {member.isActive ? "Active" : "Inactive"}
                                            </span>
                                            {member.role === "admin" && (
                                                <p className="text-[9px] text-foreground/25 mt-1 pl-0.5 font-medium flex items-center gap-1">
                                                    <ShieldCheck className="h-2.5 w-2.5" /> Admin
                                                </p>
                                            )}
                                        </div>

                                        {/* Leads */}
                                        <div className="px-3 py-3.5">
                                            <p className="text-[13px] font-bold text-foreground tabular-nums">{member.totalLeads}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-foreground/30 bg-muted px-1.5 py-0.5 rounded">{member.activeLeads} active</span>
                                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">{member.closedLeads} won</span>
                                            </div>
                                        </div>

                                        {/* Conversion */}
                                        <div className="px-3 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-bold text-foreground tabular-nums">{member.conversionRate}%</p>
                                                {member.conversionRate >= 45 && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                                                        <ArrowUpRight className="h-2.5 w-2.5" />High
                                                    </span>
                                                )}
                                                {member.conversionRate < 35 && member.conversionRate > 0 && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                                                        <ArrowDownRight className="h-2.5 w-2.5" />Low
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-full max-w-[100px] h-1.5 rounded-full bg-foreground/[0.04] mt-2 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${
                                                    member.conversionRate >= 45
                                                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                        : member.conversionRate >= 35
                                                        ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                                        : "bg-gradient-to-r from-amber-400 to-amber-500"
                                                }`} style={{ width: `${Math.min(member.conversionRate, 100)}%` }} />
                                            </div>
                                        </div>

                                        {/* Calls */}
                                        <div className="px-3 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <PhoneCall className="h-3 w-3 text-foreground/15" />
                                                <p className="text-[13px] font-bold text-foreground tabular-nums">{member.totalCalls}</p>
                                            </div>
                                            <p className="text-[9px] text-foreground/25 mt-1 font-medium tabular-nums">
                                                {callsPerLead} <span className="text-foreground/15">/ lead</span>
                                            </p>
                                        </div>

                                        {/* Talk Time */}
                                        <div className="px-3 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <Headphones className="h-3 w-3 text-foreground/15" />
                                                <p className="text-[13px] font-bold text-foreground tabular-nums">
                                                    {member.talkTimeMinutes >= 60
                                                        ? <>{Math.floor(member.talkTimeMinutes / 60)}<span className="text-[10px] text-foreground/30 font-medium">h</span> {member.talkTimeMinutes % 60}<span className="text-[10px] text-foreground/30 font-medium">m</span></>
                                                        : <>{member.talkTimeMinutes}<span className="text-[10px] text-foreground/30 font-medium">m</span></>}
                                                </p>
                                            </div>
                                            <p className="text-[9px] text-foreground/25 mt-1 font-medium tabular-nums">
                                                ~{avgTalk}m <span className="text-foreground/15">avg/call</span>
                                            </p>
                                        </div>

                                        {/* Joined */}
                                        <div className="px-3 py-3.5">
                                            <p className="text-[10px] font-medium text-foreground/50 tabular-nums">{daysJoined}d ago</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="px-2 py-3.5 relative" ref={isMenuOpen ? actionMenuRef : undefined}>
                                            <button
                                                onClick={() => setActionMenuId(isMenuOpen ? null : member.id)}
                                                className={`h-7 w-7 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                                    isMenuOpen
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-foreground/15 hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100"
                                                }`}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                            {isMenuOpen && (
                                                <div className="absolute right-2 top-full mt-1 z-30 w-44 bg-card border border-border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden py-1">
                                                    <button onClick={() => { setEditingMember(member); setActionMenuId(null); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors duration-200">
                                                        <ShieldCheck className="h-3.5 w-3.5 text-foreground/35" />Edit Role & Status
                                                    </button>
                                                    <div className="mx-3 my-0.5 border-t border-foreground/[0.04]" />
                                                    <button onClick={() => { setDeletingMember(member); setActionMenuId(null); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />Remove Member
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    {filteredMembers.length > 0 && (
                        <div className="shrink-0 border-t border-border bg-accent/60 z-10">
                            <div className="overflow-x-auto">
                                <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 min-w-[900px] items-center">
                                    <div className="px-5 py-3 flex items-center gap-3">
                                        <span className="text-[11px] font-medium text-foreground/35">{filteredMembers.length} of {members.length} member{members.length !== 1 ? "s" : ""}</span>
                                        {filterStatus !== "all" && (
                                            <button onClick={() => setFilterStatus("all")} className="flex items-center gap-1 text-[10px] font-medium text-foreground/25 hover:text-foreground transition-colors">
                                                <X className="h-2.5 w-2.5" /> Clear filter
                                            </button>
                                        )}
                                    </div>
                                    <div className="px-3 py-3"><span className="text-[9px] font-semibold text-foreground/20 uppercase tracking-widest">Totals</span></div>
                                    <div className="px-3 py-3"><p className="text-[11px] font-bold text-foreground/50 tabular-nums">{filteredMembers.reduce((s, m) => s + m.totalLeads, 0)}</p></div>
                                    <div className="px-3 py-3"><p className="text-[11px] font-bold text-foreground/50 tabular-nums">{filteredMembers.length > 0 ? (filteredMembers.reduce((s, m) => s + m.conversionRate, 0) / filteredMembers.length).toFixed(1) : "0"}% <span className="text-[9px] font-medium text-foreground/25 ml-1">avg</span></p></div>
                                    <div className="px-3 py-3"><p className="text-[11px] font-bold text-foreground/50 tabular-nums">{filteredMembers.reduce((s, m) => s + m.totalCalls, 0)}</p></div>
                                    <div className="px-3 py-3"><p className="text-[11px] font-bold text-foreground/50 tabular-nums">{(() => { const total = filteredMembers.reduce((s, m) => s + m.talkTimeMinutes, 0); return total >= 60 ? `${Math.floor(total / 60)}h ${total % 60}m` : `${total}m`; })()}</p></div>
                                    <div className="px-3 py-3" />
                                    <div className="px-2 py-3" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AddBDAModal open={addOpen} onClose={() => setAddOpen(false)} />
            <RoleSheet member={editingMember} onSave={handleEdit} onClose={() => setEditingMember(null)} saving={updating} />
            <DeleteConfirm member={deletingMember} onConfirm={handleDelete} onClose={() => setDeletingMember(null)} deleting={removing} />
            <TeamMemberDetailPopup member={viewingMember} onClose={() => setViewingMember(null)} />
        </div>
    );
};

export default TeamManagement;

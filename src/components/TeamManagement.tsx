import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Users,
    Search,
    Plus,
    Trophy,
    Phone,
    Clock,
    TrendingUp,
    BarChart3,
    UserCheck,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Edit3,
    Trash2,
    X,
    Check,
    Mail,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Crown,
    Flame,
    Target,
    Loader2,
    PhoneCall,
    Headphones,
    Calendar,
    ExternalLink,
} from "lucide-react";
import { useTeam, TeamMember, BDAStatus } from "@/hooks/useTeam";
import AddBDAModal from "./AddBDAModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = [
    "bg-violet-100 text-violet-600", "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600", "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600", "bg-cyan-100 text-cyan-600",
    "bg-lime-100 text-lime-600", "bg-fuchsia-100 text-fuchsia-600",
    "bg-rose-100 text-rose-600", "bg-teal-100 text-teal-600",
];

const getAvatarColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const timeAgo = (iso: string | null) => {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const daysSince = (iso: string) =>
    Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const statusConfig: Record<BDAStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
    active: { label: "Active", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200/60" },
    idle: { label: "Idle", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200/60" },
    offline: { label: "Offline", dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200/60" },
};

type SortKey = "name" | "leads" | "conversion" | "calls" | "talkTime" | "joined";
type FilterStatus = "all" | BDAStatus;

const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => {
    if (!active) return <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-30 transition-opacity" />;
    return asc
        ? <ChevronUp className="h-3 w-3 text-[#1f1f1f]" />
        : <ChevronDown className="h-3 w-3 text-[#1f1f1f]" />;
};

// ─── Edit Member Sheet ────────────────────────────────────────────────────────

interface EditSheetProps {
    member: TeamMember | null;
    onSave: (id: string, updates: { name?: string; email?: string; phone?: string }) => void;
    onClose: () => void;
    saving: boolean;
}

const EditSheet = ({ member, onSave, onClose, saving }: EditSheetProps) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        if (member) {
            setName(member.name);
            setEmail(member.email);
            setPhone(member.phone);
        }
    }, [member]);

    if (!member) return null;

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl bg-white border border-black/[0.06] p-5 shadow-xl">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm font-semibold text-[#1f1f1f]">Edit Member</p>
                        <p className="text-xs text-[#1f1f1f]/40 mt-0.5">{member.name}</p>
                    </div>
                    <button onClick={onClose} className="h-7 w-7 rounded-lg bg-[#f4f4f4] flex items-center justify-center text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="space-y-3">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full h-9 px-3 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-xs text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 transition-all" />
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full h-9 px-3 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-xs text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 transition-all" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full h-9 px-3 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-xs text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 transition-all" />
                </div>
                <button
                    onClick={() => onSave(member.id, { name: name.trim(), email: email.trim(), phone: phone.trim() })}
                    disabled={saving || !name.trim()}
                    className="mt-4 w-full h-9 rounded-xl bg-[#1f1f1f] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1f1f1f]/90 transition-all disabled:opacity-40"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-3.5 w-3.5" />Save Changes</>}
                </button>
            </div>
        </>
    );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
    member: TeamMember | null;
    onConfirm: (id: string) => void;
    onClose: () => void;
    deleting: boolean;
}

const DeleteConfirm = ({ member, onConfirm, onClose, deleting }: DeleteConfirmProps) => {
    if (!member) return null;
    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl bg-white border border-black/[0.06] p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#1f1f1f]">Remove Team Member</p>
                        <p className="text-xs text-[#1f1f1f]/40 mt-0.5">This will unassign all their leads</p>
                    </div>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-red-50/60 border border-red-200/40 mb-4">
                    <p className="text-xs text-red-600">
                        You're about to remove <strong>{member.name}</strong> from the team.
                        Their {member.activeLeads} active lead{member.activeLeads !== 1 ? "s" : ""} will be unassigned.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 h-9 rounded-xl border border-black/[0.06] text-xs font-semibold text-[#1f1f1f]/60 hover:bg-[#f4f4f4] transition-colors">Cancel</button>
                    <button onClick={() => onConfirm(member.id)} disabled={deleting} className="flex-1 h-9 rounded-xl bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-40">
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
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    // Listen for global "open-add-bda-modal" event (from GlobalSearch)
    useEffect(() => {
        const handler = () => setAddOpen(true);
        window.addEventListener("open-add-bda-modal", handler);
        return () => window.removeEventListener("open-add-bda-modal", handler);
    }, []);

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

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                m.phone.includes(q)
            );
        }

        // Status filter
        if (filterStatus !== "all") {
            list = list.filter(m => m.status === filterStatus);
        }

        // Sort
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

    // Top performers (by conversion rate, min 5 leads)
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

    const handleEdit = useCallback(async (id: string, updates: { name?: string; email?: string; phone?: string }) => {
        await updateMember({ memberId: id, updates });
        setEditingMember(null);
    }, [updateMember]);

    const handleDelete = useCallback(async (id: string) => {
        await removeMember(id);
        setDeletingMember(null);
    }, [removeMember]);

    if (loading) {
        return <div className="p-12 text-center text-[#1f1f1f]/40">Loading team data…</div>;
    }

    const podiumLabels = ["🥇", "🥈", "🥉"];

    return (
        <div className="flex flex-col md:h-full md:min-h-0">
            <div className="shrink-0 mb-6">
                {/* Page Header */}
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">Team Management</h2>
                        <p className="text-sm text-[#1f1f1f]/40 mt-1">Monitor performance and manage your sales team</p>
                    </div>
                    <button
                        onClick={() => setAddOpen(true)}
                        className="h-10 px-4 rounded-xl bg-[#1f1f1f] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#1f1f1f]/90 transition-all shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Member</span>
                    </button>
                </div>

                {/* ── Stats Strip ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Members", value: stats.totalMembers, icon: Users, color: "text-[#1f1f1f]", bg: "bg-[#f6f7ed]" },
                        { label: "Active Now", value: stats.activeMembers, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Avg. Conversion", value: `${stats.avgConversionRate}%`, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Leads Assigned", value: stats.totalLeadsAssigned, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map(stat => (
                        <div key={stat.label} className="surface-card p-4 flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold tracking-tight leading-none mb-1 text-[#1f1f1f]">{stat.value}</p>
                                <p className="text-[10px] text-[#1f1f1f]/30 font-medium uppercase tracking-wider leading-tight">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                        </div>

                {/* ── Top Performers ─────────────────────────────────────────── */}
                {topPerformers.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-semibold text-[#1f1f1f] tracking-tight">Top Performers</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {topPerformers.map((m, i) => (
                                <div
                                    key={m.id}
                                    className={`surface-card p-4 relative overflow-hidden ${i === 0 ? "ring-1 ring-amber-200/60" : ""}`}
                                >
                                    {/* Rank badge */}
                                    <div className="absolute top-3 right-3 text-lg">{podiumLabels[i]}</div>

                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`h-10 w-10 rounded-full ${getAvatarColor(m.id)} flex items-center justify-center text-xs font-bold shrink-0 relative`}>
                                            {getInitials(m.name)}
                                            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${statusConfig[m.status].dot}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-[#1f1f1f] truncate">{m.name}</p>
                                            <p className="text-[10px] text-[#1f1f1f]/35">{m.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center px-2 py-1.5 rounded-lg bg-[#f4f4f4]">
                                            <p className="text-sm font-semibold text-[#1f1f1f]">{m.conversionRate}%</p>
                                            <p className="text-[9px] text-[#1f1f1f]/30 font-medium uppercase">Conv.</p>
                                        </div>
                                        <div className="text-center px-2 py-1.5 rounded-lg bg-[#f4f4f4]">
                                            <p className="text-sm font-semibold text-[#1f1f1f]">{m.closedLeads}</p>
                                            <p className="text-[9px] text-[#1f1f1f]/30 font-medium uppercase">Closed</p>
                                        </div>
                                        <div className="text-center px-2 py-1.5 rounded-lg bg-[#f4f4f4]">
                                            <p className="text-sm font-semibold text-[#1f1f1f]">{m.totalCalls}</p>
                                            <p className="text-[9px] text-[#1f1f1f]/30 font-medium uppercase">Calls</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Search + Filter Bar ────────────────────────────────────── */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative group flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/25 group-focus-within:text-[#1f1f1f] transition-colors pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email…"
                            className="h-10 w-full pl-10 pr-4 bg-white border border-black/[0.06] rounded-xl text-xs text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/15 transition-all"
                        />
                    </div>

                    {/* Status filter pills */}
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <Filter className="h-3.5 w-3.5 text-[#1f1f1f]/25 shrink-0" />
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {(["all", "active", "idle", "offline"] as FilterStatus[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`h-8 px-3 rounded-lg text-[11px] font-semibold capitalize border transition-all whitespace-nowrap shrink-0 ${
                                    filterStatus === s
                                        ? "bg-[#1f1f1f] text-white border-[#1f1f1f]"
                                        : "bg-white text-[#1f1f1f]/45 border-black/[0.06] hover:border-[#1f1f1f]/15 hover:text-[#1f1f1f]"
                                }`}
                            >
                                {s === "all" ? `All (${stats.totalMembers})` : `${s} (${members.filter(m => m.status === s).length})`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Members Table ──────────────────────────────────────────────── */}
            <div className="md:flex-1 md:min-h-0 flex flex-col">
                <div className="rounded-xl border border-black/[0.08] bg-white flex flex-col overflow-hidden md:flex-1 md:min-h-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                    {/* ── Fixed Header ────────────────────────────────────────── */}
                    <div className="shrink-0 border-b border-black/[0.06] bg-white/95 backdrop-blur-sm z-10">
                        <div className="overflow-x-auto">
                            <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 min-w-[900px]">
                                <button onClick={() => handleSort("name")} className="flex items-center gap-1.5 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors group">
                                    Member
                                    <SortIcon active={sortBy === "name"} asc={sortAsc} />
                                </button>
                                <div className="flex items-center px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f1f1f]/40">
                                    Status
                                </div>
                                <button onClick={() => handleSort("leads")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors">
                                    Leads
                                    <SortIcon active={sortBy === "leads"} asc={sortAsc} />
                                </button>
                                <button onClick={() => handleSort("conversion")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors">
                                    Conversion
                                    <SortIcon active={sortBy === "conversion"} asc={sortAsc} />
                                </button>
                                <button onClick={() => handleSort("calls")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors">
                                    Calls
                                    <SortIcon active={sortBy === "calls"} asc={sortAsc} />
                                </button>
                                <button onClick={() => handleSort("talkTime")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors">
                                    Talk Time
                                    <SortIcon active={sortBy === "talkTime"} asc={sortAsc} />
                                </button>
                                <button onClick={() => handleSort("joined")} className="flex items-center gap-1.5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors">
                                    Joined
                                    <SortIcon active={sortBy === "joined"} asc={sortAsc} />
                                </button>
                                <div className="px-2 py-3" />
                            </div>
                        </div>
                    </div>

                    {/* ── Scrollable Body ──────────────────────────────────────── */}
                    <div className="max-h-[60vh] md:max-h-none md:flex-1 overflow-y-auto overflow-x-auto min-h-0 scroll-container">
                        <div className="min-w-[900px]">
                            {filteredMembers.length === 0 && (
                                <div className="py-16 text-center">
                                    <div className="h-14 w-14 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
                                        <Users className="h-6 w-6 text-[#1f1f1f]/20" />
                                    </div>
                                    <p className="text-sm font-medium text-[#1f1f1f]/35">No team members found</p>
                                    {search && <p className="text-xs text-[#1f1f1f]/20 mt-1.5">Try adjusting your search or filters</p>}
                                    {!search && (
                                        <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1f1f] text-white text-xs font-semibold hover:bg-[#1f1f1f]/90 transition-all">
                                            <Plus className="h-3.5 w-3.5" />Add your first member
                                        </button>
                                    )}
                                </div>
                            )}

                            {filteredMembers.map((member, idx) => {
                                const sc = statusConfig[member.status];
                                const isMenuOpen = actionMenuId === member.id;
                                const isLast = idx === filteredMembers.length - 1;
                                const daysJoined = daysSince(member.joinedAt);
                                const callsPerLead = member.totalLeads > 0 ? Math.round(member.totalCalls / member.totalLeads) : 0;
                                const avgTalk = member.totalCalls > 0 ? Math.round(member.talkTimeMinutes / member.totalCalls) : 0;

                                return (
                                    <div
                                        key={member.id}
                                        className={`grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 items-center transition-all duration-150 group hover:bg-[#f6f7ed]/40 ${!isLast ? "border-b border-black/[0.04]" : ""}`}
                                    >
                                        {/* ── Member ──────── */}
                                        <div className="flex items-center gap-3.5 px-5 py-3.5 min-w-0">
                                            <div className={`h-9 w-9 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-[10px] font-bold shrink-0 relative ring-2 ring-white shadow-sm`}>
                                                {getInitials(member.name)}
                                                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-white ${sc.dot} ${member.status === "active" ? "animate-pulse" : ""}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-[#1f1f1f] truncate leading-tight">{member.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Mail className="h-2.5 w-2.5 text-[#1f1f1f]/15 shrink-0" />
                                                    <p className="text-[10px] text-[#1f1f1f]/30 truncate leading-tight">{member.email}</p>
                                                </div>
                                                {member.phone && (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Phone className="h-2.5 w-2.5 text-[#1f1f1f]/15 shrink-0" />
                                                        <p className="text-[10px] text-[#1f1f1f]/20 truncate leading-tight">{member.phone}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── Status ──────── */}
                                        <div className="px-3 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${member.status === "active" ? "animate-pulse" : ""}`} />
                                                {sc.label}
                                            </span>
                                            <p className="text-[9px] text-[#1f1f1f]/20 mt-1 pl-0.5 font-medium">{timeAgo(member.lastActiveAt)}</p>
                                        </div>

                                        {/* ── Leads ──────── */}
                                        <div className="px-3 py-3.5">
                                            <p className="text-[13px] font-bold text-[#1f1f1f] tabular-nums">{member.totalLeads}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#1f1f1f]/30 bg-[#f4f4f4] px-1.5 py-0.5 rounded">{member.activeLeads} active</span>
                                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{member.closedLeads} won</span>
                                            </div>
                                        </div>

                                        {/* ── Conversion ──────── */}
                                        <div className="px-3 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-bold text-[#1f1f1f] tabular-nums">{member.conversionRate}%</p>
                                                {member.conversionRate >= 45 && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                        <ArrowUpRight className="h-2.5 w-2.5" />High
                                                    </span>
                                                )}
                                                {member.conversionRate < 35 && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                                        <ArrowDownRight className="h-2.5 w-2.5" />Low
                                                    </span>
                                                )}
                                            </div>
                                            {/* Conversion bar */}
                                            <div className="w-full max-w-[100px] h-1.5 rounded-full bg-black/[0.04] mt-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        member.conversionRate >= 45
                                                            ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                            : member.conversionRate >= 35
                                                            ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                                            : "bg-gradient-to-r from-amber-400 to-amber-500"
                                                    }`}
                                                    style={{ width: `${Math.min(member.conversionRate, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* ── Calls ──────── */}
                                        <div className="px-3 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <PhoneCall className="h-3 w-3 text-[#1f1f1f]/15" />
                                                <p className="text-[13px] font-bold text-[#1f1f1f] tabular-nums">{member.totalCalls}</p>
                                            </div>
                                            <p className="text-[9px] text-[#1f1f1f]/25 mt-1 font-medium tabular-nums">
                                                {callsPerLead} <span className="text-[#1f1f1f]/15">/ lead</span>
                                            </p>
                                        </div>

                                        {/* ── Talk Time ──────── */}
                                        <div className="px-3 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <Headphones className="h-3 w-3 text-[#1f1f1f]/15" />
                                                <p className="text-[13px] font-bold text-[#1f1f1f] tabular-nums">
                                                    {member.talkTimeMinutes >= 60
                                                        ? <>{Math.floor(member.talkTimeMinutes / 60)}<span className="text-[10px] text-[#1f1f1f]/30 font-medium">h</span> {member.talkTimeMinutes % 60}<span className="text-[10px] text-[#1f1f1f]/30 font-medium">m</span></>
                                                        : <>{member.talkTimeMinutes}<span className="text-[10px] text-[#1f1f1f]/30 font-medium">m</span></>}
                                                </p>
                                            </div>
                                            <p className="text-[9px] text-[#1f1f1f]/25 mt-1 font-medium tabular-nums">
                                                ~{avgTalk}m <span className="text-[#1f1f1f]/15">avg/call</span>
                                            </p>
                                        </div>

                                        {/* ── Joined ──────── */}
                                        <div className="px-3 py-3.5">
                                            <p className="text-[10px] font-medium text-[#1f1f1f]/50 tabular-nums">
                                                {daysJoined}d ago
                                            </p>
                                        </div>

                                        {/* ── Actions ──────── */}
                                        <div className="px-2 py-3.5 relative" ref={isMenuOpen ? actionMenuRef : undefined}>
                                            <button
                                                onClick={() => setActionMenuId(isMenuOpen ? null : member.id)}
                                                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                                                    isMenuOpen
                                                        ? "bg-[#1f1f1f] text-white"
                                                        : "text-[#1f1f1f]/15 hover:text-[#1f1f1f] hover:bg-[#f4f4f4] opacity-0 group-hover:opacity-100"
                                                }`}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>

                                            {isMenuOpen && (
                                                <div className="absolute right-2 top-full mt-1 z-30 w-44 bg-white border border-black/[0.08] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden py-1">
                                                    <button
                                                        onClick={() => { setEditingMember(member); setActionMenuId(null); }}
                                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-[#1f1f1f] hover:bg-[#f4f4f4] transition-colors"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 text-[#1f1f1f]/35" />
                                                        Edit Details
                                                    </button>
                                                    <div className="mx-3 my-0.5 border-t border-black/[0.04]" />
                                                    <button
                                                        onClick={() => { setDeletingMember(member); setActionMenuId(null); }}
                                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Remove Member
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Fixed Footer ─────────────────────────────────────────── */}
                    {filteredMembers.length > 0 && (
                        <div className="shrink-0 border-t border-black/[0.06] bg-[#fafafa] z-10">
                            <div className="overflow-x-auto">
                                <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(100px,0.9fr)_minmax(120px,1fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_minmax(80px,0.5fr)_44px] gap-0 min-w-[900px] items-center">
                                    <div className="px-5 py-3 flex items-center gap-3">
                                        <span className="text-[11px] font-medium text-[#1f1f1f]/35">
                                            {filteredMembers.length} of {members.length} member{members.length !== 1 ? "s" : ""}
                                        </span>
                                        {filterStatus !== "all" && (
                                            <button onClick={() => setFilterStatus("all")} className="flex items-center gap-1 text-[10px] font-medium text-[#1f1f1f]/25 hover:text-[#1f1f1f] transition-colors">
                                                <X className="h-2.5 w-2.5" /> Clear filter
                                            </button>
                                        )}
                                    </div>
                                    <div className="px-3 py-3">
                                        <span className="text-[9px] font-semibold text-[#1f1f1f]/20 uppercase tracking-wider">Totals</span>
                                    </div>
                                    <div className="px-3 py-3">
                                        <p className="text-[11px] font-bold text-[#1f1f1f]/50 tabular-nums">
                                            {filteredMembers.reduce((s, m) => s + m.totalLeads, 0)}
                                        </p>
                                    </div>
                                    <div className="px-3 py-3">
                                        <p className="text-[11px] font-bold text-[#1f1f1f]/50 tabular-nums">
                                            {filteredMembers.length > 0
                                                ? (filteredMembers.reduce((s, m) => s + m.conversionRate, 0) / filteredMembers.length).toFixed(1)
                                                : "0"}%
                                            <span className="text-[9px] font-medium text-[#1f1f1f]/25 ml-1">avg</span>
                                        </p>
                                    </div>
                                    <div className="px-3 py-3">
                                        <p className="text-[11px] font-bold text-[#1f1f1f]/50 tabular-nums">
                                            {filteredMembers.reduce((s, m) => s + m.totalCalls, 0)}
                                        </p>
                                    </div>
                                    <div className="px-3 py-3">
                                        <p className="text-[11px] font-bold text-[#1f1f1f]/50 tabular-nums">
                                            {(() => {
                                                const total = filteredMembers.reduce((s, m) => s + m.talkTimeMinutes, 0);
                                                return total >= 60 ? `${Math.floor(total / 60)}h ${total % 60}m` : `${total}m`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="px-3 py-3" />
                                    <div className="px-2 py-3" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ────────────────────────────────────────────────────── */}
            <AddBDAModal open={addOpen} onClose={() => setAddOpen(false)} />
            <EditSheet member={editingMember} onSave={handleEdit} onClose={() => setEditingMember(null)} saving={updating} />
            <DeleteConfirm member={deletingMember} onConfirm={handleDelete} onClose={() => setDeletingMember(null)} deleting={removing} />
        </div>
        </div>
    );
};

export default TeamManagement;

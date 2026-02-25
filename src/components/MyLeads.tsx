import { useState, useEffect } from "react";
import {
    Phone,
    Clock,
    Search,
    PhoneCall,
    CheckCircle2,
    MessageSquare,
    TrendingUp,
    Star,
    Flame,
    UserCheck,
    ChevronDown,
    X,
    IndianRupee,
    StickyNote,
} from "lucide-react";
import PostCallModal from "@/components/PostCallModal";
import { useLeads, LeadStatus as DbLeadStatus } from "@/hooks/useLeads";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type LeadStatus = "all" | DbLeadStatus;

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: DbLeadStatus;
    created_at: string;
    value?: string;
    note?: string;
}

const STATUS_CFG: Record<DbLeadStatus, { label: string; pill: string; dot: string; border: string }> = {
    new: { label: "New", pill: "bg-[#f6f7ed] text-[#1f1f1f]", dot: "bg-[#1f1f1f]", border: "border-black/[0.06]" },
    contacted: { label: "Contacted", pill: "bg-blue-50 text-blue-600", dot: "bg-blue-500", border: "border-blue-200/60" },
    interested: { label: "Interested", pill: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500", border: "border-emerald-200/60" },
    closed: { label: "Closed", pill: "bg-purple-50 text-purple-600", dot: "bg-purple-500", border: "border-purple-200/60" },
};

const FILTER_TABS: { id: LeadStatus | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "contacted", label: "Contacted" },
    { id: "interested", label: "Interested" },
    { id: "closed", label: "Closed" },
];

const avatarColors = [
    "bg-violet-100 text-violet-600", "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600", "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600", "bg-cyan-100 text-cyan-600",
];
const getColor = (n: string) => avatarColors[n.charCodeAt(0) % avatarColors.length];
const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// ─── Lead Card ────────────────────────────────────────────────────────────────

const LeadCard = ({
    lead, index, onCall, onStatusChange,
}: { lead: Lead; index: number; onCall: (name: string) => void; onStatusChange: (id: string, s: DbLeadStatus) => void }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const cfg = STATUS_CFG[lead.status];
    const statuses: DbLeadStatus[] = ["new", "contacted", "interested", "closed"];

    return (
        <div
            className="group relative surface-card p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200"
        >
            {/* Left accent bar based on status */}
            <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${cfg.dot} opacity-40`} />

            <div className="flex items-start gap-3 pl-3">
                {/* Avatar */}
                <div className={`h-10 w-10 rounded-xl ${getColor(lead.name)} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                    {getInitials(lead.name)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                    {/* Row 1 — name + status */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-[#1f1f1f] leading-tight truncate">{lead.name}</h3>
                            <p className="text-[11px] text-[#1f1f1f]/35 mt-0.5 flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5 shrink-0" />
                                {lead.phone}
                            </p>
                        </div>

                        {/* Status dropdown */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                className={`flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full text-[10px] font-medium border transition-all ${cfg.pill} ${cfg.border} hover:opacity-80`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                {cfg.label}
                                <ChevronDown className={`h-2.5 w-2.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                            </button>
                            {menuOpen && (
                                <div
                                    className="absolute right-0 top-full mt-1 z-30 w-36 bg-white border border-black/[0.06] rounded-xl p-1 shadow-lg"
                                >
                                    {statuses.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { onStatusChange(lead.id, s); setMenuOpen(false); }}
                                            className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors ${lead.status === s ? STATUS_CFG[s].pill : "text-[#1f1f1f]/60 hover:text-[#1f1f1f] hover:bg-[#f4f4f4]"
                                                }`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_CFG[s].dot}`} />
                                            {STATUS_CFG[s].label}
                                            {lead.status === s && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2 — value + note */}
                    <div className="mt-2 flex flex-col gap-1.5">
                        {lead.value && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <IndianRupee className="h-3 w-3 shrink-0" />
                                <span>{lead.value.replace("₹", "")}</span>
                            </div>
                        )}
                        {lead.note && (
                            <div className="flex items-start gap-1.5 bg-[#f4f4f4] border border-black/[0.04] rounded-lg px-2.5 py-1.5">
                                <StickyNote className="h-3 w-3 text-[#1f1f1f]/25 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-[#1f1f1f]/50 leading-relaxed">{lead.note}</p>
                            </div>
                        )}
                    </div>

                    {/* Row 3 — time + actions */}
                    <div className="flex items-center justify-between mt-3 gap-2">
                        <span className="text-[10px] text-[#1f1f1f]/25 flex items-center gap-1 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(lead.created_at)}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                title="Message"
                                className="h-7 w-7 rounded-lg bg-[#f4f4f4] hover:bg-[#f6f7ed] flex items-center justify-center transition-colors text-[#1f1f1f]/40 hover:text-[#1f1f1f]"
                            >
                                <MessageSquare className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => onCall(lead.name)}
                                className="relative flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95 bg-[#1f1f1f] hover:bg-[#1f1f1f]/90"
                            >
                                <Phone className="h-3 w-3" />
                                <span>Call</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const MyLeads = () => {
    const { myLeads: leads, loading, updateStatus } = useLeads();
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<LeadStatus>("all");
    const [callingLead, setCallingLead] = useState<{ id: string; name: string } | null>(null);
    const [showPostCall, setShowPostCall] = useState(false);

    const handleCall = (id: string, name: string) => {
        setCallingLead({ id, name });
        setTimeout(() => setShowPostCall(true), 1500);
    };

    const handleStatusUpdate = (leadId: string, status: DbLeadStatus) => {
        updateStatus({ leadId, status });
    };

    const filtered = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || (l.phone && l.phone.includes(search));
        const matchesTab = activeTab === "all" || l.status === activeTab;
        return matchesSearch && matchesTab;
    });

    if (loading) {
        return <div className="p-12 text-center text-[#1f1f1f]/40">Loading pipeline...</div>;
    }

    const counts = leads.reduce<Record<string, number>>((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1; return acc;
    }, {});

    const hotLeads = leads.filter(l => l.status === "interested").length;
    const closed = leads.filter(l => l.status === "closed").length;
    const totalValue = leads
        .reduce((sum, l) => {
            const val = (l as any).value || "0";
            return sum + parseInt(val.replace(/[₹,]/g, ""));
        }, 0);

    const fmtValue = (v: number) =>
        v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

    return (
        <div className="flex flex-col h-full min-h-0">

            {/* ── Sticky Header ─────────────────────────────────────────── */}
            <div className="shrink-0 pb-4 space-y-4">

                {/* Title row */}
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">My Pipeline</h2>
                        <p className="text-sm text-[#1f1f1f]/40 mt-1 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {leads.length} leads assigned to you
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5">
                    {[
                        { label: "Assigned", value: leads.length, Icon: UserCheck, color: "text-[#1f1f1f]", bg: "bg-[#f6f7ed]" },
                        { label: "Hot Leads", value: hotLeads, Icon: Flame, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Closed", value: closed, Icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map(({ label, value, Icon, color, bg }) => (
                        <div
                            key={label}
                            className="surface-card p-3 flex flex-col items-center text-center gap-1"
                        >
                            <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center`}>
                                <Icon className={`h-3.5 w-3.5 ${color}`} />
                            </div>
                            <p className={`text-lg font-semibold leading-none ${color}`}>{value}</p>
                            <p className="text-[10px] text-[#1f1f1f]/30 font-medium">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Pipeline value bar */}
                <div className="flex items-center justify-between surface-card px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs text-[#1f1f1f]/40 font-medium">Pipeline Value</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">{fmtValue(totalValue)}</span>
                </div>

                {/* Hot leads alert */}
                {hotLeads > 0 && (
                    <div
                        className="flex items-center gap-3 border border-amber-200/60 rounded-xl px-3.5 py-2.5 bg-amber-50/50"
                    >
                        <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <Flame className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1f1f1f]">{hotLeads} interested lead{hotLeads > 1 ? "s" : ""}</p>
                            <p className="text-[10px] text-[#1f1f1f]/35">Follow up now before they go cold</p>
                        </div>
                        <TrendingUp className="h-3.5 w-3.5 text-amber-500 ml-auto shrink-0" />
                    </div>
                )}

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/25 group-focus-within:text-[#1f1f1f] transition-colors pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search leads…"
                        className="h-10 pl-10 pr-4 bg-white border border-black/[0.06] rounded-xl text-xs text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/15 transition-all w-full"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[#1f1f1f]/10 flex items-center justify-center hover:bg-[#1f1f1f]/20 transition-colors"
                        >
                            <X className="h-2.5 w-2.5 text-[#1f1f1f]/40" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center border-b border-black/[0.06] gap-0 overflow-x-auto no-scrollbar">
                    {FILTER_TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        const count = tab.id === "all" ? leads.length : (counts[tab.id] || 0);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${isActive ? "text-[#1f1f1f]" : "text-[#1f1f1f]/35 hover:text-[#1f1f1f]"
                                    }`}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-colors font-mono ${isActive ? "bg-[#f6f7ed] text-[#1f1f1f]" : "bg-[#f4f4f4] text-[#1f1f1f]/30"
                                        }`}>
                                        {count}
                                    </span>
                                )}
                                {isActive && (
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1f1f1f] rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Scrollable Lead List ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1 pb-24 scroll-container">
                {filtered.length > 0 ? (
                    <div className="space-y-3 pt-2">
                        {filtered.map((l, i) => (
                            <LeadCard
                                key={l.id}
                                lead={l}
                                index={i}
                                onCall={(name) => handleCall(l.id, name)}
                                onStatusChange={handleStatusUpdate}
                            />
                        ))}
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="h-14 w-14 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mb-4 text-[#1f1f1f]/20">
                            <Search className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-[#1f1f1f] mb-1">No leads found</p>
                        <p className="text-xs text-[#1f1f1f]/35">Try adjusting your filter or search term</p>
                        {(search || activeTab !== "all") && (
                            <button
                                onClick={() => { setSearch(""); setActiveTab("all"); }}
                                className="mt-4 text-xs text-[#1f1f1f]/50 hover:text-[#1f1f1f] hover:underline font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Post-call modal */}
            <PostCallModal
                open={showPostCall}
                onClose={() => setShowPostCall(false)}
                leadId={callingLead?.id || ""}
                leadName={callingLead?.name || ""}
                duration={127}
            />
        </div>
    );
};

export default MyLeads;

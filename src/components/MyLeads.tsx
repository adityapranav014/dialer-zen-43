import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const STATUS_CFG: Record<DbLeadStatus, { label: string; pill: string; dot: string; border: string; glow: string }> = {
    new: { label: "New", pill: "bg-primary/12 text-primary", dot: "bg-primary", border: "border-primary/20", glow: "shadow-primary/20" },
    contacted: { label: "Contacted", pill: "bg-blue-500/12 text-blue-400", dot: "bg-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/20" },
    interested: { label: "Interested", pill: "bg-emerald-500/12 text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/20" },
    closed: { label: "Closed", pill: "bg-purple-500/12 text-purple-400", dot: "bg-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/20" },
};

const FILTER_TABS: { id: LeadStatus | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "contacted", label: "Contacted" },
    { id: "interested", label: "Interested" },
    { id: "closed", label: "Closed" },
];

const avatarColors = [
    "from-violet-500 to-purple-600", "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600", "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600", "from-cyan-500 to-blue-600",
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
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ delay: index * 0.035, duration: 0.22 }}
            layout
            className="group relative bg-card/60 border border-border/50 rounded-2xl p-4 hover:border-border/80 hover:bg-card/80 transition-all duration-200"
        >
            {/* Left accent bar based on status */}
            <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${cfg.dot} opacity-60`} />

            <div className="flex items-start gap-3 pl-3">
                {/* Avatar */}
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getColor(lead.name)} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-lg`}>
                    {getInitials(lead.name)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                    {/* Row 1 — name + status */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground leading-tight truncate">{lead.name}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5 shrink-0" />
                                {lead.phone}
                            </p>
                        </div>

                        {/* Status dropdown */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                className={`flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full text-[10px] font-semibold border transition-all ${cfg.pill} ${cfg.border} hover:opacity-80`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                {cfg.label}
                                <ChevronDown className={`h-2.5 w-2.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.93, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.93 }}
                                        transition={{ duration: 0.13 }}
                                        className="absolute right-0 top-full mt-1 z-30 w-36 bg-popover border border-border/80 rounded-xl p-1 shadow-2xl"
                                    >
                                        {statuses.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { onStatusChange(lead.id, s); setMenuOpen(false); }}
                                                className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors ${lead.status === s ? STATUS_CFG[s].pill : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                    }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_CFG[s].dot}`} />
                                                {STATUS_CFG[s].label}
                                                {lead.status === s && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Row 2 — value + note */}
                    <div className="mt-2 flex flex-col gap-1.5">
                        {lead.value && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                <IndianRupee className="h-3 w-3 shrink-0" />
                                <span>{lead.value.replace("₹", "")}</span>
                            </div>
                        )}
                        {lead.note && (
                            <div className="flex items-start gap-1.5 bg-muted/30 border border-border/30 rounded-lg px-2.5 py-1.5">
                                <StickyNote className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{lead.note}</p>
                            </div>
                        )}
                    </div>

                    {/* Row 3 — time + actions */}
                    <div className="flex items-center justify-between mt-3 gap-2">
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(lead.created_at)}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                title="Message"
                                className="h-7 w-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <MessageSquare className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => onCall(lead.name)}
                                className="relative flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 bg-emerald-500 hover:bg-emerald-500/90 shadow-lg shadow-emerald-500/20"
                            >
                                <Phone className="h-3 w-3 relative z-10" />
                                <span className="relative z-10">Call</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
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
        return <div className="p-12 text-center text-muted-foreground">Loading pipeline...</div>;
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
        /* Full-height flex column: sticky header, scrollable body */
        <div className="flex flex-col h-full min-h-0">

            {/* ── Sticky Header ─────────────────────────────────────────── */}
            <div className="shrink-0 pb-4 space-y-4">

                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">My Leads</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {leads.length} leads · Your pipeline
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5">
                    {[
                        { label: "Assigned", value: leads.length, Icon: UserCheck, color: "text-primary", bg: "bg-primary/10" },
                        { label: "Hot Leads", value: hotLeads, Icon: Flame, color: "text-amber-400", bg: "bg-amber-500/10" },
                        { label: "Closed", value: closed, Icon: Star, color: "text-purple-400", bg: "bg-purple-500/10" },
                    ].map(({ label, value, Icon, color, bg }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 * i }}
                            className="bg-card/60 border border-border/50 rounded-2xl p-3 flex flex-col items-center text-center gap-1"
                        >
                            <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center`}>
                                <Icon className={`h-3.5 w-3.5 ${color}`} />
                            </div>
                            <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Pipeline value bar */}
                <div className="flex items-center justify-between bg-card/50 border border-border/40 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs text-muted-foreground font-medium">Pipeline Value</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{fmtValue(totalValue)}</span>
                </div>

                {/* Hot leads alert */}
                {hotLeads > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 border border-amber-500/25 rounded-xl px-3.5 py-2.5"
                        style={{ background: "linear-gradient(120deg, hsl(38 92% 50% / 0.08), transparent)" }}
                    >
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                            <Flame className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{hotLeads} interested lead{hotLeads > 1 ? "s" : ""} 🔥</p>
                            <p className="text-[10px] text-muted-foreground">Follow up now before they go cold</p>
                        </div>
                        <TrendingUp className="h-3.5 w-3.5 text-amber-400 ml-auto shrink-0" />
                    </motion.div>
                )}

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search leads…"
                        className="h-10 pl-10 pr-4 glass-heavy rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border/40 transition-all w-full"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
                        >
                            <X className="h-2.5 w-2.5 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs — horizontal, indicator-based */}
                <div className="flex items-center border-b border-border/40 gap-0 overflow-x-auto no-scrollbar">
                    {FILTER_TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        const count = tab.id === "all" ? leads.length : (counts[tab.id] || 0);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors font-mono ${isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                        }`}>
                                        {count}
                                    </span>
                                )}
                                {/* Active underline indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Scrollable Lead List ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1 pb-24 custom-scrollbar">
                <AnimatePresence mode="popLayout">
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground/40">
                                <Search className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-foreground mb-1">No leads found</p>
                            <p className="text-xs text-muted-foreground">Try adjusting your filter or search term</p>
                            {(search || activeTab !== "all") && (
                                <button
                                    onClick={() => { setSearch(""); setActiveTab("all"); }}
                                    className="mt-4 text-xs text-primary hover:underline font-medium"
                                >
                                    Clear filters
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
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

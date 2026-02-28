import { useState, useMemo, useRef, useEffect } from "react";
import {
    Phone,
    Clock,
    Search,
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
    ArrowLeft,
    Copy,
    Calendar,
    PhoneCall,
    Timer,
    Send,
    ExternalLink,
} from "lucide-react";
import PostCallModal from "@/components/PostCallModal";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { MyLeadsSkeleton } from "@/components/skeletons";
import { useLeads, LeadStatus as DbLeadStatus } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";

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

interface CallLog {
    id: string;
    user_id: string;
    duration_seconds: number;
    created_at: string;
    notes: string | null;
    outcome: string | null;
}

const STATUS_CFG: Record<DbLeadStatus, { label: string; pill: string; dot: string; border: string }> = {
    new: { label: "New", pill: "bg-accent text-foreground", dot: "bg-foreground", border: "border-border" },
    contacted: { label: "Contacted", pill: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400", dot: "bg-blue-500", border: "border-blue-200/60 dark:border-blue-800/60" },
    interested: { label: "Interested", pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-200/60 dark:border-emerald-800/60" },
    closed: { label: "Closed", pill: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400", dot: "bg-purple-500", border: "border-purple-200/60 dark:border-purple-800/60" },
};

const FILTER_TABS: { id: LeadStatus | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "contacted", label: "Contacted" },
    { id: "interested", label: "Interested" },
    { id: "closed", label: "Closed" },
];

const avatarColors = [
    "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400",
    "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",
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

const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

const OUTCOME_CFG: Record<string, { color: string; bg: string }> = {
    "Interested": { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    "Not Interested": { color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
    "Follow Up": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    "Voicemail": { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    "Wrong Number": { color: "text-foreground/50", bg: "bg-muted" },
    "Closed Won": { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
};

// ─── Lead List Row ────────────────────────────────────────────────────────────

const LeadListRow = ({
    lead, isSelected, onSelect,
}: { lead: Lead; isSelected: boolean; onSelect: () => void }) => {
    const cfg = STATUS_CFG[lead.status];

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-150 border-b border-border/50 hover:bg-accent/50 ${
                isSelected ? "bg-accent border-l-2 border-l-foreground" : "border-l-2 border-l-transparent"
            }`}
        >
            {/* Avatar */}
            <div className={`h-9 w-9 rounded-xl ${getColor(lead.name)} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                {getInitials(lead.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-foreground leading-tight truncate">{lead.name}</h3>
                    <span className="text-[10px] text-foreground/25 shrink-0">{timeAgo(lead.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${cfg.pill} ${cfg.border}`}>
                        <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                    {lead.value && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {lead.value}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

const LeadDetailPanel = ({
    lead,
    callLogs,
    loadingCalls,
    onCall,
    onStatusChange,
    onBack,
}: {
    lead: Lead;
    callLogs: CallLog[];
    loadingCalls: boolean;
    onCall: () => void;
    onStatusChange: (status: DbLeadStatus) => void;
    onBack: () => void;
}) => {
    const [statusOpen, setStatusOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const cfg = STATUS_CFG[lead.status];
    const statuses: DbLeadStatus[] = ["new", "contacted", "interested", "closed"];
    const daysSinceCreated = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
    const totalCalls = callLogs.length;
    const totalTalkTime = callLogs.reduce((s, c) => s + (c.duration_seconds || 0), 0);
    const avgDuration = totalCalls > 0 ? Math.round(totalTalkTime / totalCalls) : 0;

    const handleCopy = () => {
        navigator.clipboard.writeText(lead.phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Group call logs by date
    const groupedCalls = useMemo(() => {
        const groups: { date: string; logs: CallLog[] }[] = [];
        let currentDate = "";
        for (const log of callLogs) {
            const d = new Date(log.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            if (d !== currentDate) {
                currentDate = d;
                groups.push({ date: d, logs: [log] });
            } else {
                groups[groups.length - 1].logs.push(log);
            }
        }
        return groups;
    }, [callLogs]);

    return (
        <div className="flex flex-col h-full">
            {/* ── Detail Header ─────────────────────────────────────── */}
            <div className="shrink-0 border-b border-border bg-card px-5 py-4">
                {/* Back button (mobile) */}
                <button
                    onClick={onBack}
                    className="md:hidden flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground mb-3 -ml-1 font-medium"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to list
                </button>

                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`h-12 w-12 rounded-2xl ${getColor(lead.name)} flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-card shadow-md`}>
                        {getInitials(lead.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-foreground leading-tight truncate">{lead.name}</h2>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={handleCopy}
                                            className="mt-1 flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground transition-colors group"
                                        >
                                            <Phone className="h-3 w-3" />
                                            <span>{lead.phone}</span>
                                            {copied ? (
                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">{copied ? "Copied!" : "Click to copy phone number"}</TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Status dropdown */}
                            <div className="relative shrink-0">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setStatusOpen(v => !v)}
                                            className={`flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-full text-[11px] font-medium border transition-all ${cfg.pill} ${cfg.border} hover:opacity-80`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                            {cfg.label}
                                            <ChevronDown className={`h-3 w-3 transition-transform ${statusOpen ? "rotate-180" : ""}`} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="text-xs">Change lead status</TooltipContent>
                                </Tooltip>
                                {statusOpen && (
                                    <div className="absolute right-0 top-full mt-1 z-30 w-40 bg-card border border-border rounded-xl p-1 shadow-lg">
                                        {statuses.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { onStatusChange(s); setStatusOpen(false); }}
                                                className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                                                    lead.status === s ? STATUS_CFG[s].pill : "text-foreground/60 hover:text-foreground hover:bg-muted"
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

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={onCall}
                                        className="flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Phone className="h-3.5 w-3.5" />
                                        Call Now
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Start a call with {lead.name}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="h-8 w-8 rounded-xl bg-muted hover:bg-accent border border-border flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Send WhatsApp message</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats Strip ───────────────────────────────────────── */}
            <div className="shrink-0 grid grid-cols-4 gap-px bg-border border-b border-border">
                {[
                    { label: "Value", tip: "Estimated deal value", value: lead.value || "—", Icon: IndianRupee, col: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Age", tip: "Days since lead was created", value: `${daysSinceCreated}d`, Icon: Calendar, col: "text-foreground/60" },
                    { label: "Calls", tip: "Total calls made to this lead", value: `${totalCalls}`, Icon: PhoneCall, col: "text-blue-600 dark:text-blue-400" },
                    { label: "Avg Call", tip: "Average call duration", value: formatDuration(avgDuration), Icon: Timer, col: "text-amber-600 dark:text-amber-400" },
                ].map(({ label, tip, value, Icon, col }) => (
                    <Tooltip key={label}>
                        <TooltipTrigger asChild>
                            <div className="bg-card p-3 flex flex-col items-center gap-1 cursor-default">
                                <Icon className={`h-3.5 w-3.5 ${col}`} />
                                <p className="text-sm font-semibold text-foreground leading-none">{value}</p>
                                <p className="text-[9px] text-foreground/30 font-medium uppercase tracking-wider">{label}</p>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">{tip}</TooltipContent>
                    </Tooltip>
                ))}
            </div>

            {/* ── Note ──────────────────────────────────────────────── */}
            {lead.note && (
                <div className="shrink-0 mx-4 mt-4 flex items-start gap-2 bg-muted/60 border border-foreground/[0.04] rounded-xl px-3 py-2.5">
                    <StickyNote className="h-3.5 w-3.5 text-foreground/25 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/50 leading-relaxed">{lead.note}</p>
                </div>
            )}

            {/* ── Activity Timeline ─────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0 scroll-container px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-foreground/35" />
                        Call History
                    </h3>
                    {totalCalls > 0 && (
                        <span className="text-[10px] text-foreground/30 font-medium">
                            {totalCalls} call{totalCalls !== 1 ? "s" : ""} · {formatDuration(totalTalkTime)} total
                        </span>
                    )}
                </div>

                {loadingCalls ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-24 bg-muted rounded" />
                                    <div className="h-10 bg-muted rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : groupedCalls.length > 0 ? (
                    <div className="space-y-5">
                        {groupedCalls.map((group) => (
                            <div key={group.date}>
                                {/* Date separator */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-[10px] text-foreground/25 font-medium shrink-0">{group.date}</span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                <div className="space-y-2.5">
                                    {group.logs.map((log) => {
                                        const oCfg = OUTCOME_CFG[log.outcome || ""] || { color: "text-foreground/50", bg: "bg-muted" };
                                        return (
                                            <div key={log.id} className="flex gap-3 group">
                                                {/* Timeline dot */}
                                                <div className="flex flex-col items-center pt-1">
                                                    <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                                                        <PhoneCall className="h-3 w-3 text-foreground/40" />
                                                    </div>
                                                </div>

                                                {/* Call card */}
                                                <div className="flex-1 min-w-0 bg-muted/40 border border-foreground/[0.04] rounded-xl p-3 hover:border-foreground/[0.08] transition-colors">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${oCfg.bg} ${oCfg.color}`}>
                                                                {log.outcome || "Call"}
                                                            </span>
                                                            <span className="text-[10px] text-foreground/25 font-mono flex items-center gap-1">
                                                                <Timer className="h-2.5 w-2.5" />
                                                                {formatDuration(log.duration_seconds)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-foreground/20">
                                                            {formatTime(log.created_at)}
                                                        </span>
                                                    </div>
                                                    {log.notes && (
                                                        <p className="text-[11px] text-foreground/50 leading-relaxed mt-1.5">
                                                            {log.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3 text-foreground/15">
                            <PhoneCall className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold text-foreground/50">No call history</p>
                        <p className="text-[11px] text-foreground/25 mt-1">Make the first call to start tracking</p>
                    </div>
                )}
            </div>

            {/* ── Quick Note Bar (bottom) ───────────────────────────── */}
            <div className="shrink-0 border-t border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={onCall}
                                className="h-9 px-4 rounded-xl text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                Call
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">Start a call</TooltipContent>
                    </Tooltip>
                    <div className="flex-1 flex items-center gap-2 bg-muted border border-border rounded-xl px-3 h-9">
                        <input
                            type="text"
                            placeholder="Add a quick note…"
                            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-foreground/25 focus:outline-none"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="text-foreground/25 hover:text-foreground transition-colors shrink-0">
                                    <Send className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">Send note</TooltipContent>
                        </Tooltip>
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
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [callingLead, setCallingLead] = useState<{ id: string; name: string } | null>(null);
    const [showPostCall, setShowPostCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [loadingCalls, setLoadingCalls] = useState(false);
    const callStartRef = useRef<number>(0);

    const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId) || null, [leads, selectedLeadId]);

    // Auto-select first lead on desktop when none selected
    useEffect(() => {
        if (!selectedLeadId && leads.length > 0 && window.innerWidth >= 768) {
            setSelectedLeadId(leads[0].id);
        }
    }, [leads, selectedLeadId]);

    // Fetch call logs when selected lead changes
    useEffect(() => {
        if (!selectedLeadId) { setCallLogs([]); return; }
        setLoadingCalls(true);
        supabase
            .from("call_logs")
            .select("*")
            .eq("lead_id", selectedLeadId)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setCallLogs(data as CallLog[]);
                setLoadingCalls(false);
            });
    }, [selectedLeadId]);

    const handleCall = (id: string, name: string) => {
        setCallingLead({ id, name });
        callStartRef.current = Date.now();
        setTimeout(() => {
            setCallDuration(Math.max(1, Math.round((Date.now() - callStartRef.current) / 1000)));
            setShowPostCall(true);
        }, 1500);
    };

    const handleStatusUpdate = (leadId: string, status: DbLeadStatus) => {
        updateStatus({ leadId, status });
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return leads.filter(l => {
            const matchesSearch = !q || l.name.toLowerCase().includes(q) || (l.phone && l.phone.includes(search));
            const matchesTab = activeTab === "all" || l.status === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [leads, search, activeTab]);

    if (loading) {
        return <MyLeadsSkeleton />;
    }

    const { counts, hotLeads, closed, totalValue } = (() => {
        const c: Record<string, number> = {};
        let hot = 0, cl = 0, val = 0;
        for (const l of leads) {
            c[l.status] = (c[l.status] || 0) + 1;
            if (l.status === "interested") hot++;
            if (l.status === "closed") cl++;
            const v = (l as any).value || "0";
            val += parseInt(v.replace(/[₹,]/g, "")) || 0;
        }
        return { counts: c, hotLeads: hot, closed: cl, totalValue: val };
    })();

    const fmtValue = (v: number) =>
        v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

    // Mobile: if lead selected, show detail full-screen
    const showDetail = !!selectedLead;

    return (
        <TooltipProvider delayDuration={200}>
        <div className="flex h-full min-h-0 -mx-4 sm:-mx-6 -mt-6 border border-border rounded-xl overflow-hidden bg-card">

            {/* ═══════════════════════════════════════════════════════════
                LEFT PANEL — Lead List
               ═══════════════════════════════════════════════════════════ */}
            <div className={`${showDetail ? "hidden md:flex" : "flex"} flex-col w-full md:w-[380px] lg:w-[420px] md:shrink-0 md:border-r border-border bg-card h-full min-h-0`}>

                {/* ── List Header ───────────────────────────────────────── */}
                <div className="shrink-0 px-4 pt-4 pb-0 space-y-3">

                    {/* Title + stats */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-foreground tracking-tight">My Pipeline</h2>
                            <p className="text-[11px] text-foreground/35 mt-0.5 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {leads.length} leads
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {hotLeads > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 cursor-default">
                                            <Flame className="h-3.5 w-3.5" />
                                            {hotLeads}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">Hot leads (Interested)</TooltipContent>
                                </Tooltip>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 cursor-default">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        {fmtValue(totalValue)}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Total pipeline value</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Compact stats chips */}
                    <div className="flex items-center gap-2">
                        {[
                            { label: "Assigned", tip: "Total leads assigned to you", value: leads.length, icon: UserCheck, cls: "text-foreground bg-accent" },
                            { label: "Hot", tip: "Interested leads — follow up soon", value: hotLeads, icon: Flame, cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" },
                            { label: "Closed", tip: "Successfully closed deals", value: closed, icon: Star, cls: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30" },
                        ].map(({ label, tip, value, icon: Icon, cls }) => (
                            <Tooltip key={label}>
                                <TooltipTrigger asChild>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-default ${cls}`}>
                                        <Icon className="h-3 w-3" />
                                        <span>{value}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">{tip}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/25 group-focus-within:text-foreground transition-colors pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or phone…"
                            className="h-9 pl-9 pr-4 bg-muted/60 border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all w-full"
                        />
                        {search && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors"
                                    >
                                        <X className="h-2.5 w-2.5 text-foreground/40" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-xs">Clear search</TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center border-b border-border gap-0 overflow-x-auto no-scrollbar -mx-4 px-4">
                        {FILTER_TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            const count = tab.id === "all" ? leads.length : (counts[tab.id] || 0);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-1 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
                                        isActive ? "text-foreground" : "text-foreground/35 hover:text-foreground"
                                    }`}
                                >
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full font-mono ${
                                            isActive ? "bg-accent text-foreground" : "bg-transparent text-foreground/30"
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Scrollable Lead List ───────────────────────────────── */}
                <div className="flex-1 overflow-y-auto min-h-0 scroll-container">
                    {filtered.length > 0 ? (
                        <div>
                            {filtered.map((l) => (
                                <LeadListRow
                                    key={l.id}
                                    lead={l}
                                    isSelected={selectedLeadId === l.id}
                                    onSelect={() => setSelectedLeadId(l.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3 text-foreground/15">
                                <Search className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-semibold text-foreground/50 mb-0.5">No leads found</p>
                            <p className="text-[11px] text-foreground/30">Try adjusting your filter or search</p>
                            {(search || activeTab !== "all") && (
                                <button
                                    onClick={() => { setSearch(""); setActiveTab("all"); }}
                                    className="mt-3 text-[11px] text-foreground/40 hover:text-foreground hover:underline font-medium"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                RIGHT PANEL — Lead Detail
               ═══════════════════════════════════════════════════════════ */}
            <div className={`${showDetail ? "flex" : "hidden md:flex"} flex-1 min-w-0 h-full`}>
                {selectedLead ? (
                    <div className="w-full h-full">
                        <LeadDetailPanel
                            key={selectedLead.id}
                            lead={selectedLead}
                            callLogs={callLogs}
                            loadingCalls={loadingCalls}
                            onCall={() => handleCall(selectedLead.id, selectedLead.name)}
                            onStatusChange={(s) => handleStatusUpdate(selectedLead.id, s)}
                            onBack={() => setSelectedLeadId(null)}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4 text-foreground/10">
                            <ExternalLink className="h-7 w-7" />
                        </div>
                        <p className="text-sm font-semibold text-foreground/40 mb-1">Select a lead</p>
                        <p className="text-xs text-foreground/25 max-w-[200px]">
                            Choose a lead from your pipeline to view details & call history
                        </p>
                    </div>
                )}
            </div>

            {/* Post-call modal */}
            <PostCallModal
                open={showPostCall}
                onClose={() => {
                    setShowPostCall(false);
                    // Refresh call logs after logging a call
                    if (selectedLeadId) {
                        supabase
                            .from("call_logs")
                            .select("*")
                            .eq("lead_id", selectedLeadId)
                            .order("created_at", { ascending: false })
                            .then(({ data }) => { if (data) setCallLogs(data as CallLog[]); });
                    }
                }}
                leadId={callingLead?.id || ""}
                leadName={callingLead?.name || ""}
                duration={callDuration}
            />
        </div>
        </TooltipProvider>
    );
};

export default MyLeads;

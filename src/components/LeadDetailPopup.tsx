import { useState, useEffect, useMemo } from "react";
import {
    X,
    Phone,
    Clock,
    Calendar,
    TrendingUp,
    PhoneCall,
    Headphones,
    Copy,
    CheckCircle2,
    AlertCircle,
    Timer,
    Hash,
    Info,
    BarChart3,
} from "lucide-react";
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart,
    CartesianGrid,
} from "recharts";
import { db } from "@/integrations/turso/db";
import { call_logs as call_logs_table } from "@/integrations/turso/schema";
import { eq, desc } from "drizzle-orm";
import { useStatusConfig } from "@/hooks/useStatusConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadInfo {
    id: string;
    name: string;
    phone: string;
    status: string;
    assigned_to: string | null;
    created_at: string;
    updated_at?: string;
    value?: string;
    assignedTo: string | null;
    assignedToColor: string | null;
    assignedToInitials: string | null;
}

interface CallLog {
    id: string;
    user_id: string;
    duration_seconds: number;
    created_at: string;
    notes: string | null;
    outcome: string | null;
}

interface LeadDetailPopupProps {
    lead: LeadInfo | null;
    onClose: () => void;
}

// ─── Status Config (now derived from useStatusConfig inside component) ────────

const OUTCOME_COLORS: Record<string, string> = {
    interested: "#10b981",
    callback: "#3b82f6",
    "not-interested": "#ef4444",
    "no-answer": "#f59e0b",
    voicemail: "#8b5cf6",
    other: "#6b7280",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const daysSince = (iso: string) =>
    Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

// ─── Component ────────────────────────────────────────────────────────────────

const LeadDetailPopup = ({ lead, onClose }: LeadDetailPopupProps) => {
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [loadingCalls, setLoadingCalls] = useState(false);
    const [copied, setCopied] = useState(false);
    const { map: statusConfigMap } = useStatusConfig();

    // Adapter: produce the shape used throughout this component
    const statusConfig = Object.fromEntries(
        Object.entries(statusConfigMap).map(([k, v]) => [k, { label: v.label, color: v.pill.split(" ").find(c => c.startsWith("text-")) || "text-foreground", bg: v.pill, dot: v.dot, border: v.border }])
    ) as Record<string, { label: string; color: string; bg: string; dot: string; border: string }>;

    // Fetch call logs for this lead from DB
    useEffect(() => {
        if (!lead) return;
        setLoadingCalls(true);
        db
            .select()
            .from(call_logs_table)
            .where(eq(call_logs_table.lead_id, lead.id))
            .orderBy(desc(call_logs_table.created_at))
            .then((data) => {
                setCallLogs(data as CallLog[]);
                setLoadingCalls(false);
            })
            .catch(() => setLoadingCalls(false));
    }, [lead?.id]);

    // ── Derived Data ──────────────────────────────────────────────────

    const totalCalls = callLogs.length;
    const totalTalkTimeSecs = useMemo(() => callLogs.reduce((s, c) => s + (c.duration_seconds || 0), 0), [callLogs]);
    const avgCallDuration = totalCalls > 0 ? Math.round(totalTalkTimeSecs / totalCalls) : 0;

    // Call activity by day (last 7 days)
    const callActivityData = useMemo(() => {
        const days: Record<string, { calls: number; duration: number }> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString("en-US", { weekday: "short" });
            days[key] = { calls: 0, duration: 0 };
        }
        for (const c of callLogs) {
            const d = new Date(c.created_at);
            const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
            if (diff <= 6) {
                const key = d.toLocaleDateString("en-US", { weekday: "short" });
                if (days[key]) {
                    days[key].calls++;
                    days[key].duration += c.duration_seconds || 0;
                }
            }
        }
        return Object.entries(days).map(([day, v]) => ({ day, calls: v.calls, duration: Math.round(v.duration / 60) }));
    }, [callLogs]);

    // Outcome distribution
    const outcomeData = useMemo(() => {
        const map: Record<string, number> = {};
        for (const c of callLogs) {
            const key = c.outcome || "other";
            map[key] = (map[key] || 0) + 1;
        }
        return Object.entries(map).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " "),
            value,
            color: OUTCOME_COLORS[name] || OUTCOME_COLORS.other,
        }));
    }, [callLogs]);

    // Copy phone
    const handleCopy = () => {
        if (!lead) return;
        navigator.clipboard.writeText(lead.phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const [activeTab, setActiveTab] = useState<"details" | "analytics" | "history">("details");

    if (!lead) return null;

    const sc = statusConfig[lead.status] || statusConfig.new;
    const age = daysSince(lead.created_at);

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-200" />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                <div className="pointer-events-auto w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2 duration-300">

                    {/* ── Header ───────────────────────────────────────────────── */}
                    <div className="shrink-0 px-5 sm:px-6 pt-5 pb-4 border-b border-border">
                        {/* Mobile drag handle */}
                        <div className="w-10 h-1 rounded-full bg-foreground/10 mx-auto mb-4 sm:hidden" />

                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                {/* Avatar */}
                                <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl ${lead.assignedToColor || "bg-primary/10 text-primary"} flex items-center justify-center text-sm sm:text-base font-bold shrink-0 ring-2 ring-card shadow-md`}>
                                    {lead.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">{lead.name}</h2>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border ${sc.bg} ${sc.color} ${sc.border}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                            {sc.label}
                                        </span>
                                        {lead.value && (
                                            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800">
                                                {lead.value}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-accent/80 transition-all duration-200 shrink-0">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Tab Bar ───────────────────────────────────────────────── */}
                    <div className="shrink-0 flex border-b border-border px-5 sm:px-6 gap-1">
                        {[
                            { id: "details", label: "Details", Icon: Info, count: null as number | null },
                            { id: "analytics", label: "Analytics", Icon: BarChart3, count: null as number | null },
                            { id: "history", label: "Calls", Icon: Headphones, count: totalCalls },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as typeof activeTab)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold border-b-2 transition-all duration-200 ${
                                    activeTab === t.id
                                        ? "text-foreground border-foreground"
                                        : "text-foreground/35 border-transparent hover:text-foreground/60"
                                }`}
                            >
                                <t.Icon className="h-3.5 w-3.5" />
                                {t.label}
                                {t.count != null && (
                                    <span className={`ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        activeTab === t.id ? "bg-foreground/10" : "bg-foreground/[0.04]"
                                    }`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Content ───────────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto scroll-container px-5 sm:px-6 py-5 space-y-5">

                        {activeTab === "details" && (<>
                        {/* ── Quick Info Grid ──────────────────────────────────── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Phone */}
                            <button onClick={handleCopy} className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/60 border border-foreground/[0.04] hover:border-foreground/10 transition-all duration-200 group text-left">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                    <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-widest">Phone</p>
                                    <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">{lead.phone}</p>
                                </div>
                                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-foreground/20" />}
                                </div>
                            </button>

                            {/* Created */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/60 border border-foreground/[0.04]">
                                <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                                    <Calendar className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-widest">Created</p>
                                    <p className="text-[11px] sm:text-xs font-bold text-foreground">{age}d ago</p>
                                </div>
                            </div>

                            {/* Total Calls */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/60 border border-foreground/[0.04]">
                                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                    <PhoneCall className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-widest">Calls</p>
                                    <p className="text-[11px] sm:text-xs font-bold text-foreground">{totalCalls}</p>
                                </div>
                            </div>

                            {/* Avg Duration */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/60 border border-foreground/[0.04]">
                                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                                    <Timer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-widest">Avg Call</p>
                                    <p className="text-[11px] sm:text-xs font-bold text-foreground">{formatDuration(avgCallDuration)}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Assigned BDA ─────────────────────────────────────── */}
                        {lead.assignedTo ? (
                            <div className="p-3.5 rounded-xl bg-accent/40 border border-foreground/[0.04]">
                                <p className="text-[9px] font-semibold uppercase tracking-widest text-foreground/30 mb-2.5">Assigned To</p>
                                <div className="flex items-center gap-3">
                                    <div className={`h-9 w-9 rounded-full ${lead.assignedToColor || "bg-primary/10 text-primary"} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                                        {lead.assignedToInitials || lead.assignedTo.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{lead.assignedTo}</p>
                                        <p className="text-[10px] text-foreground/30 mt-0.5">Lead handler</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border-2 border-dashed border-amber-200/60 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10">
                                <div className="flex items-center gap-2.5">
                                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">This lead hasn't been assigned to any BDA yet</p>
                                </div>
                            </div>
                        )}
                        </>)}

                        {activeTab === "analytics" && (<>
                        {/* ── Call Activity Chart ──────────────────────────────── */}
                        {totalCalls > 0 && (
                            <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Call Activity — Last 7 Days</p>
                                </div>
                                <div className="h-40 sm:h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={callActivityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--foreground)", opacity: 0.35 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: "var(--foreground)", opacity: 0.35 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "var(--card)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                                                }}
                                                formatter={(value: number, name: string) => [value, name === "calls" ? "Calls" : "Talk Time (min)"]}
                                            />
                                            <Area type="monotone" dataKey="calls" stroke="#8b5cf6" fill="url(#callGradient)" strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* ── Outcome Distribution ────────────────────────────── */}
                        {outcomeData.length > 0 && (
                            <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                                <div className="flex items-center gap-2 mb-4">
                                    <Hash className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Call Outcomes</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="h-32 w-32 sm:h-36 sm:w-36 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={outcomeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={28}
                                                    outerRadius={52}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                >
                                                    {outcomeData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        background: "var(--card)",
                                                        border: "1px solid var(--border)",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                        {outcomeData.map((entry) => (
                                            <div key={entry.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-foreground/[0.04]">
                                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                <span className="text-[10px] font-medium text-foreground/60">{entry.name}</span>
                                                <span className="text-[10px] font-bold text-foreground">{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {totalCalls === 0 && (
                            <div className="py-16 text-center">
                                <BarChart3 className="h-8 w-8 text-foreground/10 mx-auto mb-3" />
                                <p className="text-sm font-medium text-foreground/25">No analytics data yet</p>
                                <p className="text-xs text-foreground/15 mt-1">Call activity and outcomes will appear here</p>
                            </div>
                        )}
                        </>)}

                        {activeTab === "history" && (<>                        {/* ── Call History ─────────────────────────────────────── */}
                        <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Headphones className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Call History</p>
                                </div>
                                <span className="text-[10px] font-medium text-foreground/25">{totalCalls} call{totalCalls !== 1 ? "s" : ""}</span>
                            </div>

                            {loadingCalls ? (
                                <div className="py-8 text-center">
                                    <div className="h-5 w-5 border-2 border-foreground/10 border-t-foreground/40 rounded-full animate-spin mx-auto" />
                                    <p className="text-[10px] text-foreground/25 mt-2">Loading calls…</p>
                                </div>
                            ) : callLogs.length === 0 ? (
                                <div className="py-8 text-center">
                                    <PhoneCall className="h-6 w-6 text-foreground/10 mx-auto mb-2" />
                                    <p className="text-[11px] text-foreground/25">No calls recorded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto scroll-container">
                                    {callLogs.slice(0, 20).map((call) => (
                                        <div key={call.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-foreground/[0.04] hover:border-foreground/[0.08] transition-all">
                                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                call.outcome === "interested" ? "bg-emerald-100 dark:bg-emerald-900/40" :
                                                call.outcome === "not-interested" ? "bg-red-100 dark:bg-red-900/40" :
                                                call.outcome === "callback" ? "bg-blue-100 dark:bg-blue-900/40" :
                                                "bg-muted"
                                            }`}>
                                                <PhoneCall className={`h-3 w-3 ${
                                                    call.outcome === "interested" ? "text-emerald-600 dark:text-emerald-400" :
                                                    call.outcome === "not-interested" ? "text-red-600 dark:text-red-400" :
                                                    call.outcome === "callback" ? "text-blue-600 dark:text-blue-400" :
                                                    "text-foreground/30"
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {call.outcome && (
                                                        <span className="text-[10px] font-semibold text-foreground capitalize">{call.outcome.replace(/-/g, " ")}</span>
                                                    )}
                                                    <span className="text-[10px] text-foreground/20 font-medium">·</span>
                                                    <span className="text-[10px] text-foreground/30 font-medium">{formatDuration(call.duration_seconds)}</span>
                                                </div>
                                                {call.notes && (
                                                    <p className="text-[10px] text-foreground/40 mt-1 line-clamp-2">{call.notes}</p>
                                                )}
                                                <p className="text-[9px] text-foreground/20 mt-1">{formatDateTime(call.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Timeline ─────────────────────────────────────────── */}
                        <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-3.5 w-3.5 text-foreground/35" />
                                <p className="text-[11px] font-semibold text-foreground tracking-tight">Timeline</p>
                            </div>
                            <div className="relative pl-5 space-y-4">
                                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-foreground/[0.06]" />

                                {/* Created */}
                                <div className="relative">
                                    <div className="absolute -left-5 top-0.5 h-3.5 w-3.5 rounded-full bg-violet-100 dark:bg-violet-900/40 border-2 border-card flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-foreground">Lead created</p>
                                    <p className="text-[10px] text-foreground/30">{formatDateTime(lead.created_at)}</p>
                                </div>

                                {/* Last Updated */}
                                {lead.updated_at && lead.updated_at !== lead.created_at && (
                                    <div className="relative">
                                        <div className="absolute -left-5 top-0.5 h-3.5 w-3.5 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-card flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        </div>
                                        <p className="text-[11px] font-semibold text-foreground">Last updated</p>
                                        <p className="text-[10px] text-foreground/30">{formatDateTime(lead.updated_at)}</p>
                                    </div>
                                )}

                                {/* Current status */}
                                <div className="relative">
                                    <div className={`absolute -left-5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-card flex items-center justify-center ${sc.bg}`}>
                                        <div className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                    </div>
                                    <p className="text-[11px] font-semibold text-foreground">Current: {sc.label}</p>
                                    <p className="text-[10px] text-foreground/30">{age} day{age !== 1 ? "s" : ""} in pipeline</p>
                                </div>
                            </div>
                        </div>
                        </>)}
                    </div>

                    {/* ── Footer ───────────────────────────────────────────────── */}
                    <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-border flex items-center justify-between">
                        <p className="text-[10px] text-foreground/20 font-medium">ID: {lead.id.slice(0, 8)}…</p>
                        <button onClick={onClose} className="h-8 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all duration-200">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeadDetailPopup;

import { useState, useEffect, useMemo } from "react";
import {
    X,
    Phone,
    Mail,
    TrendingUp,
    PhoneCall,
    Headphones,
    Target,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Flame,
    Award,
    BarChart3,
    Timer,
    Users,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    RadialBarChart,
    RadialBar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { TeamMember } from "@/hooks/useTeam";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallLog {
    id: string;
    lead_id: string;
    duration_seconds: number;
    created_at: string;
    notes: string | null;
    outcome: string | null;
}

interface LeadRow {
    id: string;
    name: string;
    phone: string;
    status: string;
    created_at: string;
}

interface TeamMemberDetailPopupProps {
    member: TeamMember | null;
    onClose: () => void;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const activeStatusConfig = {
    active: { label: "Active", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-800" },
    inactive: { label: "Inactive", dot: "bg-gray-400", bg: "bg-gray-100 dark:bg-gray-800/40", text: "text-gray-500 dark:text-gray-400", border: "border-gray-200/60 dark:border-gray-700" },
};

const AVATAR_COLOR_MAP: Record<string, { bg: string; text: string }> = {
    violet:  { bg: "bg-violet-100 dark:bg-violet-900/40",  text: "text-violet-600 dark:text-violet-300" },
    blue:    { bg: "bg-blue-100 dark:bg-blue-900/40",      text: "text-blue-600 dark:text-blue-300" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-300" },
    orange:  { bg: "bg-orange-100 dark:bg-orange-900/40",  text: "text-orange-600 dark:text-orange-300" },
    pink:    { bg: "bg-pink-100 dark:bg-pink-900/40",      text: "text-pink-600 dark:text-pink-300" },
    cyan:    { bg: "bg-cyan-100 dark:bg-cyan-900/40",      text: "text-cyan-600 dark:text-cyan-300" },
    lime:    { bg: "bg-lime-100 dark:bg-lime-900/40",      text: "text-lime-600 dark:text-lime-300" },
    fuchsia: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40", text: "text-fuchsia-600 dark:text-fuchsia-300" },
    red:     { bg: "bg-red-100 dark:bg-red-900/40",        text: "text-red-600 dark:text-red-300" },
    amber:   { bg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-600 dark:text-amber-300" },
    indigo:  { bg: "bg-indigo-100 dark:bg-indigo-900/40",  text: "text-indigo-600 dark:text-indigo-300" },
    teal:    { bg: "bg-teal-100 dark:bg-teal-900/40",      text: "text-teal-600 dark:text-teal-300" },
};

const LEADS_PIE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#a855f7"];
const OUTCOME_COLORS: Record<string, string> = {
    interested: "#10b981",
    callback: "#3b82f6",
    "not-interested": "#ef4444",
    "no-answer": "#f59e0b",
    voicemail: "#8b5cf6",
    other: "#6b7280",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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

const TeamMemberDetailPopup = ({ member, onClose }: TeamMemberDetailPopupProps) => {
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [loadingCalls, setLoadingCalls] = useState(false);
    const [loadingLeads, setLoadingLeads] = useState(false);

    // Fetch data from DB
    useEffect(() => {
        if (!member) return;

        // Fetch call logs for this member (user_id = app_users.id)
        setLoadingCalls(true);
        supabase
            .from("call_logs")
            .select("*")
            .eq("user_id", member.id)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setCallLogs(data as CallLog[]);
                setLoadingCalls(false);
            });

        // Fetch leads assigned to this member
        setLoadingLeads(true);
        supabase
            .from("leads")
            .select("id, name, phone, status, created_at")
            .eq("assigned_to", member.id)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setLeads(data as LeadRow[]);
                setLoadingLeads(false);
            });
    }, [member?.id]);

    // ── Derived Data ──────────────────────────────────────────────────

    // Lead status breakdown for pie chart
    const leadStatusData = useMemo(() => {
        const map: Record<string, number> = { new: 0, contacted: 0, interested: 0, closed: 0 };
        for (const l of leads) {
            map[l.status] = (map[l.status] || 0) + 1;
        }
        return [
            { name: "New", value: map.new, color: LEADS_PIE_COLORS[0] },
            { name: "Contacted", value: map.contacted, color: LEADS_PIE_COLORS[1] },
            { name: "Interested", value: map.interested, color: LEADS_PIE_COLORS[2] },
            { name: "Closed", value: map.closed, color: LEADS_PIE_COLORS[3] },
        ].filter(d => d.value > 0);
    }, [leads]);

    // Call activity by day (last 14 days)
    const callActivityData = useMemo(() => {
        const days: Record<string, { calls: number; minutes: number }> = {};
        const now = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            days[key] = { calls: 0, minutes: 0 };
        }
        for (const c of callLogs) {
            const d = new Date(c.created_at);
            const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
            if (diff <= 13) {
                const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                if (days[key]) {
                    days[key].calls++;
                    days[key].minutes += Math.round((c.duration_seconds || 0) / 60);
                }
            }
        }
        return Object.entries(days).map(([date, v]) => ({ date, calls: v.calls, minutes: v.minutes }));
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

    // Call stats
    const totalCallDurationSecs = useMemo(() => callLogs.reduce((s, c) => s + (c.duration_seconds || 0), 0), [callLogs]);
    const avgCallDuration = callLogs.length > 0 ? Math.round(totalCallDurationSecs / callLogs.length) : 0;

    // Conversion gauge data
    const conversionGauge = useMemo(() => [{
        name: "Conversion",
        value: member?.conversionRate || 0,
        fill: (member?.conversionRate || 0) >= 45
            ? "#10b981"
            : (member?.conversionRate || 0) >= 30
            ? "#3b82f6"
            : "#f59e0b",
    }], [member?.conversionRate]);

    const [activeTab, setActiveTab] = useState<"overview" | "activity" | "leads" | "calls">("overview");

    if (!member) return null;

    const sc = member.isActive ? activeStatusConfig.active : activeStatusConfig.inactive;
    const joinedDays = daysSince(member.joinedAt);
    const avatarClasses = getAvatarClasses(member.avatarColor, member.id);

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-200" />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                <div className="pointer-events-auto w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2 duration-300">

                    {/* ── Header ───────────────────────────────────────────────── */}
                    <div className="shrink-0 px-5 sm:px-6 pt-5 pb-4 border-b border-border">
                        {/* Mobile drag handle */}
                        <div className="w-10 h-1 rounded-full bg-foreground/10 mx-auto mb-4 sm:hidden" />

                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-4 min-w-0">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl ${avatarClasses} flex items-center justify-center text-base sm:text-lg font-bold shrink-0 ring-2 ring-card shadow-md`}>
                                        {getInitials(member.name)}
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[2px] border-card ${sc.dot} ${member.isActive ? "animate-pulse" : ""}`} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">{member.name}</h2>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${member.isActive ? "animate-pulse" : ""}`} />
                                            {sc.label}
                                        </span>
                                        <span className="text-[10px] text-foreground/25 font-medium">Joined {joinedDays}d ago</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-foreground/35">
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            {member.email}
                                        </span>
                                        {member.phone && (
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="h-3 w-3 shrink-0" />
                                                {member.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-muted/80 transition-all shrink-0">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Tab Bar ───────────────────────────────────────────────── */}
                    <div className="shrink-0 flex border-b border-border px-5 sm:px-6 gap-1">
                        {[
                            { id: "overview", label: "Overview", Icon: Target, count: null as number | null },
                            { id: "activity", label: "Activity", Icon: Activity, count: callLogs.length },
                            { id: "leads", label: "Leads", Icon: Users, count: leads.length },
                            { id: "calls", label: "Calls", Icon: Headphones, count: callLogs.length },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as typeof activeTab)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-all ${
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

                        {activeTab === "overview" && (<>
                        {/* ── Performance KPIs ─────────────────────────────────── */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="p-3 rounded-xl bg-muted/60 border border-foreground/[0.04] text-center">
                                <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-1.5">
                                    <Target className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <p className="text-lg font-bold text-foreground">{member.totalLeads}</p>
                                <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-wider">Total Leads</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/60 border border-foreground/[0.04] text-center">
                                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <p className="text-lg font-bold text-foreground">{member.conversionRate}%</p>
                                <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-wider">Conversion</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/60 border border-foreground/[0.04] text-center">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-1.5">
                                    <PhoneCall className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-lg font-bold text-foreground">{member.totalCalls}</p>
                                <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-wider">Total Calls</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/60 border border-foreground/[0.04] text-center">
                                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-1.5">
                                    <Headphones className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <p className="text-lg font-bold text-foreground">
                                    {member.talkTimeMinutes >= 60
                                        ? `${Math.floor(member.talkTimeMinutes / 60)}h ${member.talkTimeMinutes % 60}m`
                                        : `${member.talkTimeMinutes}m`}
                                </p>
                                <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-wider">Talk Time</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/60 border border-foreground/[0.04] text-center">
                                <div className="h-8 w-8 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center mx-auto mb-1.5">
                                    <Award className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <p className="text-lg font-bold text-foreground">{member.closedLeads}</p>
                                <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-wider">Won Deals</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/60 border border-foreground/[0.04] text-center">
                                <div className="h-8 w-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center mx-auto mb-1.5">
                                    <Timer className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <p className="text-lg font-bold text-foreground">{formatDuration(avgCallDuration)}</p>
                                <p className="text-[9px] font-medium text-foreground/30 uppercase tracking-wider">Avg/Call</p>
                            </div>
                        </div>

                        {/* ── Charts Row ───────────────────────────────────────── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Conversion Rate Gauge */}
                            <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Conversion Rate</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-28 w-28 sm:h-32 sm:w-32 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="65%"
                                                outerRadius="100%"
                                                startAngle={180}
                                                endAngle={0}
                                                data={conversionGauge}
                                            >
                                                <RadialBar
                                                    background={{ fill: "var(--border)" }}
                                                    dataKey="value"
                                                    cornerRadius={12}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-foreground">{member.conversionRate}%</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {member.conversionRate >= 45 ? (
                                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                                                    <ArrowUpRight className="h-3 w-3" />High performer
                                                </span>
                                            ) : member.conversionRate >= 30 ? (
                                                <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
                                                    <Activity className="h-3 w-3" />On track
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                                                    <ArrowDownRight className="h-3 w-3" />Needs attention
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-foreground/25 mt-2">{member.closedLeads} of {member.totalLeads} leads converted</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lead Status Breakdown */}
                            <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Lead Breakdown</p>
                                </div>
                                {leadStatusData.length > 0 ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="h-28 w-28 sm:h-32 sm:w-32 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={leadStatusData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={26}
                                                        outerRadius={48}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        strokeWidth={0}
                                                    >
                                                        {leadStatusData.map((entry, i) => (
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
                                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start flex-1">
                                            {leadStatusData.map((entry) => (
                                                <div key={entry.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-foreground/[0.04]">
                                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-[10px] font-medium text-foreground/60">{entry.name}</span>
                                                    <span className="text-[10px] font-bold text-foreground">{entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        <Target className="h-6 w-6 text-foreground/10 mx-auto mb-2" />
                                        <p className="text-[11px] text-foreground/25">No leads assigned yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        </>)}

                        {activeTab === "activity" && (<>
                        {/* ── Call Activity Chart (14 days) ────────────────────── */}
                        {callLogs.length > 0 && (
                            <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-3.5 w-3.5 text-foreground/35" />
                                        <p className="text-[11px] font-semibold text-foreground tracking-tight">Call Activity — Last 14 Days</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                                            <span className="text-[9px] text-foreground/30">Calls</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                                            <span className="text-[9px] text-foreground/30">Minutes</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-44 sm:h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={callActivityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 9, fill: "var(--foreground)", opacity: 0.3 }}
                                                tickLine={false}
                                                axisLine={false}
                                                interval={window.innerWidth < 640 ? 2 : 1}
                                            />
                                            <YAxis tick={{ fontSize: 10, fill: "var(--foreground)", opacity: 0.3 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "var(--card)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                                                }}
                                            />
                                            <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={12} />
                                            <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} opacity={0.7} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* ── Outcome Distribution ────────────────────────────── */}
                        {outcomeData.length > 0 && (
                            <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Call Outcomes Distribution</p>
                                </div>
                                <div className="h-36 sm:h-44">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={outcomeData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                tick={{ fontSize: 10, fill: "var(--foreground)", opacity: 0.5 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={80}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "var(--card)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                                                }}
                                            />
                                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                                                {outcomeData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                        {callLogs.length === 0 && (
                            <div className="py-16 text-center">
                                <Activity className="h-8 w-8 text-foreground/10 mx-auto mb-3" />
                                <p className="text-sm font-medium text-foreground/25">No activity data yet</p>
                                <p className="text-xs text-foreground/15 mt-1">Call activity and outcomes will appear here</p>
                            </div>
                        )}
                        </>)}

                        {activeTab === "leads" && (
                        <>                        {/* ── Assigned Leads List ──────────────────────────────── */}
                        <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Assigned Leads</p>
                                </div>
                                <span className="text-[10px] font-medium text-foreground/25">{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
                            </div>

                            {loadingLeads ? (
                                <div className="py-8 text-center">
                                    <div className="h-5 w-5 border-2 border-foreground/10 border-t-foreground/40 rounded-full animate-spin mx-auto" />
                                    <p className="text-[10px] text-foreground/25 mt-2">Loading leads…</p>
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Target className="h-6 w-6 text-foreground/10 mx-auto mb-2" />
                                    <p className="text-[11px] text-foreground/25">No leads assigned</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-52 overflow-y-auto scroll-container">
                                    {leads.slice(0, 20).map((lead) => {
                                        const leadSc: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
                                            new: { label: "New", dot: "bg-foreground", bg: "bg-accent", text: "text-foreground", border: "border-border" },
                                            contacted: { label: "Contacted", dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200/60 dark:border-blue-800" },
                                            interested: { label: "Interested", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-800" },
                                            closed: { label: "Closed", dot: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200/60 dark:border-purple-800" },
                                        };
                                        const lsc = leadSc[lead.status] || leadSc.new;
                                        return (
                                            <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-foreground/[0.04] hover:border-foreground/[0.08] transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[11px] font-semibold text-foreground truncate">{lead.name}</p>
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${lsc.bg} ${lsc.text} ${lsc.border}`}>
                                                            <span className={`h-1 w-1 rounded-full ${lsc.dot}`} />
                                                            {lsc.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-foreground/30">
                                                        <Phone className="h-2.5 w-2.5" />
                                                        <span>{lead.phone}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-foreground/20 font-medium shrink-0">{daysSince(lead.created_at)}d ago</p>
                                            </div>
                                        );
                                    })}
                                    {leads.length > 20 && (
                                        <p className="text-center text-[10px] text-foreground/20 pt-2">+{leads.length - 20} more…</p>
                                    )}
                                </div>
                            )}
                        </div>
                        </>)}

                        {activeTab === "calls" && (
                        <>
                        {/* ── Recent Calls ─────────────────────────────────────── */}
                        <div className="p-4 rounded-xl bg-muted/40 border border-foreground/[0.04]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Headphones className="h-3.5 w-3.5 text-foreground/35" />
                                    <p className="text-[11px] font-semibold text-foreground tracking-tight">Recent Calls</p>
                                </div>
                                <span className="text-[10px] font-medium text-foreground/25">{callLogs.length} total</span>
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
                                <div className="space-y-2 max-h-52 overflow-y-auto scroll-container">
                                    {callLogs.slice(0, 15).map((call) => (
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
                                                    <span className="text-[10px] text-foreground/20">·</span>
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
                        </>)}
                    </div>

                    {/* ── Footer ───────────────────────────────────────────────── */}
                    <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[10px] text-foreground/20 font-medium">
                            <span>ID: {member.id.slice(0, 8)}…</span>
                            <span>·</span>
                            <span>Joined {formatDate(member.joinedAt)}</span>
                        </div>
                        <button onClick={onClose} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TeamMemberDetailPopup;

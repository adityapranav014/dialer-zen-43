import {
    Users,
    UserCheck,
    Inbox,
    PhoneCall,
    Timer,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    Minus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BentoCard from "@/components/BentoCard";
import { AdminDashboardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useActivities } from "@/hooks/useActivities";
import { useStatusConfig } from "@/hooks/useStatusConfig";

// ─── Avatar helpers (mirrors TeamManagement) ─────────────────────────────────
const AVATAR_COLOR_MAP: Record<string, { bg: string; text: string }> = {
    violet:  { bg: "bg-violet-100 dark:bg-violet-900/40",   text: "text-violet-600 dark:text-violet-300" },
    blue:    { bg: "bg-blue-100 dark:bg-blue-900/40",       text: "text-blue-600 dark:text-blue-300" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-300" },
    orange:  { bg: "bg-orange-100 dark:bg-orange-900/40",   text: "text-orange-600 dark:text-orange-300" },
    pink:    { bg: "bg-pink-100 dark:bg-pink-900/40",       text: "text-pink-600 dark:text-pink-300" },
    cyan:    { bg: "bg-cyan-100 dark:bg-cyan-900/40",       text: "text-cyan-600 dark:text-cyan-300" },
    lime:    { bg: "bg-lime-100 dark:bg-lime-900/40",       text: "text-lime-600 dark:text-lime-300" },
    fuchsia: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40", text: "text-fuchsia-600 dark:text-fuchsia-300" },
    red:     { bg: "bg-red-100 dark:bg-red-900/40",         text: "text-red-600 dark:text-red-300" },
    amber:   { bg: "bg-amber-100 dark:bg-amber-900/40",     text: "text-amber-600 dark:text-amber-300" },
    indigo:  { bg: "bg-indigo-100 dark:bg-indigo-900/40",   text: "text-indigo-600 dark:text-indigo-300" },
    teal:    { bg: "bg-teal-100 dark:bg-teal-900/40",       text: "text-teal-600 dark:text-teal-300" },
};

const getAvatarClasses = (id: string) => {
    const colors = Object.values(AVATAR_COLOR_MAP);
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const c = colors[Math.abs(hash) % colors.length];
    return `${c.bg} ${c.text}`;
};

const activityDotClass: Record<string, string> = {
    success: "bg-emerald-500",
    neutral: "bg-foreground/20",
    info: "bg-blue-500",
    milestone: "bg-amber-500",
};

/** Colour-coded hit-rate badge per BDA */
const HitRateBadge = ({ calls, conversions }: { calls: number; conversions: number }) => {
    if (calls === 0) return <span className="text-foreground/25 font-medium">—</span>;
    const rate = Math.round((conversions / calls) * 100);
    const colour =
        rate >= 20 ? "text-emerald-600" : rate >= 10 ? "text-amber-600" : "text-foreground/40";
    const Icon = rate >= 20 ? ArrowUp : rate >= 10 ? Minus : ArrowDown;
    return (
        <span className={`inline-flex items-center gap-0.5 font-semibold text-[13px] ${colour}`}>
            <Icon className="h-3 w-3" />
            {rate}%
        </span>
    );
};

/** Status pill colours for activity descriptions — derived from useStatusConfig in component */

/** Render activity description with status names as coloured pills */
const ActivityDescription = ({ text, statusPillMap, statusLabels }: { text: string; statusPillMap: Record<string, string>; statusLabels: string[] }) => {
    const pattern = statusLabels.length > 0 ? new RegExp(`^(.+?)\\s*→\\s*(${statusLabels.join("|")})$`, "i") : null;
    const match = pattern ? text.match(pattern) : null;
    if (!match) return <span>{text}</span>;
    const [, prefix, status] = match;
    const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const pill = statusPillMap[label] || "bg-accent text-foreground";
    return (
        <span>
            {prefix} →{" "}
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none ${pill}`}>
                {label}
            </span>
        </span>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { stats, leaderboard, loading } = useDashboardStats();
    const { activities: teamActivities } = useActivities("team");
    const { statuses: resolvedStatuses } = useStatusConfig();

    // Build activity pill map + label list from dynamic config
    const statusPillMap = Object.fromEntries(resolvedStatuses.map(s => [s.label, s.activityPill]));
    const statusLabels = resolvedStatuses.map(s => s.label);

    const firstName = user?.display_name?.split(" ")[0] || "Admin";
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    if (loading) return <AdminDashboardSkeleton />;

    const todayKpis = [
        {
            label: "Calls Today",
            value: stats.totalCalls,
            icon: PhoneCall,
            colour: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/30",
        },
        {
            label: "Talk Time",
            value: `${stats.totalMinutes}m`,
            icon: Timer,
            colour: "text-violet-500",
            bg: "bg-violet-50 dark:bg-violet-950/30",
        },
        {
            label: "Conversions",
            value: stats.conversions,
            icon: TrendingUp,
            colour: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
        },
    ];

    return (
        <div className="flex flex-col md:flex-1 md:min-h-0">
            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {greeting}, {firstName}
                    </h2>
                    <p className="text-xs text-foreground/40 mt-1 flex items-center gap-1.5">
                        <span className="status-dot-live inline-block" />
                        {dateStr} · Team overview
                    </p>
                </div>
                <button
                    onClick={() => navigate("/team")}
                    className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all duration-200 shrink-0 shadow-sm"
                >
                    <UserCheck className="h-4 w-4" />
                    Manage Team
                </button>
            </div>

            {/* ── Today's KPI strip ── */}
            <div className="shrink-0 grid grid-cols-3 gap-3 mb-4">
                {todayKpis.map((k) => (
                    <div
                        key={k.label}
                        className="surface-card px-4 py-3 flex items-center gap-3"
                    >
                        <div
                            className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${k.bg}`}
                        >
                            <k.icon className={`h-4 w-4 ${k.colour}`} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">
                                {k.value}
                            </p>
                            <p className="text-[11px] text-foreground/45 font-medium mt-0.5 truncate">
                                {k.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main grid ── */}
            <div className="flex flex-col gap-4 md:flex-1 md:min-h-0 md:overflow-hidden">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:flex-1 md:min-h-0">
                    {/* BDA Performance Board */}
                    <BentoCard className="xl:col-span-2 md:flex md:flex-col md:min-h-0 !p-0 overflow-hidden">
                        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Users className="h-4 w-4 text-foreground/35" />
                                BDA Performance Board
                            </h3>
                            <span className="text-[11px] text-foreground/30 font-medium">
                                All time
                            </span>
                        </div>

                        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container px-5 pb-4">
                            {leaderboard.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-sm text-foreground/40">No team members yet</p>
                                    <p className="text-xs text-foreground/25 mt-1">
                                        Add BDAs from the Team page
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-card z-10">
                                        <tr className="border-b border-border">
                                            <th className="text-left pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">
                                                BDA
                                            </th>
                                            <th className="text-right pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">
                                                Calls
                                            </th>
                                            <th className="text-right pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest hidden sm:table-cell">
                                                Talk
                                            </th>
                                            <th className="text-right pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">
                                                Conv.
                                            </th>
                                            <th className="text-right pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">
                                                Hit %
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((bda, idx) => (
                                            <tr
                                                key={bda.id}
                                                className="border-b border-foreground/[0.04] last:border-0 hover:bg-accent/50 transition-all duration-200"
                                            >
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-foreground/40 w-4 shrink-0 text-center">
                                                            {idx + 1}
                                                        </span>
                                                        <div className={`h-7 w-7 rounded-full ${getAvatarClasses(bda.id)} flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ring-card shadow-sm`}>
                                                            {bda.initials}
                                                        </div>
                                                        <span className="font-medium text-foreground text-[13px]">
                                                            {bda.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <span className="font-semibold text-foreground text-[13px]">
                                                        {bda.calls}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right hidden sm:table-cell">
                                                    <span className="text-foreground/55 font-medium">
                                                        {bda.talkTimeMins}m
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <span className="font-semibold text-emerald-600 text-[13px]">
                                                        {bda.conversions}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <HitRateBadge
                                                        calls={bda.calls}
                                                        conversions={bda.conversions}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </BentoCard>

                    {/* Team Activity Feed */}
                    <BentoCard className="md:flex md:flex-col md:min-h-0 !p-0 overflow-hidden">
                        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Inbox className="h-4 w-4 text-foreground/35" />
                                Team Activity
                            </h3>
                            <span className="h-5 min-w-[20px] px-1.5 rounded-lg bg-accent text-foreground/50 text-[10px] font-bold flex items-center justify-center">
                                {teamActivities.length}
                            </span>
                        </div>
                        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container px-6 pb-4">
                            {teamActivities.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-sm text-foreground/40">No team activity yet</p>
                                    <p className="text-xs text-foreground/25 mt-1">
                                        Activity appears as your team logs calls
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {teamActivities.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-3"
                                        >
                                            <div
                                                className={`h-1.5 w-1.5 mt-[7px] rounded-full shrink-0 ${
                                                    activityDotClass[activity.action] ??
                                                    "bg-foreground/20"
                                                }`}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-[13px] text-foreground leading-snug">
                                                    <ActivityDescription text={activity.description} statusPillMap={statusPillMap} statusLabels={statusLabels} />
                                                </p>
                                                <p className="text-[11px] text-foreground/30 mt-0.5 font-medium">
                                                    {new Date(activity.created_at).toLocaleString(
                                                        "en-IN",
                                                        {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </BentoCard>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

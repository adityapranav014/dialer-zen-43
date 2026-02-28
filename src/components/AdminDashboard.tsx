import {
    PhoneCall,
    TrendingUp,
    Users,
    UserCheck,
    Clock,
    Inbox,
    MoreHorizontal,
    CheckCircle2,
    Circle,
    Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BentoCard from "@/components/BentoCard";
import LeadConversionChart from "@/components/LeadConversionChart";
import { AdminDashboardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useActivities } from "@/hooks/useActivities";

const activityDotClass: Record<string, string> = {
    success: "bg-emerald-500",
    neutral: "bg-foreground/20",
    info: "bg-blue-500",
    milestone: "bg-amber-500",
};

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    active: { label: "Active", cls: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800", icon: CheckCircle2 },
    idle: { label: "Idle", cls: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800", icon: Activity },
    offline: { label: "Offline", cls: "bg-muted text-foreground/40 border-border", icon: Circle },
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { stats, leaderboard, loading } = useDashboardStats();
    const { activities: teamActivities } = useActivities("team");

    const firstName = user?.display_name?.split(" ")[0] || "Admin";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

    if (loading) {
        return <AdminDashboardSkeleton />;
    }

    const teamStatsDisplay = [
        { label: "Team Calls", value: stats?.totalCalls ?? 0, icon: PhoneCall },
        { label: "Total Talk Time", value: `${stats?.totalMinutes ?? 0}m`, icon: Clock },
        { label: "Conversions", value: stats?.conversions ?? 0, icon: TrendingUp },
        { label: "BDAs Online", value: leaderboard.length, icon: Users },
    ];

    return (
        <div className="flex flex-col md:h-full md:min-h-0">
            <div className="shrink-0">
            {/* Heading */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">
                        {greeting}, {firstName}
                    </h2>
                    <p className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1.5">
                        <span className="status-dot-live inline-block" />
                        {dateStr} · Team overview
                    </p>
                </div>
                <button onClick={() => navigate("/team")} className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-all shrink-0">
                    <UserCheck className="h-3.5 w-3.5" />
                    Manage Team
                </button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {teamStatsDisplay.map((stat) => (
                    <div key={stat.label} className="surface-card p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                            <stat.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold tracking-tight leading-none mb-1 text-foreground">{stat.value}</p>
                            <p className="text-[10px] text-foreground/30 font-medium uppercase tracking-wider leading-tight">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>
            </div>

            <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container pb-4">
            {/* BDA Status Table + Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                <BentoCard className="xl:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-foreground/40" />
                            BDA Status Board
                        </h3>
                        <button className="text-foreground/30 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left pb-3 px-2 text-[11px] font-medium text-foreground/35 uppercase tracking-wider">BDA</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-foreground/35 uppercase tracking-wider">Calls</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-foreground/35 uppercase tracking-wider hidden sm:table-cell">Talk</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-foreground/35 uppercase tracking-wider">Conv.</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-foreground/35 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((bda) => {
                                    const sc = statusConfig[bda.status] || statusConfig.offline;
                                    const StatusIcon = sc.icon;
                                    return (
                                        <tr
                                            key={bda.id}
                                            className="border-b border-foreground/[0.04] last:border-0 hover:bg-muted/60 transition-colors"
                                        >
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-foreground/60 shrink-0">
                                                        {bda.initials}
                                                    </div>
                                                    <span className="font-medium text-foreground text-[13px]">{bda.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="font-semibold text-foreground text-[13px]">{bda.calls}</span>
                                            </td>
                                            <td className="py-3 px-2 text-right hidden sm:table-cell">
                                                <span className="text-foreground/40 font-medium">{bda.talkTimeMins}m</span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="font-semibold text-emerald-600 text-[13px]">{bda.conversions}</span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold ${sc.cls}`}
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {sc.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>

                {/* Team Activity Feed */}
                <BentoCard>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Inbox className="h-4 w-4 text-foreground/40" />
                            Team Activity
                        </h3>
                        <span className="h-5 min-w-[20px] px-1 rounded-md bg-muted text-foreground/50 text-[10px] font-semibold flex items-center justify-center">
                            {teamActivities.length}
                        </span>
                    </div>
                    {teamActivities.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-foreground/40">No team activity yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {teamActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 group">
                                    <div className={`h-2 w-2 mt-[7px] rounded-full shrink-0 ${activityDotClass[activity.action] ?? "bg-foreground/20"}`} />
                                    <div className="min-w-0">
                                        <p className="text-[13px] text-foreground leading-snug">{activity.description}</p>
                                        <p className="text-[11px] text-foreground/30 mt-0.5 font-medium">
                                            {new Date(activity.created_at).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </BentoCard>
            </div>

            {/* Conversion chart */}
            <BentoCard>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-foreground/40" />
                        Lead Conversion Funnel
                    </h3>
                    <span className="text-[11px] text-foreground/30 font-medium">This week</span>
                </div>
                <LeadConversionChart />
            </BentoCard>
            </div>
        </div>
    );
};

export default AdminDashboard;

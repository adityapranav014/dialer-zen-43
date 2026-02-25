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
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";

/* ─── Hardcoded admin team activity feed ─── */
const teamActivities = [
    {
        id: "t1",
        text: "Ravi completed 25 calls — exceeded daily target",
        time: "Just now",
        type: "milestone" as const,
    },
    {
        id: "t2",
        text: "Sneha converted Mahesh Kumar to qualified lead",
        time: "8 minutes ago",
        type: "success" as const,
    },
    {
        id: "t3",
        text: "New inbound batch: 12 leads assigned to BDA pool",
        time: "22 minutes ago",
        type: "info" as const,
    },
    {
        id: "t4",
        text: "Amit went offline — last active 45 minutes ago",
        time: "45 minutes ago",
        type: "neutral" as const,
    },
    {
        id: "t5",
        text: "Weekly conversion rate improved by 3.2%",
        time: "1 hour ago",
        type: "success" as const,
    },
    {
        id: "t6",
        text: "System: Auto-assignment distributed 8 leads",
        time: "2 hours ago",
        type: "neutral" as const,
    },
];

const activityDotClass: Record<string, string> = {
    success: "bg-emerald-500",
    neutral: "bg-[#1f1f1f]/20",
    info: "bg-blue-500",
    milestone: "bg-amber-500",
};

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    active: { label: "Active", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
    idle: { label: "Idle", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: Activity },
    offline: { label: "Offline", cls: "bg-[#f4f4f4] text-[#1f1f1f]/40 border-black/[0.06]", icon: Circle },
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { stats, leaderboard, loading } = useDashboardStats();

    const firstName = user?.user_metadata?.display_name?.split(" ")[0] || "Admin";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <p className="text-[#1f1f1f]/40 text-sm font-medium">Loading dashboard…</p>
            </div>
        );
    }

    const teamStatsDisplay = [
        { label: "Team Calls", value: stats?.totalCalls ?? 0, icon: PhoneCall },
        { label: "Total Talk Time", value: `${stats?.totalMinutes ?? 0}m`, icon: Clock },
        { label: "Conversions", value: stats?.conversions ?? 0, icon: TrendingUp },
        { label: "BDAs Online", value: leaderboard.filter(b => b.status === "active").length, icon: Users },
    ];

    return (
        <>
            {/* Heading */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">
                        {greeting}, {firstName}
                    </h2>
                    <p className="text-sm text-[#1f1f1f]/40 mt-1 flex items-center gap-1.5">
                        <span className="status-dot-live inline-block" />
                        {dateStr} · Team overview
                    </p>
                </div>
                <button onClick={() => navigate("/team")} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1f1f1f] text-white text-sm font-medium transition-all hover:bg-[#1f1f1f]/90 active:scale-[0.98]">
                    <UserCheck className="h-3.5 w-3.5" />
                    Manage Team
                </button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {teamStatsDisplay.map((stat) => (
                    <BentoCard key={stat.label}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-[#f6f7ed] flex items-center justify-center">
                                <stat.icon className="h-4 w-4 text-[#1f1f1f]" strokeWidth={1.5} />
                            </div>
                        </div>
                        <p className="text-2xl font-semibold text-[#1f1f1f] stat-number">{stat.value}</p>
                        <p className="text-xs text-[#1f1f1f]/40 mt-1 font-medium">{stat.label}</p>
                    </BentoCard>
                ))}
            </div>

            {/* BDA Status Table + Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                <BentoCard className="xl:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#1f1f1f]/40" />
                            BDA Status Board
                        </h3>
                        <button className="text-[#1f1f1f]/30 hover:text-[#1f1f1f] transition-colors p-1.5 rounded-lg hover:bg-[#f4f4f4]">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-black/[0.06]">
                                    <th className="text-left pb-3 px-2 text-[11px] font-medium text-[#1f1f1f]/35 uppercase tracking-wider">BDA</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-[#1f1f1f]/35 uppercase tracking-wider">Calls</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-[#1f1f1f]/35 uppercase tracking-wider hidden sm:table-cell">Talk</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-[#1f1f1f]/35 uppercase tracking-wider">Conv.</th>
                                    <th className="text-right pb-3 px-2 text-[11px] font-medium text-[#1f1f1f]/35 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((bda) => {
                                    const sc = statusConfig[bda.status] || statusConfig.offline;
                                    const StatusIcon = sc.icon;
                                    return (
                                        <tr
                                            key={bda.id}
                                            className="border-b border-black/[0.04] last:border-0 hover:bg-[#f4f4f4]/60 transition-colors"
                                        >
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-full bg-[#f4f4f4] flex items-center justify-center text-[10px] font-semibold text-[#1f1f1f]/60 shrink-0">
                                                        {bda.initials}
                                                    </div>
                                                    <span className="font-medium text-[#1f1f1f] text-[13px]">{bda.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="font-semibold text-[#1f1f1f] text-[13px]">{bda.calls}</span>
                                            </td>
                                            <td className="py-3 px-2 text-right hidden sm:table-cell">
                                                <span className="text-[#1f1f1f]/40 font-medium">{bda.talkTimeMins}m</span>
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
                        <h3 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
                            <Inbox className="h-4 w-4 text-[#1f1f1f]/40" />
                            Team Activity
                        </h3>
                        <span className="h-5 min-w-[20px] px-1 rounded-md bg-[#f4f4f4] text-[#1f1f1f]/50 text-[10px] font-semibold flex items-center justify-center">
                            {teamActivities.length}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {teamActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 group">
                                <div className={`h-2 w-2 mt-[7px] rounded-full shrink-0 ${activityDotClass[activity.type]}`} />
                                <div className="min-w-0">
                                    <p className="text-[13px] text-[#1f1f1f] leading-snug">{activity.text}</p>
                                    <p className="text-[11px] text-[#1f1f1f]/30 mt-0.5 font-medium">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            </div>

            {/* Conversion chart */}
            <BentoCard>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#1f1f1f]/40" />
                        Lead Conversion Funnel
                    </h3>
                    <span className="text-[11px] text-[#1f1f1f]/30 font-medium">This week</span>
                </div>
                <LeadConversionChart />
            </BentoCard>
        </>
    );
};

export default AdminDashboard;

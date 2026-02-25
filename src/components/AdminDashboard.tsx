import { motion } from "framer-motion";
import {
    PhoneCall,
    TrendingUp,
    Users,
    Clock,
    Bell,
    ArrowUpRight,
    MoreHorizontal,
    Shield,
    Activity,
    CheckCircle2,
    Circle,
} from "lucide-react";
import BentoCard from "@/components/BentoCard";
import LeadConversionChart from "@/components/LeadConversionChart";
import { useAuth } from "@/hooks/useAuth";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    active: { label: "Active", cls: "bg-success/15 text-success border-success/25", icon: CheckCircle2 },
    idle: { label: "Idle", cls: "bg-warning/15 text-warning border-warning/25", icon: Activity },
    offline: { label: "Offline", cls: "bg-muted/60 text-muted-foreground border-border", icon: Circle },
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const { stats, leaderboard, activities, loading } = useDashboardStats();

    const firstName = user?.user_metadata?.display_name?.split(" ")[0] || "Admin";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <p className="text-muted-foreground animate-pulse">Loading dashboard metrics...</p>
            </div>
        );
    }

    const teamStatsDisplay = [
        { label: "Team Calls Today", value: stats?.totalCalls ?? 0, icon: PhoneCall, iconColor: "text-primary" },
        { label: "Total Talk Time", value: `${stats?.totalMinutes ?? 0}m`, icon: Clock, iconColor: "text-accent" },
        { label: "Team Conversions", value: stats?.conversions ?? 0, icon: TrendingUp, iconColor: "text-success" },
        { label: "BDAs Online", value: leaderboard.filter(b => b.status === "active").length, icon: Users, iconColor: "text-warning" },
    ];

    return (
        <>
            {/* Heading */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-7 flex items-start justify-between flex-wrap gap-3"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25">
                            <Shield className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                        {greeting}, {firstName} 👋
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span className="status-dot-live inline-block" />
                        {dateStr} · Team performance overview
                    </p>
                </div>
                <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/25 text-primary text-sm font-semibold transition-all duration-150 hover:scale-105">
                    <Users className="h-3.5 w-3.5" />
                    Manage Team
                </button>
            </motion.div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {teamStatsDisplay.map((stat, i) => (
                    <BentoCard key={stat.label} delay={i * 0.05}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/40">
                                <stat.icon className={`h-5 w-5 ${stat.iconColor === "text-primary" ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                        </div>
                        <p className="text-4xl font-extrabold text-foreground tracking-tighter mb-1 mt-auto">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                            {stat.label}
                        </p>
                    </BentoCard>
                ))}
            </div>

            {/* BDA Status Table + Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
                <BentoCard className="xl:col-span-2" delay={0.25}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/20">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground tracking-tight leading-none">
                                    BDA Status Board
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-1 font-medium tracking-wide">Live agent monitoring</p>
                            </div>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground transition-all duration-200 p-2 hover:bg-secondary rounded-xl border border-transparent hover:border-border/40">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-muted-foreground border-b border-border/30">
                                    <th className="text-left pb-4 px-2 font-bold uppercase tracking-widest text-[10px] opacity-60">BDA</th>
                                    <th className="text-right pb-4 px-2 font-bold uppercase tracking-widest text-[10px] opacity-60">Calls</th>
                                    <th className="text-right pb-4 px-2 font-bold uppercase tracking-widest text-[10px] opacity-60 hidden sm:table-cell">Talk Time</th>
                                    <th className="text-right pb-4 px-2 font-bold uppercase tracking-widest text-[10px] opacity-60">Conv.</th>
                                    <th className="text-right pb-4 px-2 font-bold uppercase tracking-widest text-[10px] opacity-60">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((bda, i) => {
                                    const sc = statusConfig[bda.status];
                                    const StatusIcon = sc.icon;
                                    return (
                                        <motion.tr
                                            key={bda.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + i * 0.04 }}
                                            className="group border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-all duration-200 cursor-default"
                                        >
                                            <td className="py-4 px-2">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="h-9 w-9 rounded-full bg-secondary border border-border/40 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0 transition-transform group-hover:scale-105">
                                                        {bda.initials}
                                                    </div>
                                                    <span className="font-bold text-foreground tracking-tight">{bda.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <span className="font-bold text-foreground text-sm tracking-tight">{bda.calls}</span>
                                            </td>
                                            <td className="py-4 px-2 text-right hidden sm:table-cell">
                                                <span className="text-muted-foreground font-medium tracking-tight opacity-80">{bda.talkTimeMins}m</span>
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <span className="font-bold text-emerald-500 text-sm tracking-tight">{bda.conversions}</span>
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-widest ${sc.cls}`}
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {sc.label}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>

                {/* Activity Feed */}
                <BentoCard className="xl:col-span-1" delay={0.35}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-orange-500/5 flex items-center justify-center border border-orange-500/20">
                                <Bell className="h-5 w-5 text-orange-500" />
                            </div>
                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                Team Activity
                            </h3>
                        </div>
                        <span className="h-7 w-7 rounded-lg bg-secondary text-foreground text-xs font-bold flex items-center justify-center border border-border/40 shadow-sm">
                            {activities.length}
                        </span>
                    </div>
                    <div className="space-y-6">
                        {activities.map((activity, i) => (
                            <div key={activity.id} className="flex items-start gap-4 group">
                                <div className={`h-2.5 w-2.5 mt-1.5 rounded-full ${activity.dot} ring-4 ring-background shrink-0 transition-transform group-hover:scale-125`} />
                                <div className="min-w-0">
                                    <p className="text-xs text-foreground leading-relaxed font-semibold tracking-tight group-hover:text-primary transition-colors cursor-default">
                                        {activity.text}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-[0.1em] opacity-50">
                                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            </div>

            <BentoCard delay={0.42}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Lead Conversion Funnel — Team
                    </h3>
                    <span className="text-[11px] text-muted-foreground font-medium">This week</span>
                </div>
                <LeadConversionChart />
            </BentoCard>
        </>
    );
};

export default AdminDashboard;

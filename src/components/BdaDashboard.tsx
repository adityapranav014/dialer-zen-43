import {
    PhoneCall,
    TrendingUp,
    Clock,
    Star,
    Trophy,
    Inbox,
} from "lucide-react";
import BentoCard from "@/components/BentoCard";
import TalkTimeChart from "@/components/TalkTimeChart";
import { BdaDashboardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useActivities } from "@/hooks/useActivities";

const activityDotClass: Record<string, string> = {
    success: "bg-emerald-500",
    neutral: "bg-foreground/25",
    info: "bg-blue-500",
    milestone: "bg-amber-500",
};

const BdaDashboard = () => {
    const { user } = useAuth();
    const { stats, leaderboard, loading } = useDashboardStats();
    const { activities: myActivities } = useActivities("my");

    const firstName = user?.display_name?.split(" ")[0] || "there";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

    if (loading) {
        return <BdaDashboardSkeleton />;
    }

    const myRank = leaderboard.findIndex(b => b.id === user?.id) + 1;

    const myStatsDisplay = [
        { label: "Calls Today", value: stats?.totalCalls ?? 0, icon: PhoneCall },
        { label: "Talk Time", value: `${stats?.totalMinutes ?? 0}m`, icon: Clock },
        { label: "Conversions", value: stats?.conversions ?? 0, icon: TrendingUp },
        { label: "Rank", value: `#${myRank || "—"}`, icon: Star },
    ];

    return (
        <div className="flex flex-col md:h-full md:min-h-0">
            <div className="shrink-0">
            {/* Heading row */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {greeting}, {firstName}
                    </h2>
                    <p className="text-xs text-foreground/40 mt-1 flex items-center gap-1.5">
                        <span className="status-dot-live inline-block" />
                        {dateStr}
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {myStatsDisplay.map((stat) => (
                    <div key={stat.label} className="surface-card p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center shrink-0">
                            <stat.icon className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold tracking-tight leading-none mb-1 text-foreground">{stat.value}</p>
                            <p className="text-[11px] text-foreground/45 font-medium uppercase tracking-widest leading-tight">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>
            </div>

            <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container pb-6">
            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Leaderboard */}
                <BentoCard className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Top Performers
                        </h3>
                        <span className="text-[11px] text-foreground/35 font-medium">This week</span>
                    </div>
                    <div className="space-y-0.5">
                        {leaderboard.map((entry, i) => {
                            const isMe = entry.id === user?.id;
                            return (
                                <div
                                    key={entry.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                        isMe
                                            ? "bg-accent shadow-sm"
                                            : "hover:bg-muted"
                                    }`}
                                >
                                    <span className="text-xs font-semibold w-5 text-center text-foreground/40">
                                        {i + 1}
                                    </span>
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        isMe
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-accent text-foreground/60"
                                    }`}>
                                        {entry.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-foreground truncate">
                                            {entry.name}
                                            {isMe && <span className="ml-1 text-[11px] text-foreground/35">(You)</span>}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-semibold text-foreground">{entry.calls} calls</p>
                                        <p className="text-[11px] text-emerald-600 font-medium">{entry.conversions} conv.</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </BentoCard>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                    {/* Talk Time */}
                    <BentoCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-foreground/35" />
                                Talk Time
                            </h3>
                            <span className="text-[11px] text-foreground/35 font-medium">Goal: 60m</span>
                        </div>
                        <TalkTimeChart minutes={stats?.totalMinutes ?? 0} goal={60} />
                    </BentoCard>

                    {/* My Activity */}
                    <BentoCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Inbox className="h-4 w-4 text-foreground/35" />
                                My Activity
                            </h3>
                            <span className="text-[11px] text-foreground/35 font-medium">{myActivities.length}</span>
                        </div>

                        {myActivities.length === 0 ? (
                            /* Empty state */
                            <div className="empty-state py-8">
                                <div className="empty-state-icon">
                                    <Inbox className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-medium text-foreground/60">No activity yet</p>
                                <p className="text-xs text-foreground/30 mt-1">Make your first call to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {myActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 group">
                                        <div className={`h-2 w-2 mt-[7px] rounded-full shrink-0 ${activityDotClass[activity.action] ?? "bg-foreground/25"}`} />
                                        <div className="min-w-0 flex-1">
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
            </div>
            </div>
        </div>
    );
};

export default BdaDashboard;

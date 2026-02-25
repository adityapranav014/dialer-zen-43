import { useState } from "react";
import { motion } from "framer-motion";
import {
    PhoneCall,
    TrendingUp,
    Clock,
    Star,
    Bell,
    ArrowUpRight,
    MoreHorizontal,
    Trophy,
    Flame,
    ChevronUp,
    ChevronDown,
    Minus,
} from "lucide-react";
import BentoCard from "@/components/BentoCard";
import TalkTimeChart from "@/components/TalkTimeChart";
import PostCallModal from "@/components/PostCallModal";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useLeads } from "@/hooks/useLeads";
import { formatDistanceToNow } from "date-fns";

const trendIcon = (trend: string) => {
    if (trend === "up") return <ChevronUp className="h-3 w-3 text-success" />;
    if (trend === "down") return <ChevronDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const rankColors: Record<number, string> = {
    1: "text-yellow-400",
    2: "text-slate-300",
    3: "text-amber-600",
};

const rankEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const BdaDashboard = () => {
    const { user } = useAuth();
    const { stats, leaderboard, activities, loading } = useDashboardStats();
    const { myLeads } = useLeads();

    const [calling, setCalling] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeLead, setActiveLead] = useState<{ id: string; name: string } | null>(null);

    const firstName = user?.user_metadata?.display_name?.split(" ")[0] || "there";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <p className="text-muted-foreground animate-pulse">Loading your performance data...</p>
            </div>
        );
    }

    const myRank = leaderboard.findIndex(b => b.id === user?.id) + 1;
    const topPercentage = Math.round((myRank / leaderboard.length) * 100) || 100;

    const myStatsDisplay = [
        { label: "My Calls Today", value: stats?.totalCalls ?? 0, icon: PhoneCall, iconBg: "bg-primary/15", iconColor: "text-primary" },
        { label: "My Talk Time", value: `${stats?.totalMinutes ?? 0}m`, icon: Clock, iconBg: "bg-accent/15", iconColor: "text-accent" },
        { label: "My Conversions", value: stats?.conversions ?? 0, icon: TrendingUp, iconBg: "bg-success/15", iconColor: "text-success" },
        { label: "My Rank", value: `#${myRank}`, icon: Star, iconBg: "bg-warning/15", iconColor: "text-warning" },
    ];

    const handleQuickCall = () => {
        const nextLead = myLeads[0]; // Pick first lead for simulation
        if (!nextLead) return;

        setActiveLead({ id: nextLead.id, name: nextLead.name });
        setCalling(true);

        setTimeout(() => {
            setCalling(false);
            setModalOpen(true);
        }, 2000);
    };

    return (
        <>
            {/* Heading */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8 flex items-start justify-between flex-wrap gap-4"
            >
                <div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                        {greeting}, {firstName} 👋
                    </h2>
                    <p className="text-base text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
                        <span className="status-dot-live inline-block" />
                        {dateStr} · Your performance today
                    </p>
                </div>
                <button
                    onClick={handleQuickCall}
                    disabled={calling || myLeads.length === 0}
                    className={`relative flex items-center gap-2.5 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border ${calling
                        ? "bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-500/20"
                        : "bg-primary text-white border-primary/20 shadow-primary/20 hover:bg-primary/90"
                        }`}
                >
                    {calling && (
                        <span className="absolute inset-0 rounded-xl bg-emerald-400 animate-pulse opacity-30" />
                    )}
                    <PhoneCall className={`h-4 w-4 relative z-10 ${calling ? "animate-bounce" : ""}`} />
                    <span className="relative z-10">{calling ? `Calling ${activeLead?.name}...` : "Quick Call"}</span>
                </button>
            </motion.div>

            <PostCallModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                leadId={activeLead?.id || ""}
                leadName={activeLead?.name || ""}
                duration={184}
            />

            {/* Motivational Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 relative overflow-hidden rounded-xl border border-primary/30 px-5 py-4"
                style={{
                    background: "linear-gradient(120deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.08))",
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 glow-primary">
                        <Flame className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">You're ranked #{myRank} this week — Top {topPercentage}%! 🔥</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {myRank === 1
                                ? "You're at the top of the leaderboard! Keep it up! 👑"
                                : `You're doing great! Keep pushing to climb higher!`}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* My Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {myStatsDisplay.map((stat, i) => (
                    <BentoCard key={stat.label} delay={i * 0.06 + 0.2}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground stat-number tracking-tight">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
                    </BentoCard>
                ))}
            </div>

            {/* Leaderboard + Talk Time + Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BentoCard className="md:col-span-2" delay={0.44}>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            Top Performers — This Week
                        </h3>
                    </div>
                    <div className="space-y-1">
                        {leaderboard.map((entry, i) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${entry.id === user?.id
                                    ? "bg-primary/10 border border-primary/25"
                                    : "hover:bg-sidebar-accent/50"
                                    }`}
                            >
                                <span className={`text-sm font-bold w-6 text-center shrink-0 ${rankColors[i + 1] || "text-muted-foreground"}`}>
                                    {rankEmoji[i + 1] || `#${i + 1}`}
                                </span>

                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${entry.id === user?.id ? "bg-gradient-brand glow-primary" : "bg-muted"}`}>
                                    {entry.initials}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold truncate ${entry.id === user?.id ? "text-primary" : "text-foreground"}`}>
                                        {entry.name}
                                        {entry.id === user?.id && <span className="ml-1.5 text-[10px] font-bold text-primary/70">(You)</span>}
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-foreground">{entry.calls} calls</p>
                                    <p className="text-[10px] text-success font-semibold">{entry.conversions} conv.</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </BentoCard>

                <div className="flex flex-col gap-4">
                    <BentoCard delay={0.5}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                My Talk Time
                            </h3>
                            <span className="text-[10px] text-muted-foreground font-medium">Goal: 60m</span>
                        </div>
                        <TalkTimeChart minutes={stats?.totalMinutes ?? 0} goal={60} />
                    </BentoCard>

                    <BentoCard delay={0.56}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" />
                                My Activity
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {activities.map((activity, i) => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <div className={`h-2 w-2 mt-1.5 rounded-full ${activity.dot} shrink-0`} />
                                    <div className="min-w-0">
                                        <p className="text-xs text-foreground leading-relaxed">{activity.text}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </BentoCard>
                </div>
            </div>
        </>
    );
};

export default BdaDashboard;

import { useState } from "react";
import {
    PhoneCall,
    TrendingUp,
    Clock,
    Star,
    Trophy,
    ArrowUpRight,
    Inbox,
} from "lucide-react";
import BentoCard from "@/components/BentoCard";
import TalkTimeChart from "@/components/TalkTimeChart";
import PostCallModal from "@/components/PostCallModal";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useLeads } from "@/hooks/useLeads";

/* ─── Hardcoded activity feed (human-centric) ─── */
const hardcodedActivities = [
    {
        id: "a1",
        text: "You converted Priya Sharma to a qualified lead",
        time: "Just now",
        type: "success" as const,
    },
    {
        id: "a2",
        text: "Called Rahul Verma — no answer, scheduled follow-up",
        time: "12 minutes ago",
        type: "neutral" as const,
    },
    {
        id: "a3",
        text: "New lead assigned: Meena Kapoor from inbound campaign",
        time: "34 minutes ago",
        type: "info" as const,
    },
    {
        id: "a4",
        text: "Completed 5-minute call with Arjun Nair — interested in demo",
        time: "1 hour ago",
        type: "success" as const,
    },
    {
        id: "a5",
        text: "You moved Deepak Gupta to 'Follow-up' stage",
        time: "2 hours ago",
        type: "neutral" as const,
    },
    {
        id: "a6",
        text: "Daily target reached: 20 calls completed",
        time: "3 hours ago",
        type: "milestone" as const,
    },
];

const activityDotClass: Record<string, string> = {
    success: "bg-emerald-500",
    neutral: "bg-[#1f1f1f]/25",
    info: "bg-blue-500",
    milestone: "bg-amber-500",
};

const BdaDashboard = () => {
    const { user } = useAuth();
    const { stats, leaderboard, loading } = useDashboardStats();
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
                <p className="text-[#1f1f1f]/40 text-sm font-medium">Loading your data…</p>
            </div>
        );
    }

    const myRank = leaderboard.findIndex(b => b.id === user?.id) + 1;

    const myStatsDisplay = [
        { label: "Calls Today", value: stats?.totalCalls ?? 0, icon: PhoneCall },
        { label: "Talk Time", value: `${stats?.totalMinutes ?? 0}m`, icon: Clock },
        { label: "Conversions", value: stats?.conversions ?? 0, icon: TrendingUp },
        { label: "Rank", value: `#${myRank || "—"}`, icon: Star },
    ];

    const handleQuickCall = () => {
        const nextLead = myLeads[0];
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
            {/* Heading row */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">
                        {greeting}, {firstName}
                    </h2>
                    <p className="text-sm text-[#1f1f1f]/40 mt-1 flex items-center gap-1.5">
                        <span className="status-dot-live inline-block" />
                        {dateStr}
                    </p>
                </div>
                <button
                    onClick={handleQuickCall}
                    disabled={calling || myLeads.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        calling
                            ? "bg-emerald-500 text-white"
                            : "bg-[#1f1f1f] text-white hover:bg-[#1f1f1f]/90 active:scale-[0.98]"
                    }`}
                >
                    <PhoneCall className={`h-3.5 w-3.5 ${calling ? "animate-pulse" : ""}`} />
                    {calling ? `Calling ${activeLead?.name}…` : "Quick Call"}
                </button>
            </div>

            <PostCallModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                leadId={activeLead?.id || ""}
                leadName={activeLead?.name || ""}
                duration={184}
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {myStatsDisplay.map((stat) => (
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

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Leaderboard */}
                <BentoCard className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Top Performers
                        </h3>
                        <span className="text-[11px] text-[#1f1f1f]/30 font-medium">This week</span>
                    </div>
                    <div className="space-y-0.5">
                        {leaderboard.map((entry, i) => {
                            const isMe = entry.id === user?.id;
                            return (
                                <div
                                    key={entry.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                        isMe
                                            ? "bg-[#f6f7ed]"
                                            : "hover:bg-[#f4f4f4]"
                                    }`}
                                >
                                    <span className="text-xs font-semibold w-5 text-center text-[#1f1f1f]/40">
                                        {i + 1}
                                    </span>
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                                        isMe
                                            ? "bg-[#1f1f1f] text-white"
                                            : "bg-[#f4f4f4] text-[#1f1f1f]/60"
                                    }`}>
                                        {entry.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[#1f1f1f] truncate">
                                            {entry.name}
                                            {isMe && <span className="ml-1 text-[11px] text-[#1f1f1f]/35">(You)</span>}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-semibold text-[#1f1f1f]">{entry.calls} calls</p>
                                        <p className="text-[10px] text-emerald-600 font-medium">{entry.conversions} conv.</p>
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
                            <h3 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#1f1f1f]/40" />
                                Talk Time
                            </h3>
                            <span className="text-[11px] text-[#1f1f1f]/30 font-medium">Goal: 60m</span>
                        </div>
                        <TalkTimeChart minutes={stats?.totalMinutes ?? 0} goal={60} />
                    </BentoCard>

                    {/* My Activity — redesigned with hardcoded data */}
                    <BentoCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
                                <Inbox className="h-4 w-4 text-[#1f1f1f]/40" />
                                My Activity
                            </h3>
                            <span className="text-[11px] text-[#1f1f1f]/30 font-medium">{hardcodedActivities.length}</span>
                        </div>

                        {hardcodedActivities.length === 0 ? (
                            /* Empty state */
                            <div className="empty-state py-8">
                                <div className="empty-state-icon">
                                    <Inbox className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-medium text-[#1f1f1f]/60">No activity yet</p>
                                <p className="text-xs text-[#1f1f1f]/30 mt-1">Make your first call to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {hardcodedActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 group">
                                        <div className={`h-2 w-2 mt-[7px] rounded-full shrink-0 ${activityDotClass[activity.type]}`} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] text-[#1f1f1f] leading-snug">{activity.text}</p>
                                            <p className="text-[11px] text-[#1f1f1f]/30 mt-0.5 font-medium">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </BentoCard>
                </div>
            </div>
        </>
    );
};

export default BdaDashboard;

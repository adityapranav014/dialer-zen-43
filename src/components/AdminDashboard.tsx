import {
    TrendingUp,
    Users,
    UserCheck,
    Inbox,
    MoreHorizontal,
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

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { leaderboard, loading } = useDashboardStats();
    const { activities: teamActivities } = useActivities("team");

    const firstName = user?.display_name?.split(" ")[0] || "Admin";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

    if (loading) {
        return <AdminDashboardSkeleton />;
    }

    return (
        <div className="flex flex-col md:flex-1 md:min-h-0">
            {/* Heading — fixed */}
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
                <button onClick={() => navigate("/team")} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all duration-200 shrink-0 shadow-sm">
                    <UserCheck className="h-4 w-4" />
                    Manage Team
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex flex-col gap-4 md:flex-1 md:min-h-0 md:overflow-hidden">

                {/* BDA table + Activity — each with internal scroll */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:flex-1 md:min-h-0">

                    {/* BDA Status Board */}
                    <BentoCard className="xl:col-span-2 md:flex md:flex-col md:min-h-0 !p-0 overflow-hidden">
                        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Users className="h-4 w-4 text-foreground/35" />
                                BDA Status Board
                            </h3>
                            <button className="text-foreground/25 hover:text-foreground transition-all duration-200 p-1.5 rounded-xl hover:bg-accent">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Sticky thead + scrollable tbody */}
                        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container px-5 pb-4">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-card z-10">
                                    <tr className="border-b border-border">
                                        <th className="text-left pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">BDA</th>
                                        <th className="text-right pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">Calls</th>
                                        <th className="text-right pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest hidden sm:table-cell">Talk</th>
                                        <th className="text-right pb-3 px-2 text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">Conv.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((bda) => (
                                        <tr
                                            key={bda.id}
                                            className="border-b border-foreground/[0.04] last:border-0 hover:bg-accent/50 transition-all duration-200"
                                        >
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground/60 shrink-0">
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                        </div>
                    </BentoCard>
                </div>

                {/* Conversion chart — compact, shrink-0 */}
                <BentoCard className="shrink-0 md:mb-0 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-foreground/35" />
                            Lead Conversion Funnel
                        </h3>
                        <span className="text-[11px] text-foreground/35 font-medium">This week</span>
                    </div>
                    <LeadConversionChart />
                </BentoCard>

            </div>
        </div>
    );
};

export default AdminDashboard;

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import BentoCard from "@/components/BentoCard";
import { PhoneCall, TrendingUp, Clock, Target, BarChart2, Trophy } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="surface-elevated rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-foreground/40 capitalize">{p.dataKey}:</span>
            <span className="font-semibold text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/** Doughnut colours mapped to each outcome category */
const OUTCOME_COLOURS = ["#10b981", "#f59e0b", "#6b7280", "#3b82f6"];

const timePeriods = ["Week", "Month", "Quarter"];

/** Derives a consistent colour class from a user ID (mirrors TeamManagement) */
const AVATAR_COLORS = [
  "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300",
  "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
  "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300",
  "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300",
  "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300",
  "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
  "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300",
  "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300",
  "bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-300",
];

const getAvatarClasses = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const PODIUM_COLOURS = [
  "text-amber-500",
  "text-foreground/40",
  "text-orange-400",
];
const PODIUM_LABELS = ["1st", "2nd", "3rd"];

const Analytics = () => {
  const [activePeriod, setActivePeriod] = useState("Week");
  const { summaryStats, weeklyData, hourlyData, conversionBreakdown } = useAnalytics(activePeriod);
  const { leaderboard } = useDashboardStats(activePeriod);

  const topPerformers = leaderboard
    .filter(m => m.calls > 0)
    .slice(0, 3);

  return (
    <AppLayout
      title="Analytics"
      maxWidthClass="max-w-[1600px]"
      fullHeight
    >
      <div className="flex flex-col md:h-full md:min-h-0">
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between flex-wrap gap-3 mb-5">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Performance Report</h2>
          <div className="flex items-center gap-0.5 p-1 bg-card rounded-xl border border-border shadow-sm">
            {timePeriods.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activePeriod === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/40 hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container pb-6">
          {/* ── Top Performers ── */}
          {topPerformers.length > 0 && (
            <BentoCard className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground tracking-tight">Top Performers</h3>
                <span className="text-[11px] text-foreground/45 font-medium ml-auto">Ranked by conversions · {activePeriod}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topPerformers.map((m, i) => {
                  const hitRate = m.calls > 0 ? Math.round((m.conversions / m.calls) * 100) : 0;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-2xl p-4 surface-card ${
                        i === 0
                          ? "!bg-amber-50/40 dark:!bg-amber-950/20 !border-amber-200/60 dark:!border-amber-800/40"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative shrink-0">
                          <div className={`h-10 w-10 rounded-full ${getAvatarClasses(m.id)} flex items-center justify-center text-xs font-bold ring-2 ring-card shadow-sm`}>
                            {m.initials}
                          </div>
                          <span className={`absolute -top-1 -right-1 text-[10px] font-black ${PODIUM_COLOURS[i]}`}>
                            #{i + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-foreground truncate">{m.name}</p>
                          <p className="text-[11px] text-foreground/45 font-medium">{PODIUM_LABELS[i]} place</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center px-2 py-1.5 rounded-xl surface-inset">
                          <p className="text-sm font-bold text-emerald-600">{hitRate}%</p>
                          <p className="text-[10px] text-foreground/45 font-medium uppercase tracking-wide">Hit rate</p>
                        </div>
                        <div className="text-center px-2 py-1.5 rounded-xl surface-inset">
                          <p className="text-sm font-bold text-foreground">{m.conversions}</p>
                          <p className="text-[10px] text-foreground/45 font-medium uppercase tracking-wide">Conv.</p>
                        </div>
                        <div className="text-center px-2 py-1.5 rounded-xl surface-inset">
                          <p className="text-sm font-bold text-foreground">{m.calls}</p>
                          <p className="text-[10px] text-foreground/45 font-medium uppercase tracking-wide">Calls</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}

          {/* ── Row 1: Trend chart + Outcome doughnut ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Daily Calls & Conversions — 2/3 width */}
            <BentoCard className="md:col-span-2">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-foreground/35" />
                    Daily Calls &amp; Conversions
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                      {summaryStats.totalCalls.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-foreground/50 font-medium">total calls</span>
                    <span className="text-xl font-bold tracking-tight text-emerald-600 leading-none">
                      {summaryStats.conversions.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-foreground/50 font-medium">conversions</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-[11px] pt-0.5">
                  <span className="flex items-center gap-1.5 text-foreground/40">
                    <span className="h-2 w-2 rounded-full bg-foreground/60" />
                    Calls
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground/40">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Conv.
                  </span>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, opacity: 0.5 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, opacity: 0.5 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="calls" stroke="rgba(100,100,100,0.7)" strokeWidth={1.5} fill="url(#callsGrad)" />
                    <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={1.5} fill="url(#convGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>

            {/* Call Outcome Breakdown — 1/3 width, doughnut */}
            <BentoCard className="flex flex-col">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-foreground/35" />
                Call Outcomes
              </h3>
              <p className="text-[11px] text-foreground/50 font-medium mb-4">
                Hit rate: <span className="text-foreground font-bold">{summaryStats.hitRate}</span>
              </p>

              {/* Doughnut */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="h-36 w-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversionBreakdown}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius="62%"
                        outerRadius="90%"
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {conversionBreakdown.map((_, i) => (
                          <Cell key={i} fill={OUTCOME_COLOURS[i % OUTCOME_COLOURS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`${value}%`, name]}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 space-y-2">
                {conversionBreakdown.map((item, i) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: OUTCOME_COLOURS[i % OUTCOME_COLOURS.length] }}
                      />
                      <span className="text-[12px] text-foreground/50 font-medium truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[12px] font-bold text-foreground shrink-0">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Row 2: Peak Hours + Avg Duration stat ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Peak Calling Hours — 2/3 width */}
            <BentoCard className="md:col-span-2">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-foreground/35" />
                    Peak Calling Hours
                  </h3>
                  <p className="text-[11px] text-foreground/35 mt-1">{activePeriod === "Week" ? "Today's call distribution by hour" : `${activePeriod === "Month" ? "30-day" : "90-day"} hourly distribution`}</p>
                </div>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, opacity: 0.5 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, opacity: 0.5 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(128,128,128,0.04)", radius: 4 }} />
                    <Bar dataKey="calls" radius={[4, 4, 0, 0]} fill="#6366f1" fillOpacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>

            {/* Quick stat: Avg Duration */}
            <BentoCard className="flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                  <PhoneCall className="h-4 w-4 text-foreground/35" />
                  Avg. Call Duration
                </h3>
                <p className="text-[11px] text-foreground/35 font-medium">
                  {activePeriod === "Week" ? "This week" : activePeriod === "Month" ? "This month" : "This quarter"}
                </p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <p className="text-4xl font-bold tracking-tight text-foreground leading-none">
                  {summaryStats.avgDuration}
                </p>
                <p className="text-xs text-foreground/35 font-medium mt-2">minutes per call</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-foreground/35 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Hit rate
                </span>
                <span className="text-[13px] font-bold text-emerald-600">{summaryStats.hitRate}</span>
              </div>
            </BentoCard>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from "recharts";
import BentoCard from "@/components/BentoCard";
import { PhoneCall, TrendingUp, Clock, Target, BarChart2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

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

const timePeriods = ["Week", "Month", "Quarter"];

const Analytics = () => {
  const [activePeriod, setActivePeriod] = useState("Week");
  const { summaryStats, weeklyData, hourlyData, conversionBreakdown } = useAnalytics(activePeriod);

  const summaryStatsDisplay = [
    { label: "Total Calls", value: summaryStats.totalCalls.toLocaleString(), icon: PhoneCall },
    { label: "Avg Duration", value: summaryStats.avgDuration, icon: Clock },
    { label: "Conversions", value: summaryStats.conversions.toLocaleString(), icon: TrendingUp },
    { label: "Hit Rate", value: summaryStats.hitRate, icon: Target },
  ];

  return (
    <AppLayout
      title="Analytics"
      maxWidthClass="max-w-[1600px]"
      fullHeight
    >
      <div className="flex flex-col md:h-full md:min-h-0">
        <div className="shrink-0">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Performance Report</h2>
          <p className="text-xs text-foreground/40 mt-1">
            {activePeriod === "Week" ? "This week's" : activePeriod === "Month" ? "This month's" : "This quarter's"} metrics
          </p>
        </div>
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

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStatsDisplay.map((s) => (
          <div key={s.label} className="surface-card p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <s.icon className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight leading-none mb-1 text-foreground">{s.value}</p>
              <p className="text-[10px] text-foreground/35 font-medium uppercase tracking-widest leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
        </div>

        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scroll-container pb-4">
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Area chart */}
        <BentoCard className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-foreground/35" />
              Daily Calls & Conversions
            </h3>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-foreground/40">
                <span className="h-2 w-2 rounded-full bg-foreground" />
                Calls
              </span>
              <span className="flex items-center gap-1.5 text-foreground/40">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Conversions
              </span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.06)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--foreground) / 0.5)", fontSize: 11, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--foreground) / 0.5)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" stroke="hsl(var(--foreground))" strokeWidth={1.5} fill="url(#callsGrad)" />
                <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={1.5} fill="url(#convGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Peak hours */}
        <BentoCard>
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-foreground/35" />
            Peak Calling Hours
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.06)" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--foreground) / 0.5)", fontSize: 10, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--foreground) / 0.5)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--foreground) / 0.03)", radius: 4 }} />
                <Bar dataKey="calls" radius={[4, 4, 0, 0]} fill="hsl(var(--foreground))" fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Conversion rates */}
        <BentoCard>
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-foreground/35" />
            Conversion Breakdown
          </h3>
          <div className="space-y-4">
            {conversionBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-foreground/40 font-medium">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.text}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-700"
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;

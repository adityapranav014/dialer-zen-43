import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from "recharts";
import BentoCard from "@/components/BentoCard";
import { PhoneCall, TrendingUp, Clock, Target, ArrowUpRight, BarChart2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";

const weeklyData = [
  { day: "Mon", calls: 32, conversions: 4 },
  { day: "Tue", calls: 45, conversions: 6 },
  { day: "Wed", calls: 38, conversions: 5 },
  { day: "Thu", calls: 52, conversions: 8 },
  { day: "Fri", calls: 47, conversions: 7 },
  { day: "Sat", calls: 18, conversions: 2 },
  { day: "Sun", calls: 12, conversions: 1 },
];

const hourlyData = [
  { hour: "9am", calls: 8 },
  { hour: "10am", calls: 14 },
  { hour: "11am", calls: 12 },
  { hour: "12pm", calls: 6 },
  { hour: "1pm", calls: 4 },
  { hour: "2pm", calls: 11 },
  { hour: "3pm", calls: 15 },
  { hour: "4pm", calls: 10 },
  { hour: "5pm", calls: 7 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="glass-heavy rounded-xl px-3.5 py-2.5 text-xs shadow-2xl space-y-1"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        <p className="font-bold text-foreground">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
            <span className="font-semibold text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const timePeriods = ["Week", "Month", "Quarter"];

const summaryStats = [
  { label: "Total Calls", value: "244", change: "+18%", icon: PhoneCall, color: "text-primary", bg: "bg-primary/15" },
  { label: "Avg Duration", value: "4:32", change: "+5%", icon: Clock, color: "text-accent", bg: "bg-accent/15" },
  { label: "Conversions", value: "33", change: "+24%", icon: TrendingUp, color: "text-success", bg: "bg-success/15" },
  { label: "Hit Rate", value: "13.5%", change: "+3.2%", icon: Target, color: "text-warning", bg: "bg-warning/15" },
];

const Analytics = () => {
  const [activePeriod, setActivePeriod] = useState("Week");

  return (
    <AppLayout
      title="Analytics"
      maxWidthClass="max-w-4xl"
      headerRight={
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {timePeriods.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${activePeriod === p
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Performance Report</h2>
        <p className="text-sm text-muted-foreground">
          {activePeriod === "Week" ? "This week's" : activePeriod === "Month" ? "This month's" : "This quarter's"} call and conversion metrics.
        </p>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summaryStats.map((s, i) => (
          <BentoCard key={s.label} delay={i * 0.06}>
            <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center mb-4`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground stat-number tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">{s.label}</p>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-success">
              <ArrowUpRight className="h-3 w-3" />
              {s.change} vs last {activePeriod.toLowerCase()}
            </span>
          </BentoCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Area chart: calls + conversions */}
        <BentoCard delay={0.24} className="md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Daily Calls & Conversions
            </h3>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Calls
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success" />
                Conversions
              </span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 15%, 52%)", fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 15%, 52%)", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="hsl(243, 75%, 59%)"
                  strokeWidth={2}
                  fill="url(#callsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stroke="hsl(158, 64%, 52%)"
                  strokeWidth={2}
                  fill="url(#convGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Peak hours bar chart */}
        <BentoCard delay={0.3}>
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            Peak Calling Hours
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(265, 85%, 65%)" />
                    <stop offset="100%" stopColor="hsl(243, 75%, 59%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 15%, 52%)", fontSize: 10, fontWeight: 500 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 15%, 52%)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)", radius: 4 }} />
                <Bar dataKey="calls" radius={[6, 6, 0, 0]} fill="url(#peakGrad)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Hit rate gauge */}
        <BentoCard delay={0.36}>
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-success" />
            Conversion Rate Summary
          </h3>
          <div className="space-y-4">
            {[
              { label: "Overall Hit Rate", value: 13.5, color: "bg-primary", text: "13.5%" },
              { label: "Follow-up Success", value: 62, color: "bg-success", text: "62%" },
              { label: "Cold Call Rate", value: 8, color: "bg-accent", text: "8%" },
              { label: "Voicemail Rate", value: 24, color: "bg-warning", text: "24%" },
            ].map((item, i) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-bold text-foreground">{item.text}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </AppLayout>
  );
};

export default Analytics;

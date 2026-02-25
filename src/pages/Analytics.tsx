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
      <div className="surface-elevated rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="font-semibold text-[#1f1f1f]">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[#1f1f1f]/40 capitalize">{p.dataKey}:</span>
            <span className="font-semibold text-[#1f1f1f]">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const timePeriods = ["Week", "Month", "Quarter"];

const summaryStats = [
  { label: "Total Calls", value: "244", change: "+18%", icon: PhoneCall },
  { label: "Avg Duration", value: "4:32", change: "+5%", icon: Clock },
  { label: "Conversions", value: "33", change: "+24%", icon: TrendingUp },
  { label: "Hit Rate", value: "13.5%", change: "+3.2%", icon: Target },
];

const Analytics = () => {
  const [activePeriod, setActivePeriod] = useState("Week");

  return (
    <AppLayout
      title="Analytics"
      maxWidthClass="max-w-[1600px]"
    >
      {/* Period selector */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">Performance Report</h2>
          <p className="text-sm text-[#1f1f1f]/40 mt-1">
            {activePeriod === "Week" ? "This week's" : activePeriod === "Month" ? "This month's" : "This quarter's"} metrics
          </p>
        </div>
        <div className="flex items-center gap-0.5 p-1 bg-white rounded-lg border border-black/[0.06]">
          {timePeriods.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                activePeriod === p
                  ? "bg-[#1f1f1f] text-white"
                  : "text-[#1f1f1f]/40 hover:text-[#1f1f1f]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summaryStats.map((s) => (
          <BentoCard key={s.label}>
            <div className="h-8 w-8 rounded-lg bg-[#f6f7ed] flex items-center justify-center mb-3">
              <s.icon className="h-4 w-4 text-[#1f1f1f]" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-semibold text-[#1f1f1f] stat-number">{s.value}</p>
            <p className="text-xs text-[#1f1f1f]/40 mt-0.5 mb-2 font-medium">{s.label}</p>
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {s.change} vs last {activePeriod.toLowerCase()}
            </span>
          </BentoCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Area chart */}
        <BentoCard className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#1f1f1f]/40" />
              Daily Calls & Conversions
            </h3>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#1f1f1f]/40">
                <span className="h-2 w-2 rounded-full bg-[#1f1f1f]" />
                Calls
              </span>
              <span className="flex items-center gap-1.5 text-[#1f1f1f]/40">
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
                    <stop offset="5%" stopColor="#1f1f1f" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1f1f1f" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#1f1f1f80", fontSize: 11, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#1f1f1f80", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" stroke="#1f1f1f" strokeWidth={1.5} fill="url(#callsGrad)" />
                <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={1.5} fill="url(#convGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Peak hours */}
        <BentoCard>
          <h3 className="text-sm font-semibold text-[#1f1f1f] mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#1f1f1f]/40" />
            Peak Calling Hours
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#1f1f1f80", fontSize: 10, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#1f1f1f80", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)", radius: 4 }} />
                <Bar dataKey="calls" radius={[4, 4, 0, 0]} fill="#1f1f1f" fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Conversion rates */}
        <BentoCard>
          <h3 className="text-sm font-semibold text-[#1f1f1f] mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-[#1f1f1f]/40" />
            Conversion Breakdown
          </h3>
          <div className="space-y-4">
            {[
              { label: "Overall Hit Rate", value: 13.5, text: "13.5%" },
              { label: "Follow-up Success", value: 62, text: "62%" },
              { label: "Cold Call Rate", value: 8, text: "8%" },
              { label: "Voicemail Rate", value: 24, text: "24%" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#1f1f1f]/40 font-medium">{item.label}</span>
                  <span className="font-semibold text-[#1f1f1f]">{item.text}</span>
                </div>
                <div className="h-1.5 bg-[#f4f4f4] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1f1f1f] transition-all duration-700"
                    style={{ width: `${item.value}%` }}
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

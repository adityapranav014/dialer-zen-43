import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import BentoCard from "@/components/BentoCard";
import BottomNav from "@/components/BottomNav";
import { PhoneCall, TrendingUp, Clock, Target } from "lucide-react";

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

const chartStyle = {
  background: "hsl(222, 47%, 10%)",
  border: "1px solid hsl(215, 25%, 20%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(210, 40%, 96%)",
};

const Analytics = () => {
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <PhoneCall className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">Analytics</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xl font-bold text-foreground mb-1">Weekly Report</h2>
          <p className="text-sm text-muted-foreground mb-6">Performance metrics for this week</p>
        </motion.div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Calls", value: "244", icon: PhoneCall },
            { label: "Avg Duration", value: "4:32", icon: Clock },
            { label: "Conversions", value: "33", icon: TrendingUp },
            { label: "Hit Rate", value: "13.5%", icon: Target },
          ].map((s) => (
            <BentoCard key={s.label}>
              <s.icon className="h-4 w-4 text-muted-foreground mb-3" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </BentoCard>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BentoCard>
            <h3 className="text-sm font-semibold text-foreground mb-4">Daily Calls</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={chartStyle} />
                  <Bar dataKey="calls" radius={[6, 6, 0, 0]} fill="hsl(239, 84%, 67%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          <BentoCard>
            <h3 className="text-sm font-semibold text-foreground mb-4">Peak Hours</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={chartStyle} />
                  <Line type="monotone" dataKey="calls" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Analytics;

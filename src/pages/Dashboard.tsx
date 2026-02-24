import { motion } from "framer-motion";
import { PhoneCall, TrendingUp, Users, Clock, Bell } from "lucide-react";
import BentoCard from "@/components/BentoCard";
import TalkTimeChart from "@/components/TalkTimeChart";
import LeadConversionChart from "@/components/LeadConversionChart";
import ActiveBDAs from "@/components/ActiveBDAs";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name?.split(" ")[0] || "there";
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <PhoneCall className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground tracking-tight">DialFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full" />
            </button>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
              AM
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <h2 className="text-xl font-bold text-foreground mb-1">Good morning, {displayName}</h2>
          <p className="text-sm text-muted-foreground mb-6">Here's your team's performance today</p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Calls Today", value: "47", icon: PhoneCall, change: "+12%" },
            { label: "Talk Time", value: "3h 22m", icon: Clock, change: "+8%" },
            { label: "Conversions", value: "8", icon: TrendingUp, change: "+24%" },
            { label: "Active BDAs", value: "5/8", icon: Users, change: "" },
          ].map((stat, i) => (
            <BentoCard key={stat.label}>
              <div className="flex items-start justify-between mb-3">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                {stat.change && (
                  <span className="text-[10px] font-medium text-success">{stat.change}</span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </BentoCard>
          ))}
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BentoCard className="md:col-span-1">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Total Talk Time
            </h3>
            <TalkTimeChart minutes={202} goal={300} />
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Lead Conversion Funnel
            </h3>
            <LeadConversionChart />
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Active BDAs
            </h3>
            <ActiveBDAs />
          </BentoCard>

          <BentoCard className="md:col-span-1">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
            </h3>
            <div className="space-y-3">
              {[
                { text: "New lead assigned: Priya Sharma", time: "2m ago" },
                { text: "Ravi completed 10 calls today", time: "15m ago" },
                { text: "Follow-up due: Rajesh Kumar", time: "1h ago" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;

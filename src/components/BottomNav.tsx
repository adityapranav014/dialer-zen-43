import { Link, useLocation } from "react-router-dom";
import { Home, Users, BarChart3, User, TrendingUp, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const adminTabs = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Profile", icon: User, path: "/profile" },
];

const bdaTabs = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "My Leads", icon: UserCheck, path: "/leads" },
  { label: "Performance", icon: TrendingUp, path: "/analytics" },
  { label: "Profile", icon: User, path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? adminTabs : bdaTabs;

  return (
    <div
      className="fixed bottom-6 left-0 right-0 z-50 md:hidden flex justify-center px-6"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <nav
        className="glass-heavy rounded-2xl p-1.5 flex items-center gap-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] border-border/40"
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex items-center gap-2.5 py-2 px-4 rounded-xl transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavPill"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <tab.icon
                className={`h-4.5 w-4.5 relative z-10 transition-all duration-300 ${isActive ? "text-primary" : "text-muted-foreground/70"
                  }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-bold text-primary relative z-10 whitespace-nowrap tracking-tight"
                >
                  {tab.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;

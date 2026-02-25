import { Link, useLocation } from "react-router-dom";
import { Home, Users, BarChart3, TrendingUp, UserCheck, UsersRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const adminTabs = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Team", icon: UsersRound, path: "/team" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
];

const bdaTabs = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "My Leads", icon: UserCheck, path: "/leads" },
  { label: "Stats", icon: TrendingUp, path: "/analytics" },
];

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? adminTabs : bdaTabs;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-black/[0.06]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-[#1f1f1f]"
                  : "text-[#1f1f1f]/35 hover:text-[#1f1f1f]/60"
              }`}
            >
              <div className={`p-1 rounded-md ${isActive ? "bg-[#f6f7ed]" : ""}`}>
                <tab.icon
                  className="h-4.5 w-4.5"
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </div>
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;

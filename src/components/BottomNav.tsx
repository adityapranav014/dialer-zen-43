import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, BarChart3, TrendingUp, UserCheck, UsersRound, UserCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const adminTabs = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Team", icon: UsersRound, path: "/team" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Profile", icon: UserCircle, path: "/profile" },
];

const memberTabs = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "My Leads", icon: UserCheck, path: "/leads" },
  { label: "Stats", icon: TrendingUp, path: "/analytics" },
  { label: "Profile", icon: UserCircle, path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, isPlatformView, switchToPlatform } = useAuth();
  const tabs = isAdmin ? adminTabs : memberTabs;

  const handleBackToPlatform = async () => {
    await switchToPlatform();
    navigate("/platform");
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav className="flex items-center justify-around h-14">
        {isSuperAdmin && !isPlatformView && (
          <button
            onClick={handleBackToPlatform}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-primary"
          >
            <div className="p-1 rounded-md">
              <ArrowLeft className="h-4.5 w-4.5" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-medium">Platform</span>
          </button>
        )}
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-foreground/35 hover:text-foreground/60"
              }`}
            >
              <div className={`p-1 rounded-md ${isActive ? "bg-accent" : ""}`}>
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

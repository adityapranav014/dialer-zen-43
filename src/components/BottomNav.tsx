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
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08), 0 -1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? "text-foreground"
                  : "text-foreground/45 hover:text-foreground/70"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-foreground" />
              )}
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-accent"
                  : ""
              }`}
                style={isActive ? {
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.09)"
                } : {}}
              >
                <tab.icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={isActive ? 2.25 : 1.5}
                />
              </div>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
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

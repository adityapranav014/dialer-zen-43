import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCheck,
  TrendingUp,
  LogOut,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Team", icon: UserCheck, path: "/team" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
];

const memberNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Leads", icon: UserCheck, path: "/leads" },
  { label: "Performance", icon: TrendingUp, path: "/analytics" },
];

const SideNav = () => {
  const location = useLocation();
  const { signOut, isAdmin, isSuperAdmin, isPlatformView, currentTenantName, switchToPlatform } =
    useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems = isAdmin ? adminNavItems : memberNavItems;

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 80);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleBackToPlatform = async () => {
    await switchToPlatform();
    navigate("/platform");
  };

  return (
    /* Outer wrapper — expands on hover */
    <div
      className="hidden md:block relative shrink-0"
      style={{ width: open ? 240 : 64, zIndex: 40, transition: "width 200ms cubic-bezier(0.25,0.46,0.45,0.94)" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <nav
        className="absolute inset-y-0 left-0 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
        style={{
          width: open ? 240 : 64,
          transition: "width 200ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 200ms ease",
          boxShadow: open ? "4px 0 40px -4px rgba(0,0,0,0.08)" : "none",
        }}
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-3 px-[13px] shrink-0 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0 shadow-sm">
            <img src="/favicon.svg" alt="DialFlow" className="h-9 w-9 rounded-xl" />
          </div>
          <div
            className="flex flex-col leading-tight min-w-0 overflow-hidden"
            style={{ opacity: open ? 1 : 0, transition: "opacity 150ms ease" }}
          >
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight whitespace-nowrap">
              DialFlow
            </span>
            {currentTenantName && (
              <span className="text-[11px] text-sidebar-foreground/40 truncate max-w-[130px]">
                {currentTenantName}
              </span>
            )}
          </div>
        </div>

        {/* Back to Platform */}
        {isSuperAdmin && !isPlatformView && (
          <div className="px-3 pt-3">
            <button
              onClick={handleBackToPlatform}
              className="w-full flex items-center gap-3 rounded-xl text-sidebar-primary hover:bg-sidebar-accent transition-all duration-200 h-10 px-3"
            >
              <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              <span
                className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                style={{ opacity: open ? 1 : 0, transition: "opacity 150ms ease" }}
              >Back to Platform</span>
            </button>
          </div>
        )}

        {/* Nav items */}
        <div className="flex-1 flex flex-col gap-0.5 px-3 pt-4 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 h-10 px-3 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    : "text-sidebar-foreground/35 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span
                  className="text-[13px] font-medium truncate overflow-hidden whitespace-nowrap"
                  style={{ opacity: open ? 1 : 0, transition: "opacity 150ms ease" }}
                >{item.label}</span>
                {isActive && open && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-foreground shrink-0" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom: settings + sign out */}
        <div className="border-t border-sidebar-border shrink-0 px-3 py-3 space-y-0.5">
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 rounded-xl text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 h-10 px-3"
          >
            <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            <span
              className="text-[13px] font-medium truncate whitespace-nowrap overflow-hidden"
              style={{ opacity: open ? 1 : 0, transition: "opacity 150ms ease" }}
            >Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-xl text-sidebar-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 h-10 px-3"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            <span
              className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
              style={{ opacity: open ? 1 : 0, transition: "opacity 150ms ease" }}
            >Sign out</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default SideNav;

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
    /* Outer wrapper — always 64 px wide in layout flow */
    <div
      className="hidden md:block relative shrink-0"
      style={{ width: 64, zIndex: 40 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon-only rail (always visible) */}
      <nav className="absolute inset-y-0 left-0 w-16 flex flex-col border-r border-border bg-card">
        {/* Brand */}
        <div className="h-14 flex items-center justify-center shrink-0 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <img src="/favicon.svg" alt="DialFlow" className="h-9 w-9 rounded-xl" />
          </div>
        </div>

        {/* Back to Platform icon */}
        {isSuperAdmin && !isPlatformView && (
          <div className="px-3 pt-3">
            <button
              onClick={handleBackToPlatform}
              className="w-full h-10 flex items-center justify-center rounded-xl text-primary hover:bg-accent transition-all duration-200"
            >
              <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Nav icons */}
        <div className="flex-1 flex flex-col gap-1 px-3 pt-4 overflow-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-foreground shadow-sm"
                    : "text-foreground/35 hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </Link>
            );
          })}
        </div>

        {/* Bottom icons */}
        <div className="border-t border-border shrink-0 p-3 flex flex-col items-center gap-1">
          <button
            onClick={() => navigate("/settings")}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted text-foreground/30 hover:text-foreground transition-all duration-200"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleSignOut}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-foreground/30 hover:text-red-500 transition-all duration-200"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Expanded floating drawer (absolute, overlays content on hover) */}
      <nav
        className="absolute inset-y-0 left-0 flex flex-col bg-card border-r border-border"
        style={{
          width: 240,
          boxShadow: open
            ? "4px 0 40px -4px rgba(0,0,0,0.08), 1px 0 0 0 hsl(var(--border))"
            : "none",
          opacity: open ? 1 : 0,
          transform: open ? "translateX(0)" : "translateX(-6px)",
          pointerEvents: open ? "auto" : "none",
          transition:
            "opacity 200ms cubic-bezier(0.25,0.46,0.45,0.94), transform 200ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 200ms ease",
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-3 px-5 shrink-0 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <img src="/favicon.svg" alt="DialFlow" className="h-9 w-9 rounded-xl" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-bold text-foreground tracking-tight">
              DialFlow
            </span>
            {currentTenantName && (
              <span className="text-[11px] text-foreground/40 truncate max-w-[130px]">
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
              className="w-full flex items-center gap-3 rounded-xl text-[13px] font-medium text-primary hover:bg-accent transition-all duration-200 h-10 px-3"
            >
              <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              <span>Back to Platform</span>
            </button>
          </div>
        )}

        {/* Nav section label */}
        <div className="px-5 pt-5 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
            Menu
          </span>
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto overflow-x-hidden">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 h-10 px-3 ${
                  isActive
                    ? "bg-accent text-foreground font-semibold shadow-sm"
                    : "text-foreground/50 hover:text-foreground hover:bg-muted"
                }`}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateX(0)" : "translateX(-4px)",
                  transition: open
                    ? `opacity 200ms ${i * 25 + 40}ms ease, transform 200ms ${i * 25 + 40}ms cubic-bezier(0.25,0.46,0.45,0.94), background-color 150ms ease, color 150ms ease`
                    : "opacity 100ms ease, transform 100ms ease, background-color 150ms ease, color 150ms ease",
                }}
              >
                <item.icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive ? "text-foreground" : "text-foreground/35"
                  }`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom: settings + sign out */}
        <div className="border-t border-border shrink-0 px-3 py-3 space-y-0.5">
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 rounded-xl text-[13px] font-medium text-foreground/45 hover:text-foreground hover:bg-muted transition-all duration-200 h-10 px-3"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(-4px)",
              transition: open
                ? `opacity 200ms ${navItems.length * 25 + 40}ms ease, transform 200ms ${navItems.length * 25 + 40}ms cubic-bezier(0.25,0.46,0.45,0.94)`
                : "opacity 100ms ease, transform 100ms ease",
            }}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            <span className="truncate">Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-xl text-[13px] font-medium text-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 h-10 px-3"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(-4px)",
              transition: open
                ? `opacity 200ms ${navItems.length * 25 + 60}ms ease, transform 200ms ${navItems.length * 25 + 60}ms cubic-bezier(0.25,0.46,0.45,0.94), background-color 150ms ease, color 150ms ease`
                : "opacity 100ms ease, transform 100ms ease, background-color 150ms ease, color 150ms ease",
            }}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default SideNav;

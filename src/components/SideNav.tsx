import { Link, useLocation } from "react-router-dom";
import {
  PhoneCall,
  LayoutDashboard,
  Users,
  BarChart3,
  User,
  Zap,
  Shield,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Profile", icon: User, path: "/profile" },
];

const bdaNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Leads", icon: UserCheck, path: "/leads" },
  { label: "Performance", icon: TrendingUp, path: "/analytics" },
  { label: "Profile", icon: User, path: "/profile" },
];

const SideNav = () => {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = isAdmin ? adminNavItems : bdaNavItems;
  const roleLabel = isAdmin ? "Admin" : "BDA";
  const RoleIcon = isAdmin ? Shield : UserCheck;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav
      className="hidden md:flex fixed inset-y-0 left-0 w-64 border-r border-border/40 z-40 flex-col bg-sidebar-background"
    >
      {/* Brand header */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-border/40 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary shrink-0 transition-transform hover:scale-105 active:scale-95">
          <PhoneCall className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground tracking-tight">DialFlow</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="status-dot-live inline-block" />
            <span className="text-[10px] text-muted-foreground/80 font-semibold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 pt-5 pb-1">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest w-fit ${isAdmin
            ? "bg-primary/5 border-primary/20 text-primary"
            : "bg-success/5 border-success/20 text-success"
            }`}
        >
          <RoleIcon className="h-3 w-3" />
          {roleLabel} View
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-4 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-1">
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group ${isActive
                ? "nav-active"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <item.icon
                className={`h-4 w-4 shrink-0 relative z-10 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="relative z-10 tracking-tight">{item.label}</span>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto relative z-10"
                >
                  <Zap className="h-3 w-3 text-primary/70 fill-primary/20" />
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User section at bottom */}
      <div className="px-4 py-5 border-t border-border/40 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sidebar-accent/50 transition-all duration-300 group cursor-pointer border border-transparent hover:border-border/30">
          <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate tracking-tight">{displayName.split(" ")[0]}</p>
            <p className={`text-[10px] font-bold truncate uppercase tracking-widest leading-none mt-1 opacity-70 ${isAdmin ? "text-primary" : "text-success"}`}>
              {roleLabel}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg"
            title="Sign out"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default SideNav;

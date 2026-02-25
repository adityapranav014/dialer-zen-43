import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCheck,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Team", icon: UserCheck, path: "/team" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
];

const bdaNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Leads", icon: UserCheck, path: "/leads" },
  { label: "Performance", icon: TrendingUp, path: "/analytics" },
];

const SideNav = () => {
  const location = useLocation();
  const { user, signOut, isAdmin, avatarUrl, displayName } = useAuth();
  const navigate = useNavigate();

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = isAdmin ? adminNavItems : bdaNavItems;
  const roleLabel = isAdmin ? "Admin" : "BDA";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="hidden md:flex w-60 shrink-0 border-r border-black/[0.06] bg-white flex-col h-[100dvh] overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-black/[0.06] shrink-0">
        <div className="h-7 w-7 rounded-lg bg-[#1f1f1f] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-white tracking-tight">DF</span>
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-[#1f1f1f] tracking-tight">DialFlow</span>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[11px] font-medium text-[#1f1f1f]/35 uppercase tracking-wider">
          Menu
        </p>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 space-y-0.5 overflow-y-auto scroll-container">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#f6f7ed] text-[#1f1f1f] font-semibold"
                  : "text-[#1f1f1f]/55 hover:text-[#1f1f1f] hover:bg-[#f4f4f4]"
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-[#1f1f1f]" : "text-[#1f1f1f]/40"
                }`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User section at bottom */}
      <div className="px-3 py-4 border-t border-black/[0.06] shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f4f4f4] transition-colors group cursor-pointer">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#1f1f1f] flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#1f1f1f] truncate">{displayName.split(" ")[0]}</p>
            <p className="text-[11px] text-[#1f1f1f]/40 truncate">{roleLabel}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1f1f1f]/30 hover:text-red-500 p-1 rounded"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default SideNav;

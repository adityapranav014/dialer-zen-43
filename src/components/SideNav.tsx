import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCheck,
  TrendingUp,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const SIDEBAR_KEY = "sidebar-expanded";

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

/** Wrapper: renders children always, but fades + collapses width when sidebar is collapsed */
const FadeText = ({
  visible,
  children,
  className = "",
}: {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
      visible ? "max-w-[160px] opacity-100 ml-3" : "max-w-0 opacity-0 ml-0"
    } ${className}`}
  >
    {children}
  </span>
);

const SideNav = () => {
  const location = useLocation();
  const { signOut, isAdmin, isSuperAdmin, isPlatformView, avatarUrl, displayName, currentTenantName, switchToPlatform } = useAuth();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored === null ? false : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(expanded));
  }, [expanded]);

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = isAdmin ? adminNavItems : memberNavItems;
  const roleLabel = isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Member";

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await signOut();
    navigate("/");
  };

  const handleBackToPlatform = async () => {
    await switchToPlatform();
    navigate("/platform");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="hidden md:block relative shrink-0 group/sidebar">
        <nav
          className={`flex border-r border-border bg-card flex-col h-[100dvh] transition-[width] duration-300 ease-in-out ${
            expanded ? "w-60" : "w-[68px]"
          }`}
        >
          {/* ── Brand ── */}
          <div className="flex items-center h-14 border-b border-border shrink-0 px-4">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <img src="/favicon.svg" alt="DialFlow" className="h-8 w-8 rounded-lg" />
            </div>
            <FadeText visible={expanded}>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  DialFlow
                </span>
                {currentTenantName && (
                  <span className="text-[10px] text-foreground/40 truncate max-w-[120px]">
                    {currentTenantName}
                  </span>
                )}
              </span>
            </FadeText>
          </div>

          {/* ── Back to Platform (super admin only) ── */}
          {isSuperAdmin && !isPlatformView && (
            <div className="px-3 pt-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleBackToPlatform}
                    className="w-full flex items-center rounded-lg text-[13px] font-medium text-primary hover:bg-primary/10 transition-colors h-10 px-3"
                  >
                    <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                    <FadeText visible={expanded}>
                      <span>Back to Platform</span>
                    </FadeText>
                  </button>
                </TooltipTrigger>
                {!expanded && (
                  <TooltipContent side="right" sideOffset={8} className="text-xs font-medium px-3 py-1.5">
                    Back to Platform
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          )}

          {/* ── Nav items ── */}
          <div className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden scroll-container px-3 pt-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const linkEl = (
                <Link
                  to={item.path}
                  className={`flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150 h-10 px-3 ${
                    isActive
                      ? "bg-accent text-foreground font-semibold"
                      : "text-foreground/55 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-foreground" : "text-foreground/40"
                    }`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <FadeText visible={expanded}>
                    <span>{item.label}</span>
                  </FadeText>
                </Link>
              );

              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  {!expanded && (
                    <TooltipContent
                      side="right"
                      sideOffset={8}
                      className="text-xs font-medium px-3 py-1.5"
                    >
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>

          {/* ── Bottom section ── */}
          <div className="border-t border-border shrink-0 px-3 py-3 space-y-1">
            {/* User profile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => navigate("/profile")}
                  className="flex items-center rounded-lg hover:bg-muted transition-colors group cursor-pointer h-11 px-3"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0">
                      {initials}
                    </div>
                  )}
                  <FadeText visible={expanded} className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                          {displayName.split(" ")[0]}
                        </p>
                        <p className="text-[11px] text-foreground/40 truncate leading-tight">
                          {roleLabel}
                        </p>
                      </span>
                      <button
                        onClick={handleSignOut}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground/30 hover:text-red-500 p-1 rounded shrink-0"
                        title="Sign out"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </FadeText>
                </div>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="text-xs font-medium px-3 py-1.5"
                >
                  <p>{displayName}</p>
                  <p className="text-foreground/50">{roleLabel}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </nav>

        {/* ── Edge toggle — floating pill on sidebar border ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="absolute top-1/2 -translate-y-1/2 -right-3 z-40 h-6 w-6 rounded-full border border-border bg-card shadow-sm flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-muted hover:shadow-md opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200"
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <div className="relative h-3.5 w-3.5">
                <ChevronsLeft
                  className={`absolute inset-0 h-3.5 w-3.5 transition-all duration-300 ${
                    expanded ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                  }`}
                  strokeWidth={2}
                />
                <ChevronsRight
                  className={`absolute inset-0 h-3.5 w-3.5 transition-all duration-300 ${
                    expanded ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                  }`}
                  strokeWidth={2}
                />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={6}
            className="text-xs font-medium"
          >
            {expanded ? "Collapse" : "Expand"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default SideNav;

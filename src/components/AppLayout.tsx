import { ReactNode, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Settings, Moon, Sun, Monitor, HelpCircle, Star, LogOut, Maximize, Minimize } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";
import NotificationPanel from "@/components/NotificationPanel";
import GlobalSearch from "@/components/GlobalSearch";
import QuickActions from "@/components/QuickActions";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

interface AppLayoutProps {
  title: string;
  maxWidthClass?: string;
  fullHeight?: boolean;
  children: ReactNode;
}

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/team": "Team",
  "/analytics": "Analytics",
  "/profile": "Profile",
  "/help": "Help & Docs",
  "/settings": "Account Settings",
  "/whats-new": "What's New",
};

const accountItems = [
  { label: "Account Settings", icon: Settings, desc: "Profile & preferences" },
];

const themeOptions: { id: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const supportItems = [
  { label: "Help & Docs", icon: HelpCircle, desc: "Guides and documentation" },
  { label: "What's New", icon: Star, desc: "Latest features" },
];

export const AppLayout = ({
  title,
  maxWidthClass = "max-w-[1600px]",
  fullHeight = false,
  children,
}: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, isSuperAdmin, isPlatformView, avatarUrl, displayName, currentTenantName } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentPage = breadcrumbMap[location.pathname] || title;
  const email = user?.email || "";
  const roleLabel = isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Member";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex bg-background">
      {/* Sidebar — desktop only */}
      <SideNav />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* ─── Global Header ─── */}
        <header className="shrink-0 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <button
              onClick={() => navigate(isSuperAdmin ? "/platform" : "/dashboard")}
              className="text-foreground/35 font-medium hidden sm:inline hover:text-foreground cursor-pointer transition-all duration-200"
            >
              DialFlow
            </button>
            {currentTenantName && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-foreground/25 hidden sm:inline shrink-0" />
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-foreground/35 font-medium hidden sm:inline truncate max-w-[120px] hover:text-foreground cursor-pointer transition-all duration-200"
                >
                  {currentTenantName}
                </button>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-foreground/25 hidden sm:inline shrink-0" />
            <span className="text-foreground font-bold truncate">{currentPage}</span>
          </div>

          {/* Right: Search + Notifications + Avatar */}
          <div className="flex items-center gap-2">
            {/* Global search (desktop + mobile triggers inside) */}
            <GlobalSearch />

            {/* Quick actions */}
            <QuickActions />

            {/* Fullscreen toggle — desktop only */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleFullscreen}
                    className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-xl text-foreground/40 hover:text-foreground hover:bg-accent transition-all duration-200"
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Notifications */}
            <NotificationPanel />

            {/* Profile avatar popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden ring-2 ring-background shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    initials
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-72 p-0 rounded-2xl border border-border shadow-xl bg-card">
                {/* User info */}
                <div className="p-4 flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-foreground/40 truncate">{email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent text-foreground/70">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <Separator className="bg-foreground/[0.06]" />

                {/* Account section */}
                <div className="py-1.5">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/30">Account</p>
                  {accountItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.label === "Account Settings") navigate("/settings");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-accent transition-all duration-200 group"
                    >
                      <div className="h-7 w-7 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent transition-all duration-200">
                        <item.icon className="h-3.5 w-3.5 text-foreground/40 group-hover:text-foreground transition-all duration-200" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                        <p className="text-[10px] text-foreground/30">{item.desc}</p>
                      </div>
                    </button>
                  ))}

                  {/* Appearance — inline theme picker */
                  <div className="px-4 py-2">
                    <button
                      onClick={() => setShowThemePicker((v) => !v)}
                      className="w-full flex items-center gap-2.5 -mx-4 px-4 py-2 rounded-none hover:bg-accent transition-all duration-200 group"
                      style={{ width: "calc(100% + 2rem)" }}
                    >
                      <div className="h-7 w-7 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent transition-all duration-200">
                        <Moon className="h-3.5 w-3.5 text-foreground/40 group-hover:text-foreground transition-all duration-200" />
                      </div>
                      <div className="min-w-0 text-left flex-1">
                        <p className="text-[13px] font-medium text-foreground">Appearance</p>
                        <p className="text-[10px] text-foreground/30">Theme & display</p>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 text-foreground/20 transition-transform duration-200 ${showThemePicker ? "rotate-90" : ""}`} />
                    </button>
                    {showThemePicker && (
                      <div className="flex items-center gap-1.5 mt-2 p-1 bg-accent/60 rounded-xl">
                        {themeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setTheme(opt.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                              theme === opt.id
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-foreground/40 hover:text-foreground"
                            }`}
                          >
                            <opt.icon className="h-3 w-3" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-foreground/[0.06]" />

                {/* Support section */}
                <div className="py-1.5">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/30">Support</p>
                  {supportItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.label === "Help & Docs") navigate("/help");
                        if (item.label === "What's New") navigate("/whats-new");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-accent transition-all duration-200 group"
                    >
                      <div className="h-7 w-7 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent transition-all duration-200">
                        <item.icon className="h-3.5 w-3.5 text-foreground/40 group-hover:text-foreground transition-all duration-200" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                        <p className="text-[10px] text-foreground/30">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Separator className="bg-foreground/[0.06]" />

                {/* Sign out */}
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/30 group-hover:bg-red-100 dark:group-hover:bg-red-950/50 flex items-center justify-center shrink-0 transition-all duration-200">
                      <LogOut className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <p className="text-[13px] font-medium text-red-600 dark:text-red-400">Sign Out</p>
                  </button>
                </div>

                <div className="px-4 pb-3 pt-1">
                  <p className="text-[10px] text-foreground/20 text-center font-medium">DialFlow v1.0.0</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* ─── Content Area ─── */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <div className={`h-full ${fullHeight ? "overflow-y-auto md:overflow-hidden md:flex md:flex-col scroll-container md:scroll-container-none" : "overflow-y-auto scroll-container"}`}>
            <div className={`${maxWidthClass} mx-auto w-full px-4 sm:px-6 pt-6 ${fullHeight ? "pb-24 md:pb-0 md:flex-1 md:flex md:flex-col md:min-h-0" : "pb-24 md:pb-6"}`}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
};

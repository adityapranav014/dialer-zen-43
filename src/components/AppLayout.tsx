import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Settings, Shield, Moon, HelpCircle, Star, LogOut } from "lucide-react";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";
import NotificationPanel from "@/components/NotificationPanel";
import GlobalSearch from "@/components/GlobalSearch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  title: string;
  maxWidthClass?: string;
  headerRight?: ReactNode;
  fullHeight?: boolean;
  children: ReactNode;
}

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/team": "Team",
  "/analytics": "Analytics",
};

const menuItems = [
  { label: "Account Settings", icon: Settings, desc: "Profile & preferences" },
  { label: "Security", icon: Shield, desc: "Password & 2FA" },
  { label: "Appearance", icon: Moon, desc: "Theme & display" },
];

const supportItems = [
  { label: "Help & Docs", icon: HelpCircle, desc: "Guides and documentation" },
  { label: "What's New", icon: Star, desc: "Latest features" },
];

export const AppLayout = ({
  title,
  maxWidthClass = "max-w-[1600px]",
  headerRight,
  fullHeight = false,
  children,
}: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, avatarUrl, displayName } = useAuth();
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentPage = breadcrumbMap[location.pathname] || title;
  const email = user?.email || "";
  const roleLabel = isAdmin ? "Admin" : "BDA";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex bg-[#f4f4f4]">
      {/* Sidebar — desktop only */}
      <SideNav />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* ─── Global Header ─── */}
        <header className="shrink-0 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-black/[0.06] bg-white z-30">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-[#1f1f1f]/40 font-medium hidden sm:inline">DialFlow</span>
            <ChevronRight className="h-3.5 w-3.5 text-[#1f1f1f]/25 hidden sm:inline shrink-0" />
            <span className="text-[#1f1f1f] font-semibold truncate">{currentPage}</span>
          </div>

          {/* Right: Search + Notifications + Avatar */}
          <div className="flex items-center gap-2">
            {/* Global search (desktop + mobile triggers inside) */}
            <GlobalSearch />

            {/* Notifications */}
            <NotificationPanel />

            {/* Profile avatar popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-[#1f1f1f] flex items-center justify-center text-[10px] font-semibold text-white transition-transform hover:scale-105 active:scale-95 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    initials
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-72 p-0 rounded-xl border border-black/[0.06] shadow-lg bg-white">
                {/* User info */}
                <div className="p-4 flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#1f1f1f] flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1f1f1f] truncate">{displayName}</p>
                    <p className="text-[11px] text-[#1f1f1f]/40 truncate">{email}</p>
                    <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f6f7ed] text-[#1f1f1f]">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <Separator className="bg-black/[0.06]" />

                {/* Account section */}
                <div className="py-1.5">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-[#1f1f1f]/30">Account</p>
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#f4f4f4] transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-md bg-[#f4f4f4] flex items-center justify-center shrink-0 group-hover:bg-[#f6f7ed] transition-colors">
                        <item.icon className="h-3.5 w-3.5 text-[#1f1f1f]/40 group-hover:text-[#1f1f1f] transition-colors" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[13px] font-medium text-[#1f1f1f]">{item.label}</p>
                        <p className="text-[10px] text-[#1f1f1f]/30">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Separator className="bg-black/[0.06]" />

                {/* Support section */}
                <div className="py-1.5">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-[#1f1f1f]/30">Support</p>
                  {supportItems.map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#f4f4f4] transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-md bg-[#f4f4f4] flex items-center justify-center shrink-0 group-hover:bg-[#f6f7ed] transition-colors">
                        <item.icon className="h-3.5 w-3.5 text-[#1f1f1f]/40 group-hover:text-[#1f1f1f] transition-colors" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[13px] font-medium text-[#1f1f1f]">{item.label}</p>
                        <p className="text-[10px] text-[#1f1f1f]/30">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Separator className="bg-black/[0.06]" />

                {/* Sign out */}
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-md bg-red-50 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
                      <LogOut className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <p className="text-[13px] font-medium text-red-600">Sign Out</p>
                  </button>
                </div>

                <div className="px-4 pb-3 pt-1">
                  <p className="text-[10px] text-[#1f1f1f]/20 text-center font-medium">DialFlow v1.0.0</p>
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

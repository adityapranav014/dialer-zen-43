import { LogOut, Moon, Sun, Monitor, ChevronRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useProfileStats } from "@/hooks/useProfileStats";
import { AppLayout } from "@/components/AppLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin, avatarUrl, displayName } = useAuth();
  const { theme, setTheme } = useTheme();
  const { stats: profileStats } = useProfileStats();

  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const email = user?.email || "admin@dialflow.com";
  const roleLabel = isAdmin ? "Admin" : "Member";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const themeOptions: { id: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  const quickLinks = [
    { label: "Account Settings", icon: Settings, desc: "Preferences & appearance", path: "/settings" },
  ];

  return (
    <AppLayout title="Profile" maxWidthClass="max-w-2xl">
      {/* Profile card */}
      <div className="surface-card p-6 mb-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-2xl object-cover shrink-0 shadow-sm" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0 shadow-sm">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground truncate">{displayName}</h2>
            <p className="text-sm text-foreground/40 truncate">{email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-accent text-foreground/70">
                {roleLabel}
              </span>
              <span className="text-[11px] text-foreground/35 flex items-center gap-1">
                <span className="status-dot-live inline-block" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Calls Made", value: profileStats.callsMade.toLocaleString() },
          { label: "Conversions", value: profileStats.conversions.toLocaleString() },
          { label: "Hit Rate", value: profileStats.hitRate },
        ].map((s) => (
          <div key={s.label} className="surface-card text-center py-5 px-2">
            <p className="text-xl font-bold text-foreground stat-number">{s.value}</p>
            <p className="text-[11px] text-foreground/35 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Appearance / Theme picker */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/45 px-1 mb-2">
          Appearance
        </p>
        <div className="surface-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <Moon className="h-3.5 w-3.5 text-foreground/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-[11px] text-foreground/35">Choose your preferred appearance</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  theme === opt.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/40 hover:text-foreground"
                }`}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/45 px-1 mb-2">
          Quick Links
        </p>
        <div className="surface-card p-0 overflow-hidden">
          {quickLinks.map((item, iIdx) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-all duration-200 group ${
                iIdx < quickLinks.length - 1 ? "border-b border-foreground/[0.04]" : ""
              }`}
            >
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent transition-all duration-200">
                <item.icon className="h-4 w-4 text-foreground/40 group-hover:text-foreground transition-all duration-200" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-foreground/35">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/15 group-hover:text-foreground/40 transition-all duration-200 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="mt-2">
        <div className="surface-card p-0 overflow-hidden">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 group"
          >
            <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-950/30 group-hover:bg-red-100 dark:group-hover:bg-red-950/50 flex items-center justify-center shrink-0 transition-all duration-200">
              <LogOut className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Sign Out</p>
              <p className="text-[11px] text-foreground/45">End your current session</p>
            </div>
          </button>
        </div>
      </div>


    </AppLayout>
  );
};

export default Profile;

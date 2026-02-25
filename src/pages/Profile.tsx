import { motion } from "framer-motion";
import { User, LogOut, Shield, Bell, Moon, ChevronRight, Settings, HelpCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const email = user?.email || "admin@dialflow.com";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        { label: "Account Settings", icon: Settings, desc: "Manage your profile & preferences" },
        { label: "Notifications", icon: Bell, desc: "Configure alert preferences" },
        { label: "Security", icon: Shield, desc: "Password, 2FA, and sessions" },
        { label: "Appearance", icon: Moon, desc: "Theme, density, and display" },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help & Docs", icon: HelpCircle, desc: "Guides and documentation" },
        { label: "What's New", icon: Star, desc: "Latest features and updates" },
      ],
    },
  ];

  return (
    <AppLayout title="Profile" maxWidthClass="max-w-lg">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-card mb-6"
      >
        <div className="flex items-center gap-4">
          {/* Avatar with gradient ring */}
          <div className="relative shrink-0">
            <div
              className="p-0.5 rounded-2xl"
              style={{ background: "var(--gradient-brand)" }}
            >
              <div className="h-16 w-16 rounded-[calc(1rem-2px)] bg-card flex items-center justify-center text-xl font-bold text-foreground">
                {initials}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-card flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">✓</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground truncate">{displayName}</h2>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                Super Admin
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="status-dot-live inline-block" />
                Active
              </span>
            </div>
          </div>

          <button className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground shrink-0">
            <User className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        {[
          { label: "Calls Made", value: "1,247" },
          { label: "Conversions", value: "89" },
          { label: "Hit Rate", value: "7.1%" },
        ].map((s) => (
          <div key={s.label} className="bento-card text-center py-4">
            <p className="text-lg font-bold text-foreground stat-number">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Menu sections */}
      {menuSections.map((section, sIdx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + sIdx * 0.08 }}
          className="mb-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            {section.title}
          </p>
          <div className="bento-card p-0 overflow-hidden">
            {section.items.map((item, iIdx) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors group ${iIdx < section.items.length - 1 ? "border-b border-border/50" : ""
                  }`}
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-2"
      >
        <div className="rounded-2xl border border-destructive/20 overflow-hidden"
          style={{ background: "hsl(var(--destructive) / 0.04)" }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-destructive/10 transition-colors group"
          >
            <div className="h-8 w-8 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
              <LogOut className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-destructive">Sign Out</p>
              <p className="text-[11px] text-muted-foreground">End your current session</p>
            </div>
          </button>
        </div>
      </motion.div>

      <p className="text-[10px] text-muted-foreground/50 text-center mt-8">
        DialFlow v1.0.0 · Multi-Tenant CRM Dialer Platform
      </p>
    </AppLayout>
  );
};

export default Profile;

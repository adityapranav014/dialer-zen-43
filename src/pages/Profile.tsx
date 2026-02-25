import { User, LogOut, Shield, Bell, Moon, ChevronRight, Settings, HelpCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin, avatarUrl, displayName } = useAuth();

  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const email = user?.email || "admin@dialflow.com";
  const roleLabel = isAdmin ? "Admin" : "BDA";

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
      <div className="surface-card p-5 mb-5">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-14 w-14 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-[#1f1f1f] flex items-center justify-center text-base font-semibold text-white shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[#1f1f1f] truncate">{displayName}</h2>
            <p className="text-sm text-[#1f1f1f]/40 truncate">{email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#f6f7ed] text-[#1f1f1f]">
                {roleLabel}
              </span>
              <span className="text-[11px] text-[#1f1f1f]/35 flex items-center gap-1">
                <span className="status-dot-live inline-block" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Calls Made", value: "1,247" },
          { label: "Conversions", value: "89" },
          { label: "Hit Rate", value: "7.1%" },
        ].map((s) => (
          <div key={s.label} className="surface-card text-center py-4 px-2">
            <p className="text-lg font-semibold text-[#1f1f1f] stat-number">{s.value}</p>
            <p className="text-[11px] text-[#1f1f1f]/35 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#1f1f1f]/30 px-1 mb-2">
            {section.title}
          </p>
          <div className="surface-card p-0 overflow-hidden">
            {section.items.map((item, iIdx) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f4f4f4] transition-colors group ${
                  iIdx < section.items.length - 1 ? "border-b border-black/[0.04]" : ""
                }`}
              >
                <div className="h-8 w-8 rounded-lg bg-[#f4f4f4] flex items-center justify-center shrink-0 group-hover:bg-[#f6f7ed] transition-colors">
                  <item.icon className="h-3.5 w-3.5 text-[#1f1f1f]/40 group-hover:text-[#1f1f1f] transition-colors" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-[#1f1f1f]">{item.label}</p>
                  <p className="text-[11px] text-[#1f1f1f]/35">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#1f1f1f]/15 group-hover:text-[#1f1f1f]/40 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="mt-2">
        <div className="surface-card p-0 overflow-hidden border-red-200/60">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
              <LogOut className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600">Sign Out</p>
              <p className="text-[11px] text-[#1f1f1f]/30">End your current session</p>
            </div>
          </button>
        </div>
      </div>

      <p className="text-[10px] text-[#1f1f1f]/20 text-center mt-8 font-medium">
        DialFlow v1.0.0
      </p>
    </AppLayout>
  );
};

export default Profile;

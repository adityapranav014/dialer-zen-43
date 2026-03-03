import {
  Bell,
  Volume2,
  FileText,
  Check,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";

/* ── Toggle component ── */
const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0 ${
      enabled ? "bg-primary" : "bg-foreground/15"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

/* ── Setting row ── */
const SettingRow = ({
  icon: Icon,
  label,
  desc,
  children,
  last = false,
}: {
  icon: typeof Bell;
  label: string;
  desc: string;
  children: React.ReactNode;
  last?: boolean;
}) => (
  <div
    className={`flex items-center gap-3 px-4 py-3.5 ${
      !last ? "border-b border-foreground/[0.04]" : ""
    }`}
  >
    <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-foreground/35" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-[11px] text-foreground/35">{desc}</p>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const AccountSettings = () => {
  const { user, isAdmin, isSuperAdmin, avatarUrl, displayName } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, toggle, set } = useSettings();
  const email = user?.email || "";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Member";

  const themeOptions: { id: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <AppLayout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: Profile + Appearance ── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile Info */}
          <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40 px-1 mb-3">
              Profile
            </p>
            <div className="surface-card p-5">
              <div className="flex flex-col items-center text-center mb-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-16 w-16 rounded-full object-cover mb-3"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground mb-3">
                    {initials}
                  </div>
                )}
                <p className="text-sm font-bold text-foreground">{displayName}</p>
                <p className="text-[11px] text-foreground/40">{email}</p>
                <span className="mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-accent text-foreground">
                  {roleLabel}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2.5 bg-accent/60 rounded-xl">
                  <span className="text-[11px] text-foreground/40">Full Name</span>
                  <span className="text-[11px] font-semibold text-foreground">{displayName}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 bg-accent/60 rounded-xl">
                  <span className="text-[11px] text-foreground/40">Email</span>
                  <span className="text-[11px] font-semibold text-foreground truncate ml-4">{email}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 bg-accent/60 rounded-xl">
                  <span className="text-[11px] text-foreground/40">Role</span>
                  <span className="text-[11px] font-semibold text-foreground">{roleLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40 px-1 mb-3">
              Appearance
            </p>
            <div className="surface-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Moon className="h-4 w-4 text-foreground/35" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Theme</p>
                  <p className="text-[11px] text-foreground/35">Choose your preferred appearance</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-1 bg-accent/60 rounded-xl">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
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
        </div>

        {/* ── Right column: Notifications + Workflow ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Notification Preferences */}
          <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40 px-1 mb-3">
              Notifications
            </p>
            <div className="surface-card p-0 overflow-hidden">
              <SettingRow icon={Bell} label="New Lead Assigned" desc="Get notified when a lead is assigned to you">
                <Toggle enabled={settings.notif_new_lead} onToggle={() => toggle("notif_new_lead")} />
              </SettingRow>
              <SettingRow
                icon={Check}
                label="Lead Conversion"
                desc="Notify when a lead is converted"
                last={!isAdmin}
              >
                <Toggle enabled={settings.notif_conversion} onToggle={() => toggle("notif_conversion")} />
              </SettingRow>
              {isAdmin && (
                <SettingRow icon={Bell} label="Team Updates" desc="Activity updates from your team members" last>
                  <Toggle enabled={settings.notif_team_updates} onToggle={() => toggle("notif_team_updates")} />
                </SettingRow>
              )}
            </div>
          </div>

          {/* Workflow */}
          <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40 px-1 mb-3">
              Workflow
            </p>
            <div className="surface-card p-0 overflow-hidden">
              <SettingRow
                icon={Volume2}
                label="Post-Call Notes"
                desc="Show note-taking modal after logging a call"
                last={!isAdmin}
              >
                <Toggle enabled={settings.show_post_call_modal} onToggle={() => toggle("show_post_call_modal")} />
              </SettingRow>
              {isAdmin && (
                <SettingRow icon={FileText} label="Default Lead Status" desc="Status assigned to newly added leads" last>
                  <select
                    value={settings.default_lead_status}
                    onChange={(e) => set("default_lead_status", e.target.value)}
                    className="text-[11px] font-semibold text-foreground bg-muted/60 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors duration-200"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                  </select>
                </SettingRow>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AccountSettings;

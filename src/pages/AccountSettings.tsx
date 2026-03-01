import {
  User,
  Building2,
  Phone,
  Bell,
  Globe,
  Clock,
  Volume2,
  PhoneOff,
  Timer,
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
  icon: typeof User;
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
  const { user, isAdmin, avatarUrl, displayName } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, toggle, set } = useSettings();
  const email = user?.email || "";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const themeOptions: { id: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <AppLayout title="Account Settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: Profile info + Appearance ── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile Info */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
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
                  {isAdmin ? "Admin" : "Member"}
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
                  <span className="text-[11px] font-semibold text-foreground">{isAdmin ? "Admin" : "Member"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
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

          {/* General */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
              General
            </p>
            <div className="surface-card p-0 overflow-hidden">
              <SettingRow icon={Clock} label="Timezone" desc="Set your local timezone">
                <select
                  value={settings.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                  className="text-[11px] font-semibold text-foreground bg-muted/60 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors duration-200"
                >
                  <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                  <option value="America/New_York">EST (UTC-5)</option>
                  <option value="Europe/London">GMT (UTC+0)</option>
                  <option value="Asia/Dubai">GST (UTC+4)</option>
                  <option value="Asia/Singapore">SGT (UTC+8)</option>
                </select>
              </SettingRow>
              <SettingRow icon={Globe} label="Language" desc="Interface language" last>
                <select
                  value={settings.language}
                  onChange={(e) => set("language", e.target.value)}
                  className="text-[11px] font-semibold text-foreground bg-muted/60 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors duration-200"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </SettingRow>
            </div>
          </div>
        </div>

        {/* ── Right column: Notifications, Calling, Leads ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Notification Preferences */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
              Notifications
            </p>
            <div className="surface-card p-0 overflow-hidden">
              <SettingRow icon={Bell} label="New Lead Assigned" desc="Get notified when a lead is assigned to you">
                <Toggle enabled={settings.notif_new_lead} onToggle={() => toggle("notif_new_lead")} />
              </SettingRow>
              <SettingRow icon={PhoneOff} label="Missed Call Alert" desc="Alert when a scheduled call is missed">
                <Toggle enabled={settings.notif_missed_call} onToggle={() => toggle("notif_missed_call")} />
              </SettingRow>
              <SettingRow icon={Check} label="Lead Conversion" desc="Notify when a lead is converted">
                <Toggle enabled={settings.notif_conversion} onToggle={() => toggle("notif_conversion")} />
              </SettingRow>
              {isAdmin && (
                <SettingRow icon={Building2} label="Team Updates" desc="Activity updates from your team members">
                  <Toggle enabled={settings.notif_team_updates} onToggle={() => toggle("notif_team_updates")} />
                </SettingRow>
              )}
              <SettingRow icon={FileText} label="Daily Summary" desc="Receive a daily performance summary email" last>
                <Toggle enabled={settings.notif_daily_summary} onToggle={() => toggle("notif_daily_summary")} />
              </SettingRow>
            </div>
          </div>

          {/* Calling Preferences */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
              Calling
            </p>
            <div className="surface-card p-0 overflow-hidden">
              <SettingRow icon={Phone} label="Auto-Dial Next Lead" desc="Automatically dial the next lead after a call ends">
                <Toggle enabled={settings.auto_dial_next} onToggle={() => toggle("auto_dial_next")} />
              </SettingRow>
              <SettingRow icon={Timer} label="Cooldown Timer" desc="Wait time (seconds) between auto-dial calls">
                <select
                  value={String(settings.cooldown_timer)}
                  onChange={(e) => set("cooldown_timer", Number(e.target.value))}
                  className="text-[11px] font-semibold text-foreground bg-muted/60 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors duration-200"
                >
                  <option value="10">10s</option>
                  <option value="15">15s</option>
                  <option value="30">30s</option>
                  <option value="45">45s</option>
                  <option value="60">60s</option>
                </select>
              </SettingRow>
              <SettingRow icon={Volume2} label="Post-Call Notes" desc="Show note-taking modal after each call">
                <Toggle enabled={settings.show_post_call_modal} onToggle={() => toggle("show_post_call_modal")} />
              </SettingRow>
              <SettingRow icon={Volume2} label="Call Recording" desc="Automatically record all outbound calls" last>
                <Toggle enabled={settings.call_recording} onToggle={() => toggle("call_recording")} />
              </SettingRow>
            </div>
          </div>

          {/* Lead Management (Admin only) */}
          {isAdmin && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
                Lead Management
              </p>
              <div className="surface-card p-0 overflow-hidden">
                <SettingRow icon={FileText} label="Default Lead Status" desc="Status assigned to newly added leads">
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
                <SettingRow icon={User} label="Auto-Assign Leads" desc="Automatically distribute new leads to available BDAs" last>
                  <Toggle enabled={settings.auto_assign_leads} onToggle={() => toggle("auto_assign_leads")} />
                </SettingRow>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AccountSettings;

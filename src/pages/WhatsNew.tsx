import { Sparkles, Phone, BarChart3, Users, Zap, Shield, Bug, ArrowUpRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

/* ── Types ─────────────────────────────────────────────────── */
type ChangeType = "feature" | "improvement" | "fix";

interface Change {
  title: string;
  description: string;
  type: ChangeType;
}

interface Release {
  version: string;
  date: string;
  headline: string;
  icon: typeof Sparkles;
  changes: Change[];
}

/* ── Badge colours per change type ─────────────────────────── */
const typeBadge: Record<ChangeType, { label: string; className: string }> = {
  feature: {
    label: "New",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  improvement: {
    label: "Improved",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  fix: {
    label: "Fixed",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

/* ── Release data ──────────────────────────────────────────── */
const releases: Release[] = [
  {
    version: "1.2.0",
    date: "February 26, 2026",
    headline: "Dark Mode, Account Settings & Help Center",
    icon: Sparkles,
    changes: [
      { title: "Dark Mode Support", description: "Full dark theme with Light, Dark, and System options. Your preference is saved and applied automatically on every visit.", type: "feature" },
      { title: "Account Settings Page", description: "Centralized settings for notifications, calling preferences, and lead management — everything in one place.", type: "feature" },
      { title: "Help & Docs Center", description: "In-app guides, FAQs, and a direct support contact section to get you up to speed quickly.", type: "feature" },
      { title: "What's New Page", description: "A changelog so you always know about the latest features and improvements.", type: "feature" },
      { title: "Theme Persistence", description: "Your selected theme is stored in local storage and restored on refresh, even across sessions.", type: "improvement" },
    ],
  },
  {
    version: "1.1.0",
    date: "February 20, 2026",
    headline: "Team Management & Analytics",
    icon: Users,
    changes: [
      { title: "Team Management Dashboard", description: "Admins can now add, remove, and manage BDA team members from a dedicated interface.", type: "feature" },
      { title: "Lead Conversion Analytics", description: "Visual charts showing conversion rates, talk-time breakdowns, and pipeline health over customizable date ranges.", type: "feature" },
      { title: "Auto-Assign Leads", description: "Newly created leads can be auto-distributed to BDAs using a round-robin algorithm.", type: "feature" },
      { title: "Talk-Time Chart", description: "Track daily and weekly call durations with an interactive area chart on the Analytics page.", type: "improvement" },
      { title: "Lead Card Redesign", description: "Cleaner layout with priority badges, last-contact timestamps, and quick-action buttons.", type: "improvement" },
    ],
  },
  {
    version: "1.0.1",
    date: "February 15, 2026",
    headline: "Bug Fixes & Performance",
    icon: Bug,
    changes: [
      { title: "Auth System Upgrade", description: "Resolved various authentication edge cases and improved session handling reliability.", type: "fix" },
      { title: "Leads RLS Policy", description: "Fixed row-level security so BDAs only see leads assigned to them, while admins see all.", type: "fix" },
      { title: "Post-Call Modal Stability", description: "Fixed a crash that occurred when submitting the post-call form without selecting an outcome.", type: "fix" },
      { title: "Faster Dashboard Load", description: "Optimized dashboard queries — stats now load 40% faster on initial page view.", type: "improvement" },
    ],
  },
  {
    version: "1.0.0",
    date: "February 10, 2026",
    headline: "Initial Release",
    icon: Zap,
    changes: [
      { title: "Click-to-Call Dialer", description: "One-tap calling directly from lead cards with automatic call logging and duration tracking.", type: "feature" },
      { title: "Lead Management", description: "Create, search, filter, and manage leads with statuses like New, Contacted, Qualified, Converted, and Lost.", type: "feature" },
      { title: "Admin & BDA Roles", description: "Role-based access control with distinct dashboards, navigation, and permissions for admins and BDAs.", type: "feature" },
      { title: "Real-Time Notifications", description: "Live alerts for new lead assignments, missed calls, conversions, and team activity.", type: "feature" },
      { title: "Secure Sign-In", description: "Cookie-based authentication with email/mobile and password — fast and secure.", type: "feature" },
      { title: "Responsive Mobile Layout", description: "Fully responsive design with a bottom navigation bar optimized for mobile BDA workflows.", type: "feature" },
    ],
  },
];

/* ── Icon map for visual variety ───────────────────────────── */
const changeIcon: Record<string, typeof Phone> = {
  "Dark Mode Support": Sparkles,
  "Click-to-Call Dialer": Phone,
  "Lead Conversion Analytics": BarChart3,
  "Team Management Dashboard": Users,
  "Admin & BDA Roles": Shield,
  "Auto-Assign Leads": Zap,
};

/* ── Component ─────────────────────────────────────────────── */
const WhatsNew = () => {
  return (
    <AppLayout title="What's New">
      {/* Latest badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Sparkles className="h-3 w-3" />
          Latest: v{releases[0].version}
        </span>
        <span className="text-xs text-foreground/35">{releases[0].date}</span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-6 bottom-0 w-px bg-foreground/[0.06]" />

        <div className="space-y-10">
          {releases.map((release, rIdx) => (
            <div key={release.version} className="relative">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-0 z-10 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                rIdx === 0
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted text-foreground/40 border border-foreground/[0.06]"
              }`}>
                <release.icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="ml-14">
                {/* Header */}
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  <h2 className="text-base font-semibold text-foreground">v{release.version}</h2>
                  <span className="text-xs text-foreground/30 font-medium">{release.date}</span>
                </div>
                <p className="text-sm text-foreground/50 mb-4">{release.headline}</p>

                {/* Changes card */}
                <div className="surface-card p-0 overflow-hidden">
                  {release.changes.map((change, cIdx) => {
                    const badge = typeBadge[change.type];
                    const Icon = changeIcon[change.title];
                    return (
                      <div
                        key={change.title}
                        className={`flex items-start gap-3 px-4 py-3.5 ${
                          cIdx < release.changes.length - 1 ? "border-b border-foreground/[0.04]" : ""
                        }`}
                      >
                        {Icon ? (
                          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="h-3.5 w-3.5 text-foreground/30" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowUpRight className="h-3.5 w-3.5 text-foreground/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-foreground">{change.title}</p>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/40 leading-relaxed">{change.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-foreground/20 text-center mt-12 mb-4 font-medium">
        DialFlow Changelog — Built with care
      </p>
    </AppLayout>
  );
};

export default WhatsNew;

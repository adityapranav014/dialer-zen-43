import { useState, useEffect } from "react";
import { PhoneCall, BarChart2, Users, Loader2, ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ─── Demo roles ───────────────────────────────────────────────────────────────
const DEMO_ROLES = [
  {
    key: "admin",
    label: "Admin",
    description: "Full access to leads, team analytics, and company settings.",
    icon: BarChart2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    badgeColor: "bg-primary/10 text-primary",
    credentials: { identifier: "admin@nexgen.demo", password: "Admin@2026", slug: "nexgen" },
  },
  {
    key: "bda",
    label: "Sales Agent",
    description: "View assigned leads, log calls, and track personal performance.",
    icon: Users,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    credentials: { identifier: "rahul.sharma@nexgen.demo", password: "BDA@2026", slug: "nexgen" },
  },
  {
    key: "superadmin",
    label: "Super Admin",
    description: "Platform-wide control — manage all tenants and global settings.",
    icon: Shield,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    badgeColor: "bg-amber-500/10 text-amber-600",
    credentials: { identifier: "superadmin@dialflow.io", password: "Super@2026", slug: "" },
  },
] as const;

const AuthPage = () => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const { signIn, user, isSuperAdmin, isPlatformView } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (isSuperAdmin && isPlatformView) {
        navigate("/platform", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, isSuperAdmin, isPlatformView, navigate]);

  if (user) return null;

  const handleEnter = async (role: typeof DEMO_ROLES[number]) => {
    setLoadingKey(role.key);
    const { error } = await signIn(role.credentials.identifier, role.credentials.password, role.credentials.slug);
    if (error) {
      toast.error("Could not sign in. Please try again.");
      setLoadingKey(null);
    }
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[460px]">
        {/* ── Brand ── */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
            <PhoneCall className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">DialFlow</h1>
          <p className="text-sm text-foreground/40 mt-2 max-w-[280px] leading-relaxed">
            Interactive demo — pick a role below to explore the platform instantly.
          </p>
        </div>

        {/* ── Role Cards ── */}
        <div className="space-y-3">
          {DEMO_ROLES.map((role) => {
            const Icon = role.icon;
            const isLoading = loadingKey === role.key;
            const isDisabled = loadingKey !== null;
            return (
              <div
                key={role.key}
                className="surface-elevated p-5 flex items-center gap-4 cursor-pointer group transition-all duration-200 hover:border-primary/25"
                onClick={() => !isDisabled && handleEnter(role)}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${role.iconBg}`}>
                  <Icon className={`h-5 w-5 ${role.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{role.label}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${role.badgeColor}`}>
                      Demo
                    </span>
                  </div>
                  <p className="text-xs text-foreground/45 leading-snug">{role.description}</p>
                </div>
                <div className={`shrink-0 transition-all duration-200 ${isDisabled ? "opacity-40" : "group-hover:translate-x-0.5"}`}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 text-foreground/40 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-foreground/30" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer note ── */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-foreground/30 leading-relaxed">
            This is a live demo environment. All data is pre-seeded for demonstration purposes.
          </p>
        </div>


      </div>
    </div>
  );
};

export default AuthPage;

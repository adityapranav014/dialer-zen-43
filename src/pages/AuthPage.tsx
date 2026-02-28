import { useState, useEffect } from "react";
import {
  PhoneCall,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  Phone,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [companySlug, setCompanySlug] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or phone for sign-in
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, user, isSuperAdmin, isPlatformView } = useAuth();
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

  // ── Form submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        if (!displayName.trim()) throw new Error("Full name is required.");
        if (!email.trim()) throw new Error("Email is required.");
        if (!companySlug.trim()) throw new Error("Company URL is required.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");

        const { error } = await signUp(email, password, displayName, companySlug, phone || undefined);
        if (error) throw error;
        toast.success("Account created successfully!");
      } else {
        if (!identifier.trim()) throw new Error("Email or phone number is required.");
        if (!password) throw new Error("Password is required.");
        // Super admins can leave company URL blank
        const slug = companySlug.trim();

        const { error } = await signIn(identifier, password, slug);
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setPassword("");
    setShowPassword(false);
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[420px]">
        {/* ── Brand ── */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
            <PhoneCall className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">DialFlow</h1>
          <p className="text-sm text-foreground/40 mt-1.5">
            {isSignUp ? "Create your account to get started" : "Sign in to your account"}
          </p>
        </div>

        {/* ── Form Card ── */}
        <div className="surface-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company URL — always shown */}
            <div>
              <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-1.5 block">
                Company URL {!isSignUp && <span className="text-foreground/25 normal-case">(leave empty for super admin)</span>}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/25" />
                <input
                  type="text"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="your-company"
                  required={isSignUp}
                  autoComplete="organization"
                  className="w-full h-11 pl-10 pr-4 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
                {companySlug && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-foreground/30">
                    .dialflow.app
                  </span>
                )}
              </div>
            </div>

            {isSignUp ? (
              <>
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/25" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      required
                      autoComplete="name"
                      className="w-full h-11 pl-10 pr-4 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/25" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                      className="w-full h-11 pl-10 pr-4 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-1.5 block">
                    Phone Number <span className="text-foreground/25 normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/25" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      className="w-full h-11 pl-10 pr-4 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Email or Phone */}
                <div>
                  <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-1.5 block">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/25" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@company.com or +91 98765 43210"
                      required
                      autoComplete="email"
                      className="w-full h-11 pl-10 pr-4 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/25" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full h-11 pl-10 pr-11 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/50 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isSignUp && (
                <p className="text-[10px] text-foreground/30 mt-1.5">Minimum 6 characters</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-sm shadow-primary/10"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* ── Toggle sign-in / sign-up ── */}
          <div className="mt-6 pt-5 border-t border-foreground/[0.06] text-center">
            <p className="text-[13px] text-foreground/40">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={switchMode}
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {isSignUp ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-foreground/20 mt-8 font-medium">
          DialFlow &middot; Secure cookie-based authentication
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

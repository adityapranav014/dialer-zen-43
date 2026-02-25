import { useState, useEffect } from "react";
import {
  PhoneCall,
  ArrowRight,
  Shield,
  Headphones,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ─── Google "G" logo SVG ──────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const AuthPage = () => {
  const [view, setView] = useState<"main" | "email">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, user, loginAsRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (user) return null;

  // ── Google sign-in ────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Redirect happens via Supabase — no need to navigate here
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  // ── Demo role selection ───────────────────────────────────────────
  const handleRoleSelection = (roleId: "super_admin" | "bda") => {
    loginAsRole(roleId);
    toast.success(`Signed in as ${roleId === "super_admin" ? "Super Admin" : "BDA Agent"}`);
    navigate("/dashboard");
  };

  // ── Email / password submit ───────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast.success("Account created. Check your email for verification.");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex items-center justify-center bg-[#f4f4f4] p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-12 w-12 rounded-xl bg-[#1f1f1f] flex items-center justify-center mb-4">
            <PhoneCall className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f] tracking-tight">DialFlow</h1>
          <p className="text-sm text-[#1f1f1f]/40 mt-1">
            {view === "main" ? "Sign in to continue" : isSignUp ? "Create your account" : "Sign in with email"}
          </p>
        </div>

        {view === "main" ? (
          <div className="space-y-3">
            {/* ── Google button ── */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="group w-full surface-card p-4 text-left hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 disabled:opacity-60"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-black/[0.06] flex items-center justify-center shrink-0">
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#1f1f1f]/40" />
                  ) : (
                    <GoogleIcon />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#1f1f1f]">Continue with Google</h3>
                  <p className="text-xs text-[#1f1f1f]/35 mt-0.5">Sign in securely with your Google account</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1f1f1f]/15 group-hover:text-[#1f1f1f]/60 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-black/[0.06]" />
              <span className="text-[11px] font-medium text-[#1f1f1f]/25 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-black/[0.06]" />
            </div>

            {/* ── Demo workspace buttons ── */}
            <button
              onClick={() => handleRoleSelection("super_admin")}
              className="group w-full surface-card p-4 text-left hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#f6f7ed] flex items-center justify-center shrink-0 group-hover:bg-[#1f1f1f] transition-colors">
                  <Shield className="h-5 w-5 text-[#1f1f1f] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#1f1f1f]">Demo · Super Admin</h3>
                  <p className="text-xs text-[#1f1f1f]/35 mt-0.5">Team management, analytics & oversight</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1f1f1f]/15 group-hover:text-[#1f1f1f]/60 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection("bda")}
              className="group w-full surface-card p-4 text-left hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#f6f7ed] flex items-center justify-center shrink-0 group-hover:bg-[#1f1f1f] transition-colors">
                  <Headphones className="h-5 w-5 text-[#1f1f1f] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#1f1f1f]">Demo · BDA Agent</h3>
                  <p className="text-xs text-[#1f1f1f]/35 mt-0.5">Lead pipeline, calls & performance</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1f1f1f]/15 group-hover:text-[#1f1f1f]/60 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </button>
          </div>
        ) : (
          /* ── Email / password form ── */
          <div className="surface-card p-6">
            <h3 className="text-base font-semibold text-[#1f1f1f] mb-6 text-center">
              {isSignUp ? "Create Account" : "Sign In"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="text-[11px] font-medium text-[#1f1f1f]/40 uppercase tracking-wider mb-1.5 block">Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/25" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-10 pl-10 pr-4 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/20 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-[#1f1f1f]/40 uppercase tracking-wider mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/25" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full h-10 pl-10 pr-4 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#1f1f1f]/40 uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/25" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-10 pl-10 pr-4 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-[#1f1f1f] text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#1f1f1f]/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </button>
            </form>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full mt-4 text-[12px] font-medium text-[#1f1f1f]/35 hover:text-[#1f1f1f] transition-colors text-center"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          </div>
        )}

        {/* Toggle link */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setView(view === "main" ? "email" : "main")}
            className="text-xs font-medium text-[#1f1f1f]/30 hover:text-[#1f1f1f]/60 transition-colors"
          >
            {view === "email" ? "← Back to main sign-in" : "Use email & password instead"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

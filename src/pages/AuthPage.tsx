import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  ArrowRight,
  Shield,
  Headphones,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  ChevronRight,
  Globe,
  Settings,
  Cpu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AuthPage = () => {
  const [isClassic, setIsClassic] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, user, loginAsRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const handleRoleSelection = (roleId: "super_admin" | "bda") => {
    loginAsRole(roleId);
    toast.success(`Access tunnel established: ${roleId === "super_admin" ? "Super Admin" : "BDA Agent"}`);
    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast.success("Deployment successful. Check your secure inbox for verification.");
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* ELITE BACKGROUND SYSTEM */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#1e1e2e_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.2]" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-[120px] opacity-30" />
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl relative z-10"
      >
        {/* BRAND IDENTITY */}
        <div className="flex flex-col items-center mb-16 text-center">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center glow-primary border border-primary/50 shadow-2xl shadow-primary/20 group cursor-default">
              <PhoneCall className="h-7 w-7 text-white transition-transform group-hover:scale-110" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">DialFlow</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Enterprise CRM Solution</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-secondary/80 border border-white/5 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-widest text-primary mb-6 shadow-xl"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Sandbox Environment Active
          </motion.div>

          <h2 className="text-5xl font-black text-white tracking-tighter mb-4 lg:text-6xl">
            Select Workspace
          </h2>
          <p className="text-muted-foreground font-medium max-w-lg text-lg leading-relaxed">
            Enter your secure operational environment to manage production pipelines and agent performance.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isClassic ? (
            <motion.div
              key="workspace-selection"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
            >
              <WorkspaceCard
                title="Super Admin"
                subtitle="High-Level Command"
                description="Comprehensive oversight of conversion funnels, global settings, and team orchestration."
                icon={Shield}
                color="primary"
                onClick={() => handleRoleSelection("super_admin")}
                meta={["Fleet Mgmt", "Global Analytics"]}
              />
              <WorkspaceCard
                title="BDA Agent"
                subtitle="Front-Line Execution"
                description="Direct lead interaction portal with instantaneous call logging and milestone tracking."
                icon={Headphones}
                color="success"
                onClick={() => handleRoleSelection("bda")}
                meta={["Direct Pipeline", "Call Forge"]}
              />
            </motion.div>
          ) : (
            <motion.div
              key="classic-auth"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="glass-heavy p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                <h3 className="text-2xl font-black mb-8 text-white text-center tracking-tight">
                  {isSignUp ? "Deploy Admin Access" : "Secure Credential Login"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Identity Name</label>
                      <div className="relative group/input">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Administrator Name"
                          className="w-full h-14 pl-12 pr-4 bg-muted/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-muted-foreground/40 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Authorized Email</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="verified@enterprise.com"
                        required
                        className="w-full h-14 pl-12 pr-4 bg-muted/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-muted-foreground/40 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Security Token</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full h-14 pl-12 pr-4 bg-muted/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-muted-foreground/40 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full h-14 bg-primary text-white font-black text-sm rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-primary/40 disabled:opacity-50 mt-8 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isLoading ? (
                      <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? "INITIALIZE DEPLOYMENT" : "AUTHORIZE ACCESS"}
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full mt-8 text-[11px] font-bold text-muted-foreground/60 hover:text-primary transition-colors text-center uppercase tracking-widest"
                >
                  {isSignUp ? "Already registered? Establish link" : "Require new uplink? Command here"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 flex flex-col items-center gap-10"
        >
          <button
            onClick={() => setIsClassic(!isClassic)}
            className="group flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/5 bg-secondary/40 hover:bg-secondary/60 hover:border-primary/20 transition-all duration-300"
          >
            <div className={`h-2 w-2 rounded-full transition-colors ${isClassic ? "bg-primary glow-primary" : "bg-muted-foreground/40"}`} />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-white transition-colors">
              {isClassic ? "Switch to Unified Workspaces" : "Access Classic Terminal"}
            </span>
          </button>

          <div className="flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            <span className="flex items-center gap-2.5 hover:text-muted-foreground transition-colors cursor-default"><Globe className="h-3.5 w-3.5" /> Edge Routing</span>
            <span className="flex items-center gap-2.5 hover:text-muted-foreground transition-colors cursor-default"><Cpu className="h-3.5 w-3.5" /> AI Orchestrator</span>
            <span className="flex items-center gap-2.5 hover:text-muted-foreground transition-colors cursor-default"><Settings className="h-3.5 w-3.5" /> Fleet Control</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const WorkspaceCard = ({ title, subtitle, description, icon: Icon, color, onClick, meta }: any) => {
  return (
    <motion.button
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative text-left p-10 rounded-[48px] bg-secondary/30 border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-primary/5 active:bg-secondary/50 group"
    >
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${color === "primary" ? "bg-primary" : "bg-success"}`} />

      <div className={`h-16 w-16 rounded-[24px] mb-10 flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 border border-white/5 shadow-2xl ${color === "primary" ? "bg-primary/20 text-primary" : "bg-success/20 text-success"}`}>
        <Icon className="h-8 w-8" />
      </div>

      <div className="space-y-1 mb-4">
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${color === "primary" ? "text-primary/70" : "text-success/70"}`}>
          {subtitle}
        </p>
        <h3 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
          {title}
          <ArrowRight className="h-6 w-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </h3>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed font-semibold opacity-80 mb-8 max-w-xs">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 pt-2">
        {meta.map((m: string) => (
          <span key={m} className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 text-muted-foreground/60 border border-white/5 group-hover:border-white/10 transition-colors">
            {m}
          </span>
        ))}
      </div>

      <div className={`absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-700 ${color === "primary" ? "bg-primary shadow-[0_0_20px_rgba(111,86,255,0.8)]" : "bg-success shadow-[0_0_20px_rgba(34,197,94,0.8)]"}`} />
    </motion.button>
  );
};

export default AuthPage;

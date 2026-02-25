import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { APP_CONFIG, isAdminEmail } from "@/config/app";

type AppRole = "super_admin" | "bda";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isDemo: boolean;
  role: AppRole | null;
  avatarUrl: string | null;
  displayName: string;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loginAsRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the best avatar URL from Supabase user metadata */
function resolveAvatar(u: User | null): string | null {
  if (!u) return null;
  return (
    u.user_metadata?.avatar_url ||
    u.user_metadata?.picture ||
    null
  );
}

/** Resolve display name from user metadata */
function resolveName(u: User | null): string {
  if (!u) return "User";
  return (
    u.user_metadata?.full_name ||
    u.user_metadata?.display_name ||
    u.user_metadata?.name ||
    u.email ||
    "User"
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("User");

  // ── Fetch & ensure role ────────────────────────────────────────────
  const resolveRole = useCallback(async (u: User) => {
    try {
      // 1. Try to read existing role from DB
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .maybeSingle();

      if (!error && data) {
        // If the DB says bda but our config says admin → promote
        if (data.role === "bda" && isAdminEmail(u.email)) {
          await supabase
            .from("user_roles")
            .update({ role: "super_admin" })
            .eq("user_id", u.id);
          setRole("super_admin");
        } else {
          setRole(data.role as AppRole);
        }
      } else {
        // No role row yet – insert based on config
        const assignedRole: AppRole = isAdminEmail(u.email) ? "super_admin" : "bda";
        await supabase
          .from("user_roles")
          .upsert({ user_id: u.id, role: assignedRole }, { onConflict: "user_id,role" });
        setRole(assignedRole);
      }
    } catch {
      // Fail-safe: derive from config
      setRole(isAdminEmail(u.email) ? "super_admin" : "bda");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Persist avatar into profiles table ─────────────────────────────
  const syncProfile = useCallback(async (u: User) => {
    const avatar = resolveAvatar(u);
    const name = resolveName(u);
    setAvatarUrl(avatar);
    setDisplayName(name);

    // Update profile row with latest avatar (Google may rotate URLs)
    if (avatar) {
      await supabase
        .from("profiles")
        .update({ avatar_url: avatar, display_name: name })
        .eq("user_id", u.id);
    }
  }, []);

  // ── Bootstrap session on mount + listen for changes ────────────────
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setIsDemo(false);
        syncProfile(session.user);
        await resolveRole(session.user);
      } else {
        setLoading(false);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setIsDemo(false);
          syncProfile(session.user);
          await resolveRole(session.user);
        } else if (!isDemo) {
          setSession(null);
          setUser(null);
          setRole(null);
          setAvatarUrl(null);
          setDisplayName("User");
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isDemo, resolveRole, syncProfile]);

  // ── Google OAuth ───────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: APP_CONFIG.authCallbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
  };

  // ── Email / password ──────────────────────────────────────────────
  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: APP_CONFIG.authCallbackUrl,
        data: { display_name: name || email },
      },
    });

    if (data?.user) {
      const assignedRole: AppRole = isAdminEmail(email) ? "super_admin" : "bda";
      await supabase
        .from("user_roles")
        .upsert({ user_id: data.user.id, role: assignedRole }, { onConflict: "user_id,role" });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsDemo(false);
    setRole(null);
    setAvatarUrl(null);
    setDisplayName("User");
  };

  // ── Demo mode ─────────────────────────────────────────────────────
  const loginAsRole = (selectedRole: AppRole) => {
    setLoading(true);
    setIsDemo(true);
    const mockUser: any = {
      id: selectedRole === "super_admin" ? "admin-id" : "bda-id",
      email: selectedRole === "super_admin" ? "admin@demo.com" : "bda@demo.com",
      user_metadata: {
        display_name: selectedRole === "super_admin" ? "Super Admin" : "BDA Agent",
      },
      aud: "authenticated",
      role: "authenticated",
    };

    setUser(mockUser);
    setRole(selectedRole);
    setAvatarUrl(null);
    setDisplayName(mockUser.user_metadata.display_name);
    setLoading(false);
  };

  const isAdmin = role === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isAdmin,
        isDemo,
        role,
        avatarUrl,
        displayName,
        signInWithGoogle,
        signUp,
        signIn,
        signOut,
        loginAsRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

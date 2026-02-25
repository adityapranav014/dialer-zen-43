import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "adityapranav014@gmail.com";
type AppRole = "super_admin" | "bda";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isDemo: boolean;
  role: AppRole | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loginAsRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (user?.email === ADMIN_EMAIL) {
          setRole("super_admin");
        } else {
          setRole("bda");
        }
      } else {
        setRole(data.role as AppRole);
      }
    } catch (e) {
      setRole("bda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setIsDemo(false);
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setIsDemo(false);
        fetchUserRole(session.user.id);
      } else {
        if (!isDemo) {
          setSession(null);
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName || email },
      },
    });

    if (data?.user) {
      const assignedRole = email === ADMIN_EMAIL ? "super_admin" : "bda";
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: assignedRole,
      });
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
  };

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
    setLoading(false);
  };

  const isAdmin = role === "super_admin";

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      isAdmin,
      isDemo,
      role,
      signUp,
      signIn,
      signOut,
      loginAsRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  type AuthUser,
  type AppRole,
  signIn as authSignIn,
  signUp as authSignUp,
  signOutUser,
  validateSession,
  getStoredUser,
  switchTenant as authSwitchTenant,
  switchToPlatform as authSwitchToPlatform,
  fetchAllTenants,
} from "@/services/authService";

// ─── Context type ─────────────────────────────────────────────────────────────

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** True when super admin is in platform-level (no tenant) view */
  isPlatformView: boolean;
  role: AppRole | null;
  avatarUrl: string | null;
  displayName: string;
  currentTenantId: string | null;
  currentTenantName: string | null;
  signIn: (identifier: string, password: string, companySlug: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string, companySlug: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  switchToPlatform: () => Promise<void>;
  tenants: TenantInfo[];
  loadingTenants: boolean;
  refreshTenants: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Bootstrap: validate existing session on mount
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        // Quick check from cookie first for instant UI
        const cached = getStoredUser();
        if (cached && mounted) {
          setUser(cached);
        }

        // Then validate against DB
        const validUser = await validateSession();
        if (mounted) {
          setUser(validUser);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();
    return () => { mounted = false; };
  }, []);

  // Load tenants for super admin
  const refreshTenants = useCallback(async () => {
    if (!user?.is_super_admin) return;
    setLoadingTenants(true);
    try {
      const data = await fetchAllTenants();
      setTenants(data as TenantInfo[]);
    } catch {
      // silently fail
    } finally {
      setLoadingTenants(false);
    }
  }, [user?.is_super_admin]);

  // Auto-load tenants when super admin logs in
  useEffect(() => {
    if (user?.is_super_admin) {
      refreshTenants();
    }
  }, [user?.is_super_admin, refreshTenants]);

  // ── Sign In ───────────────────────────────────────────────────────
  const signIn = useCallback(async (identifier: string, password: string, companySlug: string) => {
    try {
      const authUser = await authSignIn({ identifier, password, company_slug: companySlug });
      setUser(authUser);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // ── Sign Up ───────────────────────────────────────────────────────
  const signUp = useCallback(async (email: string, password: string, displayName: string, companySlug: string, phone?: string) => {
    try {
      const authUser = await authSignUp({
        email,
        password,
        display_name: displayName,
        company_slug: companySlug,
        phone,
      });
      setUser(authUser);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // ── Sign Out ──────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setTenants([]);
  }, []);

  // ── Switch Tenant (super admin) ───────────────────────────────────
  const switchTenant = useCallback(async (tenantId: string) => {
    const updated = await authSwitchTenant(tenantId);
    setUser(updated);
  }, []);

  // ── Switch to Platform view (super admin) ─────────────────────────
  const switchToPlatform = useCallback(async () => {
    const updated = await authSwitchToPlatform();
    setUser(updated);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────
  const isSuperAdmin = user?.is_super_admin ?? false;
  const isAdmin = user?.role === "admin" || isSuperAdmin;
  const isPlatformView = isSuperAdmin && !user?.tenant_id;
  const role = user?.role ?? null;
  const avatarUrl = user?.avatar_url ?? null;
  const displayName = user?.display_name ?? "User";
  const currentTenantId = user?.tenant_id ?? null;
  const currentTenantName = user?.tenant_name ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        isPlatformView,
        role,
        avatarUrl,
        displayName,
        currentTenantId,
        currentTenantName,
        signIn,
        signUp,
        signOut,
        switchTenant,
        switchToPlatform,
        tenants,
        loadingTenants,
        refreshTenants,
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

/**
 * Authentication Service — Multi-tenant
 *
 * Cookie-based token authentication.
 * Users sign in with company slug + email + password.
 * Super admins can switch tenants without re-authenticating.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = "admin" | "member";

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  is_super_admin: boolean;
  /** Current tenant context (null for super admin before picking a tenant) */
  tenant_id: string | null;
  tenant_slug: string | null;
  tenant_name: string | null;
  /** Role within the current tenant (null for super admin viewing platform) */
  role: AppRole | null;
  created_at: string;
}

interface SignUpPayload {
  email: string;
  phone?: string;
  password: string;
  display_name: string;
  company_slug: string;
}

interface SignInPayload {
  identifier: string; // email or phone
  password: string;
  company_slug: string;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const TOKEN_KEY = "df_auth_token";
const USER_KEY = "df_auth_user";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure`;
}

// ─── Token persistence ────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return getCookie(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = getCookie(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistAuth(token: string, user: AuthUser) {
  setCookie(TOKEN_KEY, token, 30);
  setCookie(USER_KEY, JSON.stringify(user), 30);
}

export function clearAuth() {
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}

// ─── Hash password on client (SHA-256 + hex) ─────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Tenant resolution ────────────────────────────────────────────────────────

async function resolveTenant(slug: string) {
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, name, slug, is_active")
    .eq("slug", slug.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error('[resolveTenant] Supabase error:', error);
    throw new Error(error.message || "Unable to reach the server. Check your connection.");
  }
  if (!tenant) throw new Error("Company not found. Check your company URL.");
  if (!tenant.is_active) throw new Error("This company account has been deactivated.");
  return tenant;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Sign up a new user within a specific company.
 */
export async function signUp(payload: SignUpPayload): Promise<AuthUser> {
  const passwordHash = await hashPassword(payload.password);
  const tenant = await resolveTenant(payload.company_slug);

  // Check if email already exists
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", payload.email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  // Create the user
  const { data: user, error } = await supabase
    .from("app_users")
    .insert({
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone?.trim() || null,
      password_hash: passwordHash,
      display_name: payload.display_name.trim(),
    })
    .select()
    .single();

  if (error || !user) throw new Error(error?.message || "Failed to create account.");

  // Create tenant membership (default role = member)
  const { error: memErr } = await supabase.from("tenant_memberships").insert({
    user_id: user.id,
    tenant_id: tenant.id,
    role: "member",
  });

  if (memErr) throw new Error("Failed to join company.");

  // Create session
  const token = generateToken();
  await supabase.from("auth_sessions").insert({
    user_id: user.id,
    tenant_id: tenant.id,
    token,
    expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
  });

  const authUser = buildAuthUser(user, tenant, "member");
  persistAuth(token, authUser);
  return authUser;
}

/**
 * Sign in with company slug + email/phone + password.
 * Super admins skip the company slug requirement (pass "superadmin" as slug).
 */
export async function signIn(payload: SignInPayload): Promise<AuthUser> {
  const passwordHash = await hashPassword(payload.password);
  const identifier = payload.identifier.toLowerCase().trim();

  // Look up user by email or phone (avoid raw .or() filter to prevent PostgREST quoting issues)
  const isEmail = identifier.includes("@");
  let user: any = null;
  let error: any = null;

  if (isEmail) {
    const res = await supabase
      .from("app_users")
      .select("*")
      .eq("email", identifier)
      .maybeSingle();
    user = res.data;
    error = res.error;
  } else {
    const res = await supabase
      .from("app_users")
      .select("*")
      .eq("phone", identifier)
      .maybeSingle();
    user = res.data;
    error = res.error;
  }

  if (error) {
    console.error('[signIn] Supabase query error:', error);
    throw new Error(error.message || "Unable to reach the server. Please try again.");
  }
  if (!user) throw new Error("Invalid credentials.");
  if (user.password_hash !== passwordHash) throw new Error("Invalid credentials.");
  if (!user.is_active) throw new Error("Your account has been deactivated.");

  // Super admin flow — they get platform-level access
  if (user.is_super_admin) {
    let tenant: { id: string; name: string; slug: string } | null = null;
    if (payload.company_slug) {
      tenant = await resolveTenant(payload.company_slug);
    }

    const token = generateToken();
    await supabase.from("auth_sessions").insert({
      user_id: user.id,
      tenant_id: tenant?.id || null,
      token,
      expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
    });

    const authUser = buildAuthUser(user, tenant, tenant ? "admin" : null);
    persistAuth(token, authUser);
    return authUser;
  }

  // Regular user — must provide valid company slug
  if (!payload.company_slug) throw new Error("Company URL is required.");
  const tenant = await resolveTenant(payload.company_slug);

  // Verify membership
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role, is_active")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!membership) throw new Error("You are not a member of this company.");
  if (!membership.is_active) throw new Error("Your membership has been deactivated.");

  const token = generateToken();
  await supabase.from("auth_sessions").insert({
    user_id: user.id,
    tenant_id: tenant.id,
    token,
    expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
  });

  const authUser = buildAuthUser(user, tenant, membership.role as AppRole);
  persistAuth(token, authUser);
  return authUser;
}

/**
 * Switch tenant context (super admin only).
 * Creates a new session scoped to the target tenant.
 */
export async function switchTenant(tenantId: string): Promise<AuthUser> {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token || !storedUser || !storedUser.is_super_admin) {
    throw new Error("Only super admins can switch companies.");
  }

  // Fetch tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .single();

  if (!tenant) throw new Error("Company not found.");

  // Update existing session's tenant
  await supabase.from("auth_sessions").update({ tenant_id: tenant.id }).eq("token", token);

  const authUser: AuthUser = {
    ...storedUser,
    tenant_id: tenant.id,
    tenant_slug: tenant.slug,
    tenant_name: tenant.name,
    role: "admin", // super admin gets admin role in any tenant
  };

  persistAuth(token, authUser);
  return authUser;
}

/**
 * Switch to platform-level view (no tenant context) — super admin only.
 */
export async function switchToPlatform(): Promise<AuthUser> {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token || !storedUser || !storedUser.is_super_admin) {
    throw new Error("Only super admins can access platform view.");
  }

  await supabase.from("auth_sessions").update({ tenant_id: null }).eq("token", token);

  const authUser: AuthUser = {
    ...storedUser,
    tenant_id: null,
    tenant_slug: null,
    tenant_name: null,
    role: null,
  };

  persistAuth(token, authUser);
  return authUser;
}

/**
 * Validate current token against DB.
 */
export async function validateSession(): Promise<AuthUser | null> {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token || !storedUser) return null;

  const { data: session } = await supabase
    .from("auth_sessions")
    .select("user_id, tenant_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!session) {
    clearAuth();
    return null;
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("auth_sessions").delete().eq("token", token);
    clearAuth();
    return null;
  }

  // Refresh user data
  const { data: user } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user || !user.is_active) {
    clearAuth();
    return null;
  }

  // Resolve tenant + role
  let tenant: { id: string; name: string; slug: string } | null = null;
  let role: AppRole | null = null;

  if (session.tenant_id) {
    const { data: t } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", session.tenant_id)
      .single();
    tenant = t;

    if (user.is_super_admin) {
      role = "admin";
    } else {
      const { data: mem } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", session.tenant_id)
        .maybeSingle();
      role = (mem?.role as AppRole) || "member";
    }
  }

  const authUser = buildAuthUser(user, tenant, role);
  persistAuth(token, authUser);
  return authUser;
}

/**
 * Sign out — destroy session.
 */
export async function signOutUser(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    await supabase.from("auth_sessions").delete().eq("token", token);
  }
  clearAuth();
}

/**
 * Fetch all tenants (for super admin company switcher).
 */
export async function fetchAllTenants() {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, is_active, created_at")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildAuthUser(
  user: any,
  tenant: { id: string; name: string; slug: string } | null,
  role: AppRole | null,
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone || null,
    display_name: user.display_name || user.email,
    avatar_url: user.avatar_url || null,
    avatar_color: user.avatar_color || null,
    is_super_admin: !!user.is_super_admin,
    tenant_id: tenant?.id || null,
    tenant_slug: tenant?.slug || null,
    tenant_name: tenant?.name || null,
    role,
    created_at: user.created_at,
  };
}

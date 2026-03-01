/**
 * Authentication Service — Multi-tenant (Turso / Drizzle)
 *
 * Cookie-based token authentication.
 * Users sign in with company slug + email + password.
 * Super admins can switch tenants without re-authenticating.
 */
import { db } from "@/integrations/turso/db";
import { tenants, app_users, tenant_memberships, auth_sessions } from "@/integrations/turso/schema";
import { eq, and } from "drizzle-orm";

//  Types 

export type AppRole = "admin" | "member";

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  is_super_admin: boolean;
  tenant_id: string | null;
  tenant_slug: string | null;
  tenant_name: string | null;
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
  identifier: string;
  password: string;
  company_slug: string;
}

//  Cookie helpers 

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

//  Password hashing 

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

//  Tenant resolution 

async function resolveTenant(slug: string) {
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, is_active: tenants.is_active })
    .from(tenants)
    .where(eq(tenants.slug, slug.toLowerCase().trim()))
    .limit(1);

  if (!tenant) throw new Error("Company not found. Check your company URL.");
  if (!tenant.is_active) throw new Error("This company account has been deactivated.");
  return tenant;
}

//  Sign Up 

export async function signUp(payload: SignUpPayload): Promise<AuthUser> {
  const passwordHash = await hashPassword(payload.password);
  const tenant = await resolveTenant(payload.company_slug);

  const [existing] = await db
    .select({ id: app_users.id })
    .from(app_users)
    .where(eq(app_users.email, payload.email.toLowerCase().trim()))
    .limit(1);

  if (existing) throw new Error("An account with this email already exists.");

  const [user] = await db
    .insert(app_users)
    .values({
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone?.trim() || null,
      password_hash: passwordHash,
      display_name: payload.display_name.trim(),
    })
    .returning();

  if (!user) throw new Error("Failed to create account.");

  await db.insert(tenant_memberships).values({
    user_id: user.id,
    tenant_id: tenant.id,
    role: "member",
  });

  const token = generateToken();
  await db.insert(auth_sessions).values({
    user_id: user.id,
    tenant_id: tenant.id,
    token,
    expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
  });

  const authUser = buildAuthUser(user, tenant, "member");
  persistAuth(token, authUser);
  return authUser;
}

//  Sign In 

export async function signIn(payload: SignInPayload): Promise<AuthUser> {
  try {
    return await _signIn(payload);
  } catch (err: any) {
    if (
      err?.message?.includes("Failed to fetch") ||
      err?.message?.includes("NetworkError") ||
      err?.message?.includes("Load failed") ||
      err?.message?.includes("network")
    ) {
      throw new Error(
        "Unable to connect to the server. Check your network connection and Turso database status."
      );
    }
    throw err;
  }
}

async function _signIn(payload: SignInPayload): Promise<AuthUser> {
  const passwordHash = await hashPassword(payload.password);
  const identifier = payload.identifier.toLowerCase().trim();
  const isEmail = identifier.includes("@");

  const [user] = await db
    .select()
    .from(app_users)
    .where(isEmail ? eq(app_users.email, identifier) : eq(app_users.phone, identifier))
    .limit(1);

  if (!user) throw new Error("Invalid credentials.");
  if (user.password_hash !== passwordHash) throw new Error("Invalid credentials.");
  if (!user.is_active) throw new Error("Your account has been deactivated.");

  // Super admin flow
  if (user.is_super_admin) {
    let tenant: { id: string; name: string; slug: string } | null = null;
    if (payload.company_slug) {
      tenant = await resolveTenant(payload.company_slug);
    }

    const token = generateToken();
    await db.insert(auth_sessions).values({
      user_id: user.id,
      tenant_id: tenant?.id ?? null,
      token,
      expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
    });

    const authUser = buildAuthUser(user, tenant, tenant ? "admin" : null);
    persistAuth(token, authUser);
    return authUser;
  }

  if (!payload.company_slug) throw new Error("Company URL is required.");
  const tenant = await resolveTenant(payload.company_slug);

  const [membership] = await db
    .select({ role: tenant_memberships.role, is_active: tenant_memberships.is_active })
    .from(tenant_memberships)
    .where(and(eq(tenant_memberships.user_id, user.id), eq(tenant_memberships.tenant_id, tenant.id)))
    .limit(1);

  if (!membership) throw new Error("You are not a member of this company.");
  if (!membership.is_active) throw new Error("Your membership has been deactivated.");

  const token = generateToken();
  await db.insert(auth_sessions).values({
    user_id: user.id,
    tenant_id: tenant.id,
    token,
    expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
  });

  const authUser = buildAuthUser(user, tenant, membership.role as AppRole);
  persistAuth(token, authUser);
  return authUser;
}

//  Switch Tenant 

export async function switchTenant(tenantId: string): Promise<AuthUser> {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token || !storedUser || !storedUser.is_super_admin) {
    throw new Error("Only super admins can switch companies.");
  }

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) throw new Error("Company not found.");

  await db
    .update(auth_sessions)
    .set({ tenant_id: tenant.id })
    .where(eq(auth_sessions.token, token));

  const authUser: AuthUser = {
    ...storedUser,
    tenant_id: tenant.id,
    tenant_slug: tenant.slug,
    tenant_name: tenant.name,
    role: "admin",
  };

  persistAuth(token, authUser);
  return authUser;
}

//  Switch to Platform 

export async function switchToPlatform(): Promise<AuthUser> {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token || !storedUser || !storedUser.is_super_admin) {
    throw new Error("Only super admins can access platform view.");
  }

  await db
    .update(auth_sessions)
    .set({ tenant_id: null })
    .where(eq(auth_sessions.token, token));

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

//  Validate Session 

export async function validateSession(): Promise<AuthUser | null> {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token || !storedUser) return null;

  const [session] = await db
    .select({ user_id: auth_sessions.user_id, tenant_id: auth_sessions.tenant_id, expires_at: auth_sessions.expires_at })
    .from(auth_sessions)
    .where(eq(auth_sessions.token, token))
    .limit(1);

  if (!session) { clearAuth(); return null; }

  if (new Date(session.expires_at) < new Date()) {
    await db.delete(auth_sessions).where(eq(auth_sessions.token, token));
    clearAuth();
    return null;
  }

  const [user] = await db
    .select()
    .from(app_users)
    .where(eq(app_users.id, session.user_id))
    .limit(1);

  if (!user || !user.is_active) { clearAuth(); return null; }

  let tenant: { id: string; name: string; slug: string } | null = null;
  let role: AppRole | null = null;

  if (session.tenant_id) {
    const [t] = await db
      .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, session.tenant_id))
      .limit(1);

    tenant = t ?? null;

    if (user.is_super_admin) {
      role = "admin";
    } else {
      const [mem] = await db
        .select({ role: tenant_memberships.role })
        .from(tenant_memberships)
        .where(and(eq(tenant_memberships.user_id, user.id), eq(tenant_memberships.tenant_id, session.tenant_id)))
        .limit(1);
      role = (mem?.role as AppRole) || "member";
    }
  }

  const authUser = buildAuthUser(user, tenant, role);
  persistAuth(token, authUser);
  return authUser;
}

//  Sign Out 

export async function signOutUser(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    await db.delete(auth_sessions).where(eq(auth_sessions.token, token));
  }
  clearAuth();
}

//  Fetch All Tenants (super admin) 

export async function fetchAllTenants() {
  return db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      plan: tenants.plan,
      is_active: tenants.is_active,
      created_at: tenants.created_at,
    })
    .from(tenants)
    .orderBy(tenants.name);
}

//  Helpers 

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

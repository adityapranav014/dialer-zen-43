/**
 * Application configuration
 *
 * Central place for environment-level settings.
 * Add admin emails here — these users are automatically assigned
 * the "super_admin" role on sign-up / first Google login.
 * Everyone else defaults to "bda".
 */

export const APP_CONFIG = {
  /** Emails that receive the super_admin role */
  adminEmails: [
    "adityapranav014@gmail.com",
    // Add more admin emails below:
    // "another-admin@company.com",
  ],

  /** OAuth redirect path (must match Supabase dashboard config) */
  authCallbackUrl: `${window.location.origin}/auth/callback`,
} as const;

/** Check whether a given email should be super_admin */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return APP_CONFIG.adminEmails.some(
    (admin) => admin.toLowerCase() === email.toLowerCase(),
  );
}

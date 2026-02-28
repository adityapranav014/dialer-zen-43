/**
 * Application configuration
 *
 * Central place for environment-level settings.
 * Roles are managed in the database.
 * New users default to "member" role.
 * Promote users to "admin" directly in the app_users table.
 */

export const APP_CONFIG = {
  /** Application name */
  appName: "DialFlow",

  /** Session cookie expiry in days */
  sessionExpiryDays: 30,

  /** Minimum password length */
  minPasswordLength: 6,
} as const;

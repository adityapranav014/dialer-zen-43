/**
 * TypeScript types inferred from the Drizzle schema.
 */
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  tenants,
  app_users,
  tenant_memberships,
  auth_sessions,
  leads,
  call_logs,
  notifications,
  user_settings,
  activity_logs,
} from "./schema";

// Row types (SELECT results)
export type Tenant = InferSelectModel<typeof tenants>;
export type AppUser = InferSelectModel<typeof app_users>;
export type TenantMembership = InferSelectModel<typeof tenant_memberships>;
export type AuthSession = InferSelectModel<typeof auth_sessions>;
export type Lead = InferSelectModel<typeof leads>;
export type CallLog = InferSelectModel<typeof call_logs>;
export type Notification = InferSelectModel<typeof notifications>;
export type UserSettings = InferSelectModel<typeof user_settings>;
export type ActivityLog = InferSelectModel<typeof activity_logs>;

// Insert types
export type NewTenant = InferInsertModel<typeof tenants>;
export type NewAppUser = InferInsertModel<typeof app_users>;
export type NewTenantMembership = InferInsertModel<typeof tenant_memberships>;
export type NewAuthSession = InferInsertModel<typeof auth_sessions>;
export type NewLead = InferInsertModel<typeof leads>;
export type NewCallLog = InferInsertModel<typeof call_logs>;
export type NewNotification = InferInsertModel<typeof notifications>;
export type NewUserSettings = InferInsertModel<typeof user_settings>;
export type NewActivityLog = InferInsertModel<typeof activity_logs>;

// Lead status enum (runtime values)
export const LEAD_STATUSES = ["new", "contacted", "interested", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

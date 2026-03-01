/**
 * Drizzle ORM schema — Turso / SQLite
 *
 * SQLite-specific types:
 *   • boolean → integer({ mode: "boolean" })
 *   • json    → text({ mode: "json" })
 *   • uuid    → text (generated via crypto.randomUUID() at insert time)
 */
import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uuid = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);
const updatedAt = () => text("updated_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const tenants = sqliteTable("tenants", {
  id: uuid(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo_url: text("logo_url"),
  plan: text("plan").notNull().default("free"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  settings: text("settings", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  created_at: now(),
  updated_at: updatedAt(),
});

export const app_users = sqliteTable("app_users", {
  id: uuid(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password_hash: text("password_hash").notNull(),
  display_name: text("display_name").notNull().default(""),
  avatar_url: text("avatar_url"),
  avatar_color: text("avatar_color"),
  is_super_admin: integer("is_super_admin", { mode: "boolean" }).notNull().default(false),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: now(),
  updated_at: updatedAt(),
});

export const tenant_memberships = sqliteTable("tenant_memberships", {
  id: uuid(),
  user_id: text("user_id").notNull().references(() => app_users.id),
  tenant_id: text("tenant_id").notNull().references(() => tenants.id),
  role: text("role").notNull().default("member"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  joined_at: text("joined_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const auth_sessions = sqliteTable("auth_sessions", {
  id: uuid(),
  user_id: text("user_id").notNull().references(() => app_users.id),
  tenant_id: text("tenant_id").references(() => tenants.id),
  token: text("token").notNull().unique(),
  expires_at: text("expires_at").notNull(),
  created_at: now(),
});

export const leads = sqliteTable("leads", {
  id: uuid(),
  tenant_id: text("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  /** "new" | "contacted" | "interested" | "closed" */
  status: text("status").notNull().default("new"),
  assigned_to: text("assigned_to").references(() => app_users.id),
  created_at: now(),
  updated_at: updatedAt(),
});

export const call_logs = sqliteTable("call_logs", {
  id: uuid(),
  tenant_id: text("tenant_id").notNull().references(() => tenants.id),
  lead_id: text("lead_id").notNull().references(() => leads.id),
  user_id: text("user_id").notNull().references(() => app_users.id),
  duration_seconds: integer("duration_seconds").notNull().default(0),
  outcome: text("outcome"),
  notes: text("notes"),
  created_at: now(),
});

export const notifications = sqliteTable("notifications", {
  id: uuid(),
  tenant_id: text("tenant_id").notNull().references(() => tenants.id),
  user_id: text("user_id").notNull().references(() => app_users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("normal"),
  is_read: integer("is_read", { mode: "boolean" }).notNull().default(false),
  action_url: text("action_url"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown> | null>(),
  read_at: text("read_at"),
  created_at: now(),
});

export const user_settings = sqliteTable("user_settings", {
  id: uuid(),
  user_id: text("user_id").notNull().unique().references(() => app_users.id),
  notif_new_lead: integer("notif_new_lead", { mode: "boolean" }).notNull().default(true),
  notif_missed_call: integer("notif_missed_call", { mode: "boolean" }).notNull().default(true),
  notif_conversion: integer("notif_conversion", { mode: "boolean" }).notNull().default(true),
  notif_team_updates: integer("notif_team_updates", { mode: "boolean" }).notNull().default(false),
  notif_daily_summary: integer("notif_daily_summary", { mode: "boolean" }).notNull().default(true),
  auto_dial_next: integer("auto_dial_next", { mode: "boolean" }).notNull().default(false),
  cooldown_timer: integer("cooldown_timer").notNull().default(30),
  show_post_call_modal: integer("show_post_call_modal", { mode: "boolean" }).notNull().default(true),
  call_recording: integer("call_recording", { mode: "boolean" }).notNull().default(true),
  default_lead_status: text("default_lead_status").notNull().default("new"),
  auto_assign_leads: integer("auto_assign_leads", { mode: "boolean" }).notNull().default(false),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  language: text("language").notNull().default("English"),
  created_at: now(),
  updated_at: updatedAt(),
});

export const activity_logs = sqliteTable("activity_logs", {
  id: uuid(),
  tenant_id: text("tenant_id").notNull().references(() => tenants.id),
  user_id: text("user_id").references(() => app_users.id),
  action: text("action").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown> | null>(),
  created_at: now(),
});

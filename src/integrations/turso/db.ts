/**
 * Drizzle ORM instance — Turso (libSQL)
 *
 * Usage:
 *   import { db } from "@/integrations/turso/db";
 *   import { tenants, leads } from "@/integrations/turso/schema";
 *   import { eq } from "drizzle-orm";
 */
import { drizzle } from "drizzle-orm/libsql";
import { tursoClient } from "./client";
import * as schema from "./schema";

export const db = drizzle(tursoClient, { schema });
export type DB = typeof db;

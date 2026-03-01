/**
 * Turso / libSQL browser client
 *
 * Uses the HTTP-based web client so it works inside the Vite bundle.
 * Import `db` from "./db" for Drizzle-powered queries.
 */
import { createClient } from "@libsql/client/web";

const url = import.meta.env.VITE_TURSO_DATABASE_URL as string;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN as string;

if (!url || !authToken) {
  console.error(
    "[Turso] Missing env variables. " +
    "Ensure VITE_TURSO_DATABASE_URL and VITE_TURSO_AUTH_TOKEN are set in .env"
  );
}

export const tursoClient = createClient({ url, authToken });

/**
 * Quick connectivity check — returns { ok: true } if Turso is reachable.
 */
export async function checkTursoConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await tursoClient.execute("SELECT 1");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Cannot connect to the Turso database." };
  }
}

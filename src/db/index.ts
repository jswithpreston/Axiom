// =============================================================================
// Axiom — Database Connection (Neon + Drizzle)
// Lazy initialization — connection is created on first call, not at module load.
// This allows Next.js to complete static analysis during build without DATABASE_URL.
// =============================================================================

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Returns a Drizzle DB instance backed by Neon HTTP.
 * Call this inside route handlers — not at module scope.
 * The Neon HTTP driver is stateless, so a fresh instance per request is fine.
 */
export function getDb(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

// Re-export schema for convenient single-import across routes
export * from "./schema";

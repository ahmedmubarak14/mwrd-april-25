import type { Config } from "drizzle-kit";

// DATABASE_URL is only required for `drizzle-kit push` / `migrate` / `studio`.
// `drizzle-kit generate` emits SQL from the schema diff without a live DB, so
// we accept an empty string here and let drizzle-kit surface the error itself
// when the URL is actually needed.
export default {
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "../../supabase/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
} satisfies Config;

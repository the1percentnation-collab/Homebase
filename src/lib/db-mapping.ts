import type { CollectionName } from "./schema";

/* -------------------------------------------------------------------------- */
/*                           camelCase <-> snake_case                         */
/* -------------------------------------------------------------------------- */

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function toDbRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[camelToSnake(k)] = v;
  }
  return out;
}

export function fromDbRow(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[snakeToCamel(k)] = v;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                          Collection -> table name                          */
/* -------------------------------------------------------------------------- */

// The public.users table conflicts with Supabase's managed auth.users table
// in mental models; store app user info in public.profiles instead.
const TABLE_NAME_OVERRIDES: Partial<Record<CollectionName, string>> = {
  users: "profiles",
};

export function tableNameFor(collection: CollectionName): string {
  return TABLE_NAME_OVERRIDES[collection] ?? camelToSnake(collection);
}

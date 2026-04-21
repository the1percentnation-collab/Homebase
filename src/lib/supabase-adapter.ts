import { nanoid } from "nanoid";
import { fromDbRow, tableNameFor, toDbRow } from "./db-mapping";
import {
  COLLECTIONS,
  type CollectionItem,
  type CollectionName,
} from "./schema";
import type { StorageAdapter } from "./storage";
import { getSupabaseClient } from "./supabase";

function nowIso(): string {
  return new Date().toISOString();
}

function requireClient() {
  const c = getSupabaseClient();
  if (!c) {
    throw new Error(
      "Supabase client not configured. Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return c;
}

function ensureError(error: { message: string } | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

/**
 * StorageAdapter backed by Supabase/Postgres.
 *
 * Column mapping is camelCase (app) <-> snake_case (db) — see db-mapping.
 * Task 21 will attach household_id to every write and filter every read so
 * the app only sees rows from the logged-in user's household; for now this
 * adapter reads/writes plain rows, which matches the SQL schema added in
 * Task 22 before RLS is enabled.
 */
export class SupabaseAdapter implements StorageAdapter {
  async list<K extends CollectionName>(collection: K) {
    const client = requireClient();
    const { data, error } = await client
      .from(tableNameFor(collection))
      .select("*");
    ensureError(error, `list ${collection}`);
    const rows = (data ?? []) as Record<string, unknown>[];
    return rows.map((r) => validate(collection, fromDbRow(r))) as CollectionItem<K>[];
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    const client = requireClient();
    const { data, error } = await client
      .from(tableNameFor(collection))
      .select("*")
      .eq("id", id)
      .maybeSingle();
    ensureError(error, `get ${collection}/${id}`);
    if (!data) return null;
    return validate(collection, fromDbRow(data as Record<string, unknown>)) as CollectionItem<K>;
  }

  async create<K extends CollectionName>(
    collection: K,
    input: Omit<CollectionItem<K>, "id" | "createdAt" | "updatedAt"> &
      Partial<Pick<CollectionItem<K>, "id">>
  ) {
    const client = requireClient();
    const candidate = {
      ...input,
      id: (input as { id?: string }).id ?? nanoid(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const validated = validate(collection, candidate) as CollectionItem<K>;

    const { error } = await client
      .from(tableNameFor(collection))
      .insert(toDbRow(validated as Record<string, unknown>));
    ensureError(error, `create ${collection}`);
    return validated;
  }

  async update<K extends CollectionName>(
    collection: K,
    id: string,
    patch: Partial<CollectionItem<K>>
  ) {
    const client = requireClient();
    const existing = await this.get(collection, id);
    if (!existing) {
      throw new Error(`${collection}:${id} not found`);
    }
    const merged = {
      ...(existing as Record<string, unknown>),
      ...(patch as Record<string, unknown>),
      id,
      updatedAt: nowIso(),
    };
    const validated = validate(collection, merged) as CollectionItem<K>;

    const { error } = await client
      .from(tableNameFor(collection))
      .update(toDbRow(validated as Record<string, unknown>))
      .eq("id", id);
    ensureError(error, `update ${collection}/${id}`);
    return validated;
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    const client = requireClient();
    const { error } = await client
      .from(tableNameFor(collection))
      .delete()
      .eq("id", id);
    ensureError(error, `remove ${collection}/${id}`);
  }

  async clear(collection?: CollectionName) {
    const client = requireClient();
    const targets = collection
      ? [collection]
      : (Object.keys(COLLECTIONS) as CollectionName[]);
    for (const c of targets) {
      // Supabase requires a filter on delete; delete everything visible to
      // the caller (RLS will scope it to their household once Task 21 lands).
      const { error } = await client
        .from(tableNameFor(c))
        .delete()
        .neq("id", "__never__");
      ensureError(error, `clear ${c}`);
    }
  }

  async exportAll() {
    const result = {} as Record<CollectionName, unknown[]>;
    for (const c of Object.keys(COLLECTIONS) as CollectionName[]) {
      result[c] = await this.list(c);
    }
    return result;
  }

  async importAll(data: Partial<Record<CollectionName, unknown[]>>) {
    const client = requireClient();
    for (const c of Object.keys(data) as CollectionName[]) {
      const items = data[c];
      if (!Array.isArray(items) || items.length === 0) continue;
      const schema = COLLECTIONS[c];
      const validated = items
        .map((item) => schema.safeParse(item))
        .filter((r) => r.success)
        .map((r) => (r.success ? r.data : null))
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (validated.length === 0) continue;
      const rows = validated.map((v) =>
        toDbRow(v as unknown as Record<string, unknown>)
      );
      const { error } = await client
        .from(tableNameFor(c))
        .upsert(rows, { onConflict: "id" });
      ensureError(error, `importAll ${c}`);
    }
  }
}

function validate<K extends CollectionName>(
  collection: K,
  candidate: unknown
): unknown {
  const schema = COLLECTIONS[collection];
  return schema.parse(candidate);
}

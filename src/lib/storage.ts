import { nanoid } from "nanoid";
import { COLLECTIONS, type CollectionItem, type CollectionName } from "./schema";

/* -------------------------------------------------------------------------- */
/*                             Storage abstraction                            */
/* -------------------------------------------------------------------------- */

// A single interface covers both the browser (localStorage) and a future
// cloud backend (e.g. Supabase). Modules depend only on this surface, so
// swapping adapters doesn't touch feature code.
export interface StorageAdapter {
  list<K extends CollectionName>(collection: K): Promise<CollectionItem<K>[]>;
  get<K extends CollectionName>(
    collection: K,
    id: string
  ): Promise<CollectionItem<K> | null>;
  create<K extends CollectionName>(
    collection: K,
    input: Omit<CollectionItem<K>, "id" | "createdAt" | "updatedAt"> &
      Partial<Pick<CollectionItem<K>, "id">>
  ): Promise<CollectionItem<K>>;
  update<K extends CollectionName>(
    collection: K,
    id: string,
    patch: Partial<CollectionItem<K>>
  ): Promise<CollectionItem<K>>;
  remove<K extends CollectionName>(collection: K, id: string): Promise<void>;
  clear(collection?: CollectionName): Promise<void>;
  exportAll(): Promise<Record<CollectionName, unknown[]>>;
  importAll(data: Partial<Record<CollectionName, unknown[]>>): Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                          LocalStorage implementation                       */
/* -------------------------------------------------------------------------- */

const NAMESPACE = "homebase";
const keyFor = (c: CollectionName) => `${NAMESPACE}:${c}`;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readCollection<K extends CollectionName>(
  collection: K
): CollectionItem<K>[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(keyFor(collection));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CollectionItem<K>[]) : [];
  } catch {
    return [];
  }
}

function writeCollection<K extends CollectionName>(
  collection: K,
  items: CollectionItem<K>[]
): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(keyFor(collection), JSON.stringify(items));
}

function nowIso(): string {
  return new Date().toISOString();
}

export class LocalStorageAdapter implements StorageAdapter {
  async list<K extends CollectionName>(collection: K) {
    return readCollection(collection);
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    const items = readCollection(collection);
    return items.find((item) => (item as { id: string }).id === id) ?? null;
  }

  async create<K extends CollectionName>(
    collection: K,
    input: Omit<CollectionItem<K>, "id" | "createdAt" | "updatedAt"> &
      Partial<Pick<CollectionItem<K>, "id">>
  ) {
    const schema = COLLECTIONS[collection];
    const candidate = {
      ...input,
      id: (input as { id?: string }).id ?? nanoid(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const validated = schema.parse(candidate) as CollectionItem<K>;
    const items = readCollection(collection);
    items.push(validated);
    writeCollection(collection, items);
    return validated;
  }

  async update<K extends CollectionName>(
    collection: K,
    id: string,
    patch: Partial<CollectionItem<K>>
  ) {
    const schema = COLLECTIONS[collection];
    const items = readCollection(collection);
    const idx = items.findIndex((item) => (item as { id: string }).id === id);
    if (idx === -1) {
      throw new Error(`${collection}:${id} not found`);
    }
    const merged = {
      ...items[idx],
      ...patch,
      id,
      updatedAt: nowIso(),
    };
    const validated = schema.parse(merged) as CollectionItem<K>;
    items[idx] = validated;
    writeCollection(collection, items);
    return validated;
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    const items = readCollection(collection).filter(
      (item) => (item as { id: string }).id !== id
    );
    writeCollection(collection, items);
  }

  async clear(collection?: CollectionName) {
    if (!isBrowser()) return;
    if (collection) {
      window.localStorage.removeItem(keyFor(collection));
      return;
    }
    (Object.keys(COLLECTIONS) as CollectionName[]).forEach((c) => {
      window.localStorage.removeItem(keyFor(c));
    });
  }

  async exportAll() {
    const result = {} as Record<CollectionName, unknown[]>;
    (Object.keys(COLLECTIONS) as CollectionName[]).forEach((c) => {
      result[c] = readCollection(c);
    });
    return result;
  }

  async importAll(data: Partial<Record<CollectionName, unknown[]>>) {
    (Object.keys(data) as CollectionName[]).forEach((c) => {
      const items = data[c];
      if (Array.isArray(items)) {
        const schema = COLLECTIONS[c];
        const validated = items
          .map((item) => {
            const result = schema.safeParse(item);
            return result.success ? result.data : null;
          })
          .filter((x): x is CollectionItem<typeof c> => x !== null);
        writeCollection(c, validated);
      }
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Singleton                                  */
/* -------------------------------------------------------------------------- */

let adapterInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!adapterInstance) {
    adapterInstance = new LocalStorageAdapter();
  }
  return adapterInstance;
}

export function setStorage(adapter: StorageAdapter): void {
  adapterInstance = adapter;
}

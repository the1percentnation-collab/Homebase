"use client";

import { useCallback, useEffect, useState } from "react";
import { getStorage } from "./storage";
import type { CollectionItem, CollectionName } from "./schema";

type UseCollectionState<K extends CollectionName> = {
  items: CollectionItem<K>[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useCollection<K extends CollectionName>(
  collection: K
): UseCollectionState<K> {
  const [items, setItems] = useState<CollectionItem<K>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getStorage().list(collection);
      setItems(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

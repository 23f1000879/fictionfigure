"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId?: string | null;
  _count?: { products?: number };
}

// One request per page load, shared by every consumer.
let cache: StoreCategory[] | null = null;
let inflight: Promise<StoreCategory[]> | null = null;

function loadCategories(): Promise<StoreCategory[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch(`${API_BASE}/products/categories`)
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        cache = Array.isArray(data.categories) ? data.categories : [];
        return cache!;
      })
      .catch(() => [])
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Real store categories from the existing categories API. `enabled` defers the request until needed. */
export function useStoreCategories(enabled = true) {
  const [categories, setCategories] = useState<StoreCategory[] | null>(cache);

  useEffect(() => {
    if (!enabled || categories) return;
    let alive = true;
    loadCategories().then((list) => {
      if (alive) setCategories(list);
    });
    return () => {
      alive = false;
    };
  }, [enabled, categories]);

  return { categories: categories || [], loading: enabled && categories === null };
}

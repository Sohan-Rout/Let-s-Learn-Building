"use client";

import { useCallback, useEffect, useState } from "react";
import { cacheGet, cachedFetch, type CachedFetchOptions } from "@/lib/sqlite/cache";
import { useOnlineStatus } from "./use-online-status";

type State<T> = {
  key: string | null;
  data?: T;
  error?: Error;
  fromCache: boolean;
  stale: boolean;
  updatedAt?: number;
};

/**
 * Stale-while-revalidate backed by SQLite:
 * 1. Shows the cached response instantly (if any).
 * 2. Fetches from the network and swaps in fresh data.
 * 3. On failure keeps showing cached data, and retries when back online.
 *
 * Pass `null` as the URL to skip fetching.
 */
export function useCachedFetch<T>(url: string | null, options: CachedFetchOptions = {}) {
  const { key: customKey, ttlMs, timeoutMs } = options;
  const key = customKey ?? url;
  const online = useOnlineStatus();
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<State<T>>({ key: null, fromCache: false, stale: false });

  useEffect(() => {
    if (!url || !key) return;
    let cancelled = false;
    let gotNetwork = false;

    cacheGet<T>(key)
      .then((cached) => {
        if (cancelled || gotNetwork || !cached) return;
        setState({ key, data: cached.value, fromCache: true, stale: cached.stale, updatedAt: cached.updatedAt });
      })
      .catch(() => {});

    cachedFetch<T>(url, undefined, { key, ttlMs, timeoutMs })
      .then((res) => {
        if (cancelled) return;
        gotNetwork = !res.fromCache;
        setState({ key, ...res });
      })
      .catch((error: Error) => {
        if (!cancelled) setState((s) => (s.key === key ? { ...s, error } : { key, error, fromCache: false, stale: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [url, key, ttlMs, timeoutMs, online, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const current = state.key === key ? state : undefined;

  return {
    data: current?.data,
    error: current?.error,
    /** True until the first cached or network result arrives. */
    isLoading: !!url && !current,
    /** Data came from the local cache, not a fresh network response. */
    fromCache: current?.fromCache ?? false,
    /** Cached data is older than `ttlMs`. */
    stale: current?.stale ?? false,
    updatedAt: current?.updatedAt,
    online,
    refresh,
  };
}

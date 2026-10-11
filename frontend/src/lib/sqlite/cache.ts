import { query } from "./client";

export type CacheEntry<T> = {
  value: T;
  updatedAt: number;
  /** True when past its TTL. Stale entries are still returned so the UI has something to show. */
  stale: boolean;
};

type CacheRow = { value: string; updated_at: number; expires_at: number | null };

export async function cacheGet<T>(key: string): Promise<CacheEntry<T> | null> {
  const [row] = await query<CacheRow>(
    "SELECT value, updated_at, expires_at FROM cache WHERE key = ?",
    [key],
  );
  if (!row) return null;
  return {
    value: JSON.parse(row.value) as T,
    updatedAt: row.updated_at,
    stale: row.expires_at !== null && row.expires_at < Date.now(),
  };
}

/** Store any JSON-serialisable value. `ttlMs` marks when it becomes stale (omit = never). */
export async function cacheSet<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  const now = Date.now();
  await query(
    `INSERT INTO cache (key, value, updated_at, expires_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value, updated_at = excluded.updated_at, expires_at = excluded.expires_at`,
    [key, JSON.stringify(value), now, ttlMs === undefined ? null : now + ttlMs],
  );
}

export async function cacheDelete(key: string): Promise<void> {
  await query("DELETE FROM cache WHERE key = ?", [key]);
}

/** Delete every key that starts with `prefix`, or the whole cache when omitted. */
export async function cacheClear(prefix?: string): Promise<void> {
  if (prefix === undefined) await query("DELETE FROM cache");
  else await query("DELETE FROM cache WHERE key LIKE ? ESCAPE '\\'", [escapeLike(prefix) + "%"]);
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

export type CachedFetchOptions = {
  /** Cache key. Defaults to the URL. */
  key?: string;
  /** How long a response counts as fresh. Default 5 minutes. */
  ttlMs?: number;
  /** Give up on the network after this long and use the cache. Default 5 seconds. */
  timeoutMs?: number;
};

export type CachedFetchResult<T> = {
  data: T;
  fromCache: boolean;
  stale: boolean;
  updatedAt: number;
};

/**
 * Network first, cache as fallback. Successful JSON responses are saved;
 * if the request fails, times out, or the user is offline, the last saved
 * response is returned instead. Throws only when there is nothing cached.
 */
export async function cachedFetch<T>(
  url: string,
  init?: RequestInit,
  { key = url, ttlMs = 5 * 60_000, timeoutMs = 5_000 }: CachedFetchOptions = {},
): Promise<CachedFetchResult<T>> {
  try {
    if (!navigator.onLine) throw new Error("offline");

    const res = await fetch(url, { ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as T;
    await cacheSet(key, data, ttlMs);
    return { data, fromCache: false, stale: false, updatedAt: Date.now() };
  } catch (err) {
    const cached = await cacheGet<T>(key);
    if (!cached) throw err;
    return { data: cached.value, fromCache: true, stale: cached.stale, updatedAt: cached.updatedAt };
  }
}

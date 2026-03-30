/**
 * Lightweight request cache.
 * - Deduplicates concurrent in-flight requests for the same key.
 * - Caches the last result for TTL_MS so rapid re-mounts (StrictMode, layout
 *   + page both calling the same hook) return the same data without a network round-trip.
 * - `invalidate(key)` clears the cached result so the next call goes over the wire.
 */

const TTL_MS = 30_000;

interface Entry<T> {
  promise?: Promise<T>;
  data?: T;
  ts?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, Entry<any>>();

export async function cachedFetch<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as Entry<T> | undefined;

  // Return fresh cached value
  if (
    entry?.data !== undefined &&
    entry.ts !== undefined &&
    now - entry.ts < TTL_MS
  ) {
    return entry.data;
  }

  // Deduplicate in-flight request
  if (entry?.promise) {
    return entry.promise;
  }

  const promise = fn()
    .then((data) => {
      // Keep the promise so any caller that arrives while the .then() is
      // being processed still sees an in-flight entry and doesn't race.
      store.set(key, { promise, data, ts: Date.now() });
      return data;
    })
    .catch((err) => {
      // Clear so the next call retries
      store.delete(key);
      throw err;
    });

  store.set(key, { ...entry, promise });
  return promise;
}

export function invalidateCache(key: string) {
  store.delete(key);
}

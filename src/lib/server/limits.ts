// Server-only helpers: a small in-memory cache and a per-visitor rate limit.
// Both live in the memory of one server process. On a serverless host they
// reset whenever the process is recycled, which is acceptable here.

const CACHE_MAX = 300;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { value: unknown; at: number }>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, at: Date.now() });
}

/** Drops every cached entry whose key starts with `prefix`. */
export function cacheClear(prefix: string) {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
// Per visitor IP. On a single demo laptop every request shares one IP, so the
// default is generous; tighten with RATE_MAX when deployed publicly.
const RATE_MAX = Number(process.env.RATE_MAX) || 60;
const hits = new Map<string, number[]>();

/** Returns true when the visitor may proceed. */
export function allowRequest(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "local";
}

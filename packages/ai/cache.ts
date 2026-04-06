// packages/ai/cache.ts

// In-memory cache (works locally + Vercel serverless)
// For production, replace with Redis/Upstash

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

const DEFAULT_TTL = 1000 * 60 * 30; // 30 minutes

export function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCache(key: string, data: any, ttl: number = DEFAULT_TTL): void {
  // Limit cache size to prevent memory issues
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function getCacheKey(url: string): string {
  return url
    .toLowerCase()
    .replace(/\/$/, "")
    .replace(/https?:\/\/github\.com\//i, "")
    .replace(/\/voice.*/, "")
    .replace(/\/mode.*/, "");
}

export function clearCache(): void {
  cache.clear();
}
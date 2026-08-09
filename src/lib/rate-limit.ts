type RateLimitEntry = {
  count: number;
  resetAt: number;
};
type RateLimitStore = Map<string, RateLimitEntry>;
declare global {
  var __knowledgeNestRateLimitStore: RateLimitStore | undefined;
  var __knowledgeNestRateLimitOperations: number | undefined;
}
const MAX_RATE_LIMIT_ENTRIES = 10_000;
const CLEANUP_INTERVAL = 256;
const store: RateLimitStore =
  globalThis.__knowledgeNestRateLimitStore ?? new Map<string, RateLimitEntry>();
globalThis.__knowledgeNestRateLimitStore = store;
export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};
function cleanupExpiredEntries(now: number): void {
  const previousOperations = globalThis.__knowledgeNestRateLimitOperations ?? 0;
  const nextOperations = previousOperations + 1;
  globalThis.__knowledgeNestRateLimitOperations = nextOperations;
  if (store.size < MAX_RATE_LIMIT_ENTRIES && nextOperations % CLEANUP_INTERVAL !== 0) {
    return;
  }
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
  while (store.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = store.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    store.delete(oldestKey);
  }
}
function normalizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(1, Math.floor(value));
}
export function consumeRateLimit({
  key,
  limit,
  windowMilliseconds,
}: {
  key: string;
  limit: number;
  windowMilliseconds: number;
}): RateLimitResult {
  const safeLimit = normalizePositiveInteger(limit, 1);
  const safeWindowMilliseconds = normalizePositiveInteger(windowMilliseconds, 60_000);
  const normalizedKey = key.trim().slice(0, 512);
  if (!normalizedKey) {
    throw new Error("Rate-limit key is required.");
  }
  const now = Date.now();
  cleanupExpiredEntries(now);
  const existing = store.get(normalizedKey);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + safeWindowMilliseconds;
    store.set(normalizedKey, {
      count: 1,
      resetAt,
    });
    return {
      allowed: true,
      limit: safeLimit,
      remaining: Math.max(0, safeLimit - 1),
      retryAfterSeconds: 0,
      resetAt,
    };
  }
  if (existing.count >= safeLimit) {
    return {
      allowed: false,
      limit: safeLimit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }
  existing.count += 1;
  return {
    allowed: true,
    limit: safeLimit,
    remaining: Math.max(0, safeLimit - existing.count),
    retryAfterSeconds: 0,
    resetAt: existing.resetAt,
  };
}
function normalizeAddress(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const normalized = value
    .trim()
    .replace(/^["']|["']$/g, "")
    .slice(0, 128);
  if (!normalized) {
    return null;
  }
  if (!/^[A-Za-z0-9:.[\]_%+-]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}
export function getRequestClientAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstAddress = normalizeAddress(forwardedFor.split(",")[0] ?? null);
    if (firstAddress) {
      return firstAddress;
    }
  }
  const realIp = normalizeAddress(request.headers.get("x-real-ip"));
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed && result.retryAfterSeconds > 0) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headers;
}

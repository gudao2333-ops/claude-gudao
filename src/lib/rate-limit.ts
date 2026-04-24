const bucket = new Map<string, { count: number; resetAt: number }>();

export type RateLimitInput = {
  userId?: string;
  ip?: string;
  key?: string;
  limit?: number;
  windowMs?: number;
};

export function checkRateLimit({ userId, ip, key, limit = 30, windowMs = 60_000 }: RateLimitInput) {
  const id = key ?? userId ?? ip;
  if (!id) {
    return { allowed: true, remaining: limit };
  }

  const now = Date.now();
  const k = `rl:${id}`;
  const current = bucket.get(k);

  if (!current || current.resetAt < now) {
    bucket.set(k, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  bucket.set(k, current);
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function clearRateLimitMemory() {
  bucket.clear();
}

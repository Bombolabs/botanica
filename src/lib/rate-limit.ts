import "server-only";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count <= options.limit) return { ok: true };

  return {
    ok: false,
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export function rateLimitedResponse(retryAfter: number): Response {
  return Response.json(
    { error: "rate limited" },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Retry-After": String(retryAfter),
      },
    },
  );
}

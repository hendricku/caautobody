# Rate Limiting (Next.js API Routes)

## The one thing that trips people up

Next.js API routes deployed to a serverless/edge platform (Vercel, most typical Next.js hosting) don't share memory between invocations — each request can land on a different instance, and instances get recycled. A rate limiter built on a plain in-memory `Map` or counter will *appear* to work in local dev (single process) and then silently do nothing in production (each instance has its own empty counter). Always check where the app is deployed before trusting an in-memory limiter.

- **Local dev / a single long-running Node server:** an in-memory `Map`-based limiter is fine.
- **Serverless/edge (Vercel, most production Next.js deployments):** use a shared external store — Redis is the standard choice. `@upstash/ratelimit` + `@upstash/redis` is the most common Next.js-native pairing (works from serverless and edge runtimes over HTTP, no persistent connection needed). Self-hosted Redis with `rate-limiter-flexible` is the alternative if the project already runs its own Redis.

If you're not sure which situation applies, ask, or check for a `redis`/`upstash` dependency and a `vercel.json`/Vercel-specific config already in the project — that's a strong signal it's serverless.

## Reusable wrapper

Put this in `lib/rate-limit.ts` and use it to wrap individual route handlers, so limits stay per-endpoint instead of one global number:

```ts
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL / TOKEN

// Define one limiter per sensitivity tier — reuse across endpoints rather
// than inventing a new number for every route.
export const limiters = {
  auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "5 m"), prefix: "rl:auth" }),
  mutation: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "rl:mutation" }),
  read: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m"), prefix: "rl:read" }),
  expensive: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "rl:expensive" }),
};

function clientKey(req: Request, userId?: string) {
  // Prefer the authenticated user when known — an IP can be shared by many
  // legitimate users (offices, NAT, mobile carriers) and spoofed in headers
  // you don't control. Only trust the header your platform sets canonically
  // (e.g. Vercel sets `x-forwarded-for` at the edge) — never trust a
  // client-suppliable IP header directly.
  if (userId) return `user:${userId}`;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `ip:${ip}`;
}

export async function checkRateLimit(
  tier: keyof typeof limiters,
  req: Request,
  userId?: string
) {
  const { success, limit, remaining, reset } = await limiters[tier].limit(clientKey(req, userId));
  return { success, limit, remaining, reset };
}
```

Use it in a handler:

```ts
export async function POST(req: Request) {
  const { success, reset } = await checkRateLimit("auth", req);
  if (!success) {
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
    });
  }
  // ... handler logic
}
```

## Sizing limits per endpoint

Don't apply one blanket number everywhere — size it to what abuse of that specific endpoint costs:

| Endpoint type | Example | Suggested starting point |
|---|---|---|
| Auth (login, signup, password reset, OTP) | `/api/auth/login` | 5 requests / 5 min per identifier — brute-force is the threat |
| Mutations (create/update/delete) | `/api/orders`, `/api/profile` | 20–30 requests / min |
| Public reads | `/api/products` | 60–100 requests / min |
| Expensive (search, export, third-party/AI proxying, file processing) | `/api/search`, `/api/export` | Low and possibly cost/tier-based — flag as "needs your decision" if pricing tiers matter |

These are starting points, not fixed rules — call out in the report that the exact numbers are a judgment call the user may want to tune based on real traffic.

## Local-dev fallback (no Redis available)

If the project has no Redis/Upstash set up yet and adding one is out of scope for this pass, a simple in-memory limiter is still better than nothing for local dev — just label it clearly so it isn't mistaken for a production-ready solution:

```ts
// lib/rate-limit-memory.ts
// DEV ONLY — does not work correctly across multiple serverless instances.
// Replace with the Redis-backed limiter above before deploying.
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimitMemory(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  entry.count++;
  return { success: entry.count <= max };
}
```

Call this out explicitly in the findings report as a Medium/High-severity gap ("no production-ready rate limiting") rather than silently shipping the in-memory version as if it were the fix.

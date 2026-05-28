const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

type Entry = {
  count: number;
  expiresAt: number;
};

const rateLimitStore = new Map<string, Entry>();

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

export function checkRateLimit(request: Request, routeKey: string) {
  const now = Date.now();
  const identifier = `${routeKey}:${getClientIdentifier(request)}`;
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.expiresAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      expiresAt: now + WINDOW_MS,
    });

    return {
      limited: false,
      remaining: MAX_REQUESTS - 1,
    };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      limited: true,
      remaining: 0,
      retryAfter: Math.ceil((entry.expiresAt - now) / 1000),
    };
  }

  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    limited: false,
    remaining: MAX_REQUESTS - entry.count,
  };
}

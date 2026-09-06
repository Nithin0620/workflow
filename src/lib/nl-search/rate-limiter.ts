/**
 * Per-user rolling 60-second rate limiter for NL search.
 * In-memory; suitable for single-process Next.js deployment.
 * For multi-instance deployments, replace with a Redis-backed implementation.
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

const store = new Map<string, WindowEntry>();

/**
 * Checks whether the user is within the rate limit.
 * Increments the counter if allowed.
 */
export function checkRateLimit(
  userId: string,
  workspaceId: string
): { allowed: boolean } {
  const key = `${userId}:${workspaceId}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // Start a new window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}

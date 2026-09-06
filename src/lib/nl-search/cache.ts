import type { NLSearchResponse } from "./types";

/**
 * 60-second in-memory cache for NL search results.
 * Keyed by workspace ID + normalized query string.
 */

interface CacheEntry {
  response: NLSearchResponse;
  expiresAt: number;
}

const TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

function makeKey(workspaceId: string, query: string): string {
  return `${workspaceId}:${query.toLowerCase().trim()}`;
}

export function getCached(
  workspaceId: string,
  query: string
): NLSearchResponse | null {
  const key = makeKey(workspaceId, query);
  const entry = cache.get(key);

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.response;
}

export function setCached(
  workspaceId: string,
  query: string,
  response: NLSearchResponse
): void {
  const key = makeKey(workspaceId, query);
  cache.set(key, { response, expiresAt: Date.now() + TTL_MS });
}

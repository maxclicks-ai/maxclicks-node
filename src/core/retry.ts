const BACKOFF_BASE_MS = 500
const BACKOFF_CAP_MS = 8_000

/**
 * Parses a `Retry-After` header into milliseconds. Accepts both a delay in
 * seconds and an HTTP date. Returns `null` when absent or unparseable.
 */
export function parseRetryAfterMs(headerValue: string | null | undefined, nowMs: number): number | null {
  if (!headerValue) return null
  const trimmed = headerValue.trim()
  const asSeconds = Number(trimmed)
  if (Number.isFinite(asSeconds)) return Math.max(0, asSeconds * 1000)
  const asDate = Date.parse(trimmed)
  if (Number.isFinite(asDate)) return Math.max(0, asDate - nowMs)
  return null
}

/**
 * Full-jitter exponential backoff for retry attempt `attempt` (0-based), in
 * milliseconds. `random` is injectable for deterministic tests.
 */
export function backoffDelayMs(attempt: number, random: () => number): number {
  const exponential = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt)
  return Math.floor(exponential * random())
}

/** Whether an HTTP status should be retried (rate limit and server errors). */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

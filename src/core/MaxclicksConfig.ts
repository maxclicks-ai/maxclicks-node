import { MaxclicksConfigurationError } from '../errors'

/** A `fetch`-compatible function. Matches the global `fetch` signature. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** Context passed to the `onWarning` callback. */
export interface WarningContext {
  method: string
  path: string
}

/** Options accepted by the `Maxclicks` constructor. */
export interface MaxclicksOptions {
  /** Bearer API key. Falls back to the `MAXCLICKS_API_KEY` environment variable. */
  apiKey?: string
  /** API base URL. Defaults to the live public API. */
  baseUrl?: string
  /** Per-request timeout in milliseconds. Defaults to 60000. */
  timeoutMs?: number
  /** Number of additional retry attempts on retryable failures. Defaults to 2. */
  maxRetries?: number
  /** A custom `fetch` implementation (for testing or non-standard runtimes). */
  fetch?: FetchLike
  /** Extra headers merged into every request. */
  defaultHeaders?: Record<string, string>
  /** Invoked with any warnings the API returns for a call. */
  onWarning?: (warnings: string[], context: WarningContext) => void
}

/** Fully resolved, validated configuration used by the HTTP client. */
export interface ResolvedConfig {
  apiKey: string | null
  baseUrl: string
  timeoutMs: number
  maxRetries: number
  fetch: FetchLike
  defaultHeaders: Record<string, string>
  onWarning: ((warnings: string[], context: WarningContext) => void) | null
}

export const DEFAULT_BASE_URL = 'https://api.maxclicks.ai/v1'
export const DEFAULT_TIMEOUT_MS = 60_000
export const DEFAULT_MAX_RETRIES = 2

function readEnvApiKey(): string | null {
  if (typeof process !== 'undefined' && process.env && typeof process.env.MAXCLICKS_API_KEY === 'string')
    return process.env.MAXCLICKS_API_KEY
  return null
}

function resolveFetch(provided?: FetchLike): FetchLike {
  if (provided) return provided
  if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis) as FetchLike
  throw new MaxclicksConfigurationError(
    'No global fetch is available. Pass a `fetch` implementation in the client options, or run on Node 18+.',
    { code: 'no_fetch' }
  )
}

/** Normalizes a string API key or an options object into a resolved config. */
export function resolveConfig(optionsOrApiKey: string | MaxclicksOptions = {}): ResolvedConfig {
  const options = typeof optionsOrApiKey === 'string' ? { apiKey: optionsOrApiKey } : optionsOrApiKey
  const apiKey = options.apiKey ?? readEnvApiKey()
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
  return {
    apiKey: apiKey ?? null,
    baseUrl,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
    fetch: resolveFetch(options.fetch),
    defaultHeaders: options.defaultHeaders ?? {},
    onWarning: options.onWarning ?? null,
  }
}

import {
  MaxclicksConfigurationError,
  MaxclicksConnectionError,
  MaxclicksRateLimitError,
  MaxclicksTimeoutError,
} from '../errors'
import { getErrorMessage, prependMessage } from '../helpers/error-warning'
import type { Pagination, RedirectResult } from '../types'
import { VERSION } from '../version'
import type { ResolvedConfig } from './MaxclicksConfig'
import { errorFromResponse } from './parseError'
import { backoffDelayMs, isRetryableStatus } from './retry'

export type QueryValue = string | number | boolean | null | undefined | ReadonlyArray<string | number>

export interface RequestArgs {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Path under the base URL, beginning with `/`. Callers must encode path segments. */
  path: string
  query?: Record<string, QueryValue>
  /** JSON request body. Serialized as `application/json`. */
  body?: unknown
  /** Form body. Serialized as `application/x-www-form-urlencoded`. */
  formBody?: Record<string, string>
  /** When `false`, no `Authorization` header is sent (public endpoints). Defaults to `true`. */
  auth?: boolean
  /** Non-2xx statuses to treat as success (for example `422` on a batch abort). */
  acceptStatuses?: readonly number[]
}

/** Test seams: deterministic time, jitter, and sleep. Not part of the public API. */
export interface HttpClientInternals {
  sleep?: (milliseconds: number) => Promise<void>
  random?: () => number
  now?: () => number
}

interface ParsedResponse {
  status: number
  headers: Record<string, string>
  body: unknown
  url: string
}

const defaultSleep = (milliseconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds))

function decodeWarningHeader(value: string | undefined): string[] | null {
  if (!value) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  } catch {
    decoded = value
  }
  const lines = decoded.split('\n').filter(line => line.length > 0)
  return lines.length > 0 ? lines : null
}

export class HttpClient {
  private readonly sleep: (milliseconds: number) => Promise<void>
  private readonly random: () => number
  private readonly now: () => number

  constructor(
    private readonly config: ResolvedConfig,
    internals: HttpClientInternals = {}
  ) {
    this.sleep = internals.sleep ?? defaultSleep
    this.random = internals.random ?? Math.random
    this.now = internals.now ?? Date.now
  }

  /** Sends a request expecting the `{ data }` envelope and returns the unwrapped payload. */
  async request<T>(args: RequestArgs): Promise<T> {
    const parsed = await this.send(args)
    this.collectWarnings(parsed, args)
    return this.unwrapData<T>(parsed.body)
  }

  /** Sends a request expecting the `{ data, pagination }` envelope. */
  async requestPage<T>(args: RequestArgs): Promise<{ data: T[]; pagination: Pagination; warnings: string[] | null }> {
    const parsed = await this.send(args)
    const warnings = this.collectWarnings(parsed, args)
    const body = (parsed.body ?? {}) as { data?: unknown; pagination?: Pagination }
    const data = Array.isArray(body.data) ? (body.data as T[]) : []
    const pagination = body.pagination ?? { limit: 0, offset: 0, totalCount: data.length, hasMore: false }
    return { data, pagination, warnings }
  }

  /** Sends a request whose successful body is ignored (empty-body endpoints). */
  async requestVoid(args: RequestArgs): Promise<void> {
    const parsed = await this.send(args)
    this.collectWarnings(parsed, args)
  }

  /** Sends a request that ends at a redirect, returning the final landing URL. */
  async requestRedirect(args: RequestArgs): Promise<RedirectResult> {
    const parsed = await this.send(args)
    this.collectWarnings(parsed, args)
    return { status: parsed.status, redirectUrl: parsed.url || null }
  }

  private unwrapData<T>(body: unknown): T {
    if (body && typeof body === 'object' && 'data' in body) return (body as { data: T }).data
    return body as T
  }

  private collectWarnings(parsed: ParsedResponse, args: RequestArgs): string[] | null {
    let warnings: string[] | null = null
    const body = parsed.body
    if (body && typeof body === 'object' && Array.isArray((body as { warnings?: unknown }).warnings)) {
      const strings = (body as { warnings: unknown[] }).warnings.filter(
        (item): item is string => typeof item === 'string'
      )
      if (strings.length > 0) warnings = strings
    }
    if (!warnings) warnings = decodeWarningHeader(parsed.headers['maxclicks-warning-message'])
    if (warnings && this.config.onWarning) this.config.onWarning(warnings, { method: args.method, path: args.path })
    return warnings
  }

  private buildUrl(path: string, query: RequestArgs['query']): string {
    const url = `${this.config.baseUrl}${path}`
    if (!query) return url
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, String(item))
      } else {
        params.append(key, String(value))
      }
    }
    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  private buildHeaders(args: RequestArgs): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': `maxclicks-node/${VERSION}`,
      'X-Maxclicks-Client': `maxclicks-node/${VERSION}`,
      ...this.config.defaultHeaders,
    }
    if (args.auth !== false) {
      if (!this.config.apiKey)
        throw new MaxclicksConfigurationError(
          'No API key configured. Pass `apiKey` to the Maxclicks client or set the MAXCLICKS_API_KEY environment variable.',
          { code: 'no_api_key' }
        )
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }
    if (args.formBody) headers['Content-Type'] = 'application/x-www-form-urlencoded'
    else if (args.body !== undefined) headers['Content-Type'] = 'application/json'
    return headers
  }

  private buildPayload(args: RequestArgs): string | undefined {
    if (args.formBody) return new URLSearchParams(args.formBody).toString()
    if (args.body !== undefined) return JSON.stringify(args.body)
    return undefined
  }

  private async send(args: RequestArgs): Promise<ParsedResponse> {
    const url = this.buildUrl(args.path, args.query)
    const headers = this.buildHeaders(args)
    const payload = this.buildPayload(args)
    const acceptStatuses = args.acceptStatuses ?? []

    let attempt = 0
    for (;;) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)

      let parsed: ParsedResponse
      try {
        const response = await this.config.fetch(url, {
          method: args.method,
          headers,
          body: payload,
          redirect: 'follow',
          signal: controller.signal,
        })
        parsed = await this.parseResponse(response)
      } catch (error) {
        clearTimeout(timer)
        const transportError = this.classifyTransportError(error)
        if (attempt < this.config.maxRetries) {
          await this.sleep(backoffDelayMs(attempt, this.random))
          attempt += 1
          continue
        }
        throw transportError
      }
      clearTimeout(timer)

      const isOk = (parsed.status >= 200 && parsed.status < 300) || acceptStatuses.includes(parsed.status)
      if (isOk) return parsed

      const apiError = errorFromResponse({
        status: parsed.status,
        body: parsed.body,
        headers: parsed.headers,
        nowMs: this.now(),
      })
      if (isRetryableStatus(parsed.status) && attempt < this.config.maxRetries) {
        const retryAfterMs = apiError instanceof MaxclicksRateLimitError ? apiError.retryAfterMs : null
        await this.sleep(retryAfterMs ?? backoffDelayMs(attempt, this.random))
        attempt += 1
        continue
      }
      throw apiError
    }
  }

  private async parseResponse(response: Response): Promise<ParsedResponse> {
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
    const text = await response.text()
    return { status: response.status, headers, body: this.parseBody(text, headers['content-type']), url: response.url }
  }

  private parseBody(text: string, contentType: string | undefined): unknown {
    if (text.length === 0) return null
    if (contentType && contentType.includes('text/') && !contentType.includes('json')) return text
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  private classifyTransportError(error: unknown): MaxclicksConnectionError {
    const isAbort = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
    if (isAbort)
      return new MaxclicksTimeoutError(`Request timed out after ${this.config.timeoutMs}ms.`, {
        code: 'timeout',
        cause: error,
      })
    return new MaxclicksConnectionError(prependMessage('Connection error', getErrorMessage(error)), {
      code: 'connection_error',
      cause: error,
    })
  }
}

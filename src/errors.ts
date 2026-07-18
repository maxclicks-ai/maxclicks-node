/**
 * The Stripe-shaped error object returned by the maxclicks Public API v1 inside
 * the `{ error: ... }` envelope.
 */
export interface MaxclicksApiErrorBody {
  type: 'invalid_request_error' | 'api_error' | (string & {})
  code: string | null
  message: string
}

/** Fields shared by every error the SDK can throw. */
export interface MaxclicksErrorFields {
  /** HTTP status code, when the failure came from an HTTP response. */
  readonly status: number | null
  /** Stable machine-readable error code (for example `schema_not_found`), or `null`. */
  readonly code: string | null
  /** Coarse error category from the API (`invalid_request_error` / `api_error`), or `null`. */
  readonly type: string | null
  /** Response headers, when available. */
  readonly headers: Readonly<Record<string, string>> | null
  /** The raw parsed response body (or transport cause), for debugging. */
  readonly raw: unknown
}

interface MaxclicksErrorOptions extends Partial<MaxclicksErrorFields> {
  readonly cause?: unknown
}

/**
 * Base class for every error thrown by the SDK. Catch this to handle any SDK
 * failure; catch a subclass to handle a specific failure mode.
 */
export class MaxclicksError extends Error implements MaxclicksErrorFields {
  readonly status: number | null
  readonly code: string | null
  readonly type: string | null
  readonly headers: Readonly<Record<string, string>> | null
  readonly raw: unknown

  constructor(message: string, options: MaxclicksErrorOptions = {}) {
    super(message)
    this.name = new.target.name
    this.status = options.status ?? null
    this.code = options.code ?? null
    this.type = options.type ?? null
    this.headers = options.headers ?? null
    this.raw = options.raw ?? null
    if (options.cause !== undefined) (this as { cause?: unknown }).cause = options.cause
    // Keep `instanceof` working after down-leveling / bundling.
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Raised for programmer or configuration errors detected before any request is
 * sent (for example, calling an authenticated endpoint with no API key).
 */
export class MaxclicksConfigurationError extends MaxclicksError {}

/** Raised when the request never got a response (DNS, TCP, TLS, socket reset). */
export class MaxclicksConnectionError extends MaxclicksError {
  constructor(message: string, options: MaxclicksErrorOptions = {}) {
    super(message, { ...options, status: null })
  }
}

/** Raised when a request exceeds the configured timeout or is aborted. */
export class MaxclicksTimeoutError extends MaxclicksConnectionError {}

/** Base class for every error produced from an HTTP error response (status >= 400). */
export class MaxclicksApiError extends MaxclicksError {
  override readonly status: number

  constructor(message: string, options: MaxclicksErrorOptions & { status: number }) {
    super(message, options)
    this.status = options.status
  }
}

/** 400 Bad Request: the request was malformed or failed validation. */
export class MaxclicksBadRequestError extends MaxclicksApiError {}

/** 401 Unauthorized: the API key is missing or invalid. */
export class MaxclicksAuthenticationError extends MaxclicksApiError {}

/** 403 Forbidden: the key is valid but lacks permission (or the space is out of scope). */
export class MaxclicksPermissionError extends MaxclicksApiError {}

/** 404 Not Found: the referenced resource does not exist in the caller's space. */
export class MaxclicksNotFoundError extends MaxclicksApiError {}

/** 409 Conflict: the write conflicts with an existing resource (for example an identifier clash). */
export class MaxclicksConflictError extends MaxclicksApiError {}

/** 422 Unprocessable Entity: a batch aborted on the first invalid item. */
export class MaxclicksUnprocessableEntityError extends MaxclicksApiError {}

/** 429 Too Many Requests: the per-key rate limit was exceeded. */
export class MaxclicksRateLimitError extends MaxclicksApiError {
  /** Milliseconds to wait before retrying, parsed from the `Retry-After` header, or `null`. */
  readonly retryAfterMs: number | null

  constructor(message: string, options: MaxclicksErrorOptions & { status: number; retryAfterMs?: number | null }) {
    super(message, options)
    this.retryAfterMs = options.retryAfterMs ?? null
  }
}

/** 5xx: the API failed to process a valid request. */
export class MaxclicksServerError extends MaxclicksApiError {}

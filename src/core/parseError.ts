import {
  MaxclicksApiError,
  type MaxclicksApiErrorBody,
  MaxclicksAuthenticationError,
  MaxclicksBadRequestError,
  MaxclicksConflictError,
  MaxclicksNotFoundError,
  MaxclicksPermissionError,
  MaxclicksRateLimitError,
  MaxclicksServerError,
  MaxclicksUnprocessableEntityError,
} from '../errors'
import { parseRetryAfterMs } from './retry'

const DEFAULT_MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Bad request.',
  401: 'Unauthorized.',
  403: 'Forbidden.',
  404: 'Not found.',
  409: 'Conflict.',
  422: 'Unprocessable entity.',
  429: 'Rate limit exceeded, please try again later.',
  500: 'Internal server error.',
}

function defaultMessageForStatus(status: number): string {
  if (DEFAULT_MESSAGE_BY_STATUS[status]) return DEFAULT_MESSAGE_BY_STATUS[status]
  if (status >= 500) return 'Internal server error.'
  return 'Request failed.'
}

/**
 * Extracts the Stripe-shaped `{ type, code, message }` from a response body. The
 * body is normally `{ error: {...} }` JSON; the `workflows.trigger` endpoint
 * returns a plain-text error, which is wrapped here into the same shape.
 */
function extractApiErrorBody(body: unknown): MaxclicksApiErrorBody | null {
  if (typeof body === 'string') {
    const message = body.trim()
    if (message.length === 0) return null
    return { type: 'invalid_request_error', code: null, message }
  }
  if (body && typeof body === 'object' && 'error' in body) {
    const error = (body as { error: unknown }).error
    if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
      const shaped = error as { type?: unknown; code?: unknown; message: string }
      return {
        type: typeof shaped.type === 'string' ? shaped.type : 'api_error',
        code: typeof shaped.code === 'string' ? shaped.code : null,
        message: shaped.message,
      }
    }
  }
  return null
}

/** Builds the right `MaxclicksApiError` subclass from an HTTP error response. */
export function errorFromResponse(input: {
  status: number
  body: unknown
  headers: Record<string, string>
  nowMs: number
}): MaxclicksApiError {
  const { status, body, headers, nowMs } = input
  const apiError = extractApiErrorBody(body)
  const message = apiError?.message ?? defaultMessageForStatus(status)
  const shared = {
    status,
    code: apiError?.code ?? null,
    type: apiError?.type ?? null,
    headers,
    raw: body,
  }

  if (status === 400) return new MaxclicksBadRequestError(message, shared)
  if (status === 401) return new MaxclicksAuthenticationError(message, shared)
  if (status === 403) return new MaxclicksPermissionError(message, shared)
  if (status === 404) return new MaxclicksNotFoundError(message, shared)
  if (status === 409) return new MaxclicksConflictError(message, shared)
  if (status === 422) return new MaxclicksUnprocessableEntityError(message, shared)
  if (status === 429)
    return new MaxclicksRateLimitError(message, {
      ...shared,
      retryAfterMs: parseRetryAfterMs(headers['retry-after'], nowMs),
    })
  if (status >= 500) return new MaxclicksServerError(message, shared)
  return new MaxclicksApiError(message, shared)
}

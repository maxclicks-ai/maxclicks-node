import { Maxclicks } from '../src/index'
import type { MaxclicksOptions } from '../src/index'

export interface MockResponseSpec {
  status?: number
  json?: unknown
  text?: string
  headers?: Record<string, string>
  url?: string
}

export interface RecordedCall {
  url: string
  method: string
  headers: Record<string, string>
  body: string | undefined
}

export type Responder =
  | MockResponseSpec
  | MockResponseSpec[]
  | ((call: RecordedCall, index: number) => MockResponseSpec)

function toResponse(spec: MockResponseSpec): Response {
  const status = spec.status ?? 200
  const hasJson = spec.json !== undefined
  const bodyText = spec.text ?? (hasJson ? JSON.stringify(spec.json) : '')
  const headers = new Headers(spec.headers ?? (hasJson ? { 'content-type': 'application/json' } : {}))
  return {
    status,
    url: spec.url ?? '',
    redirected: false,
    headers,
    text: async () => bodyText,
  } as unknown as Response
}

export function makeFetch(responder: Responder) {
  const calls: RecordedCall[] = []
  let index = 0
  const fetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = {}
    const rawHeaders = init.headers as Record<string, string> | undefined
    if (rawHeaders) for (const [key, value] of Object.entries(rawHeaders)) headers[key.toLowerCase()] = value
    const call: RecordedCall = {
      url,
      method: (init.method ?? 'GET').toUpperCase(),
      headers,
      body: typeof init.body === 'string' ? init.body : undefined,
    }
    calls.push(call)
    const currentIndex = index++
    const spec =
      typeof responder === 'function'
        ? responder(call, currentIndex)
        : Array.isArray(responder)
          ? responder[Math.min(currentIndex, responder.length - 1)]
          : responder
    return toResponse(spec)
  }
  return { fetch, calls }
}

/** Builds a client with a mock transport and deterministic, instant retries. */
export function makeClient(responder: Responder, options: Partial<MaxclicksOptions> = {}) {
  const { fetch, calls } = makeFetch(responder)
  const sleeps: number[] = []
  const client = new Maxclicks(
    { apiKey: 'sk_test', fetch, ...options },
    {
      sleep: async milliseconds => {
        sleeps.push(milliseconds)
      },
      random: () => 0,
      now: () => 0,
    }
  )
  return { client, calls, sleeps }
}

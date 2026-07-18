import type { HttpClient } from '../core/HttpClient'
import type {
  BatchFireResult,
  CursorPagination,
  Event,
  EventBatchParams,
  EventInput,
  EventListParams,
  EventPage,
  FireResult,
} from '../types'

/** Fire trigger events and read them back. */
export class EventsResource {
  constructor(private readonly http: HttpClient) {}

  /** Fires a single event of the given event schema (async fire-and-forget). */
  fire(schema: string, input: EventInput): Promise<FireResult> {
    return this.http.request<FireResult>({
      method: 'POST',
      path: `/events/${encodeURIComponent(schema)}`,
      body: input,
    })
  }

  /** Fires up to 500 events of one schema. Returns per-item results and a summary. */
  fireBatch(schema: string, events: EventInput[], params: EventBatchParams = {}): Promise<BatchFireResult> {
    return this.http.request<BatchFireResult>({
      method: 'POST',
      path: `/events/${encodeURIComponent(schema)}/batch`,
      body: { events, onError: params.onError },
      acceptStatuses: [422],
    })
  }

  /** Reads an event schema's history, newest first. Cursor-paginated: follow `pagination.nextCursor`. */
  async list(params: EventListParams): Promise<EventPage> {
    const page = await this.http.requestPage<Event>({
      method: 'GET',
      path: '/events',
      query: {
        schema: params.schema,
        from: params.from,
        to: params.to,
        cursor: params.cursor,
        limit: params.limit,
      },
    })
    return {
      data: page.data,
      pagination: page.pagination as unknown as CursorPagination,
      warnings: page.warnings,
    }
  }

  /** Fetches one previously-fired event by its platform id. */
  get(id: string): Promise<Event> {
    return this.http.request<Event>({ method: 'GET', path: `/events/${encodeURIComponent(id)}` })
  }
}

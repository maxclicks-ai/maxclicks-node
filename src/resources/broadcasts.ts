import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  Broadcast,
  BroadcastMetrics,
  BroadcastRun,
  BroadcastSendParams,
  BroadcastUpdateParams,
  ListParams,
  RequestOptions,
} from '../types'

/** Schedule, send, and measure broadcasts. */
export class BroadcastsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's broadcasts, newest first. Paginated. */
  list(params: ListParams = {}): Promise<Page<Broadcast>> {
    const fetcher: PageFetcher<Broadcast> = ({ limit, offset }) =>
      this.http.requestPage<Broadcast>({ method: 'GET', path: '/broadcasts', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a broadcast by id. */
  get(id: string): Promise<Broadcast> {
    return this.http.request<Broadcast>({ method: 'GET', path: `/broadcasts/${encodeURIComponent(id)}` })
  }

  /** Partially updates a broadcast. Rejected once sending has started. An explicit `null` clears a nullable field. */
  update(id: string, params: BroadcastUpdateParams): Promise<Broadcast> {
    return this.http.request<Broadcast>({
      method: 'PATCH',
      path: `/broadcasts/${encodeURIComponent(id)}`,
      body: params,
    })
  }

  /**
   * Sends a broadcast. Moves it to `send now`, or `send at` when `scheduledFor`
   * is given. Sending itself is asynchronous.
   *
   * Accepts `options.idempotencyKey`, the only way to make a retried send safe:
   * without a key a timed-out send is never repeated by the SDK, because the
   * broadcast may already have started going out.
   */
  send(id: string, params: BroadcastSendParams = {}, options: RequestOptions = {}): Promise<Broadcast> {
    return this.http.request<Broadcast>({
      method: 'POST',
      path: `/broadcasts/${encodeURIComponent(id)}/send`,
      body: params,
      idempotencyKey: options.idempotencyKey,
    })
  }

  /** Lists a broadcast's runs, one reduced record per recipient contact. Paginated. */
  listRuns(id: string, params: ListParams = {}): Promise<Page<BroadcastRun>> {
    const fetcher: PageFetcher<BroadcastRun> = ({ limit, offset }) =>
      this.http.requestPage<BroadcastRun>({
        method: 'GET',
        path: `/broadcasts/${encodeURIComponent(id)}/runs`,
        query: { limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a broadcast's aggregated email metrics. */
  getMetrics(id: string): Promise<BroadcastMetrics> {
    return this.http.request<BroadcastMetrics>({
      method: 'GET',
      path: `/broadcasts/${encodeURIComponent(id)}/metrics`,
    })
  }
}

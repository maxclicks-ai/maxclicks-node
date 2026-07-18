import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  Broadcast,
  BroadcastAudienceGenerateParams,
  BroadcastAudienceGenerateResult,
  BroadcastCreateParams,
  BroadcastMetrics,
  BroadcastRun,
  BroadcastSendParams,
  BroadcastUpdateParams,
  Deleted,
  ListParams,
} from '../types'

/** Create, schedule, send, and measure broadcasts. */
export class BroadcastsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's broadcasts, newest first. Paginated. */
  list(params: ListParams = {}): Promise<Page<Broadcast>> {
    const fetcher: PageFetcher<Broadcast> = ({ limit, offset }) =>
      this.http.requestPage<Broadcast>({ method: 'GET', path: '/broadcasts', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Creates a broadcast with an audience and optional inline raw email content. */
  create(params: BroadcastCreateParams): Promise<Broadcast> {
    return this.http.request<Broadcast>({ method: 'POST', path: '/broadcasts', body: params })
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

  /** Permanently deletes a broadcast, cascading its runs. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/broadcasts/${encodeURIComponent(id)}` })
  }

  /**
   * Sends a broadcast. Moves it to `send now`, or `send at` when `scheduledFor`
   * is given. Sending itself is asynchronous.
   */
  send(id: string, params: BroadcastSendParams = {}): Promise<Broadcast> {
    return this.http.request<Broadcast>({
      method: 'POST',
      path: `/broadcasts/${encodeURIComponent(id)}/send`,
      body: params,
    })
  }

  /**
   * Generates and persists a `custom filter` audience from a natural-language
   * `requirements` prompt. Rejected once sending has started.
   */
  generateAudience(id: string, params: BroadcastAudienceGenerateParams): Promise<BroadcastAudienceGenerateResult> {
    return this.http.request<BroadcastAudienceGenerateResult>({
      method: 'POST',
      path: `/broadcasts/${encodeURIComponent(id)}/audience/generate`,
      body: params,
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

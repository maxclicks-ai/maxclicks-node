import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Deleted, ListParams, Sender, SenderCreateParams, SenderUpdateParams } from '../types'

/** Manage saved sender profiles. */
export class SendersResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's saved sender profiles. Paginated. */
  list(params: ListParams = {}): Promise<Page<Sender>> {
    const fetcher: PageFetcher<Sender> = ({ limit, offset }) =>
      this.http.requestPage<Sender>({ method: 'GET', path: '/senders', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Creates a saved sender profile on a verified domain. */
  create(params: SenderCreateParams): Promise<Sender> {
    return this.http.request<Sender>({ method: 'POST', path: '/senders', body: params })
  }

  /** Fetches a sender profile by id. */
  get(id: string): Promise<Sender> {
    return this.http.request<Sender>({ method: 'GET', path: `/senders/${encodeURIComponent(id)}` })
  }

  /** Updates a sender profile's name, description, code, and/or domain. */
  update(id: string, params: SenderUpdateParams): Promise<Sender> {
    return this.http.request<Sender>({ method: 'PATCH', path: `/senders/${encodeURIComponent(id)}`, body: params })
  }

  /** Permanently deletes a sender profile. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/senders/${encodeURIComponent(id)}` })
  }
}

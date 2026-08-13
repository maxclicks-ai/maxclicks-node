import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { ListParams, Sender } from '../types'

/** Read the space's saved sender profiles. */
export class SendersResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's saved sender profiles. Paginated. */
  list(params: ListParams = {}): Promise<Page<Sender>> {
    const fetcher: PageFetcher<Sender> = ({ limit, offset }) =>
      this.http.requestPage<Sender>({ method: 'GET', path: '/senders', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }
}

import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Domain, ListParams } from '../types'

/** Read the space's sending domains and their DNS verification state. */
export class DomainsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's sending domains, newest first. Paginated; items omit DNS `records`. */
  list(params: ListParams = {}): Promise<Page<Domain>> {
    const fetcher: PageFetcher<Domain> = ({ limit, offset }) =>
      this.http.requestPage<Domain>({ method: 'GET', path: '/domains', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a domain by id, including live-checked DNS `records`. */
  get(id: string): Promise<Domain> {
    return this.http.request<Domain>({ method: 'GET', path: `/domains/${encodeURIComponent(id)}` })
  }
}

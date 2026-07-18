import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Deleted, Domain, DomainCreateParams, ListParams } from '../types'

/** Manage sending domains and their DNS verification. */
export class DomainsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's sending domains, newest first. Paginated; items omit DNS `records`. */
  list(params: ListParams = {}): Promise<Page<Domain>> {
    const fetcher: PageFetcher<Domain> = ({ limit, offset }) =>
      this.http.requestPage<Domain>({ method: 'GET', path: '/domains', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Adds a sending domain and provisions its DNS records. Requires an admin key. */
  create(params: DomainCreateParams): Promise<Domain> {
    return this.http.request<Domain>({ method: 'POST', path: '/domains', body: params })
  }

  /** Fetches a domain by id, including live-checked DNS `records`. */
  get(id: string): Promise<Domain> {
    return this.http.request<Domain>({ method: 'GET', path: `/domains/${encodeURIComponent(id)}` })
  }

  /** Permanently deletes a domain. Requires an admin key. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/domains/${encodeURIComponent(id)}` })
  }

  /** Live-checks DNS and refreshes the domain's verification state, returning the updated domain. */
  verify(id: string): Promise<Domain> {
    return this.http.request<Domain>({ method: 'POST', path: `/domains/${encodeURIComponent(id)}/verify` })
  }
}

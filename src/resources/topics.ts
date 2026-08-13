import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { ListParams, Topic } from '../types'

/** Read the space's communication topics. */
export class TopicsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's communication topics. Paginated. */
  list(params: ListParams = {}): Promise<Page<Topic>> {
    const fetcher: PageFetcher<Topic> = ({ limit, offset }) =>
      this.http.requestPage<Topic>({ method: 'GET', path: '/topics', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a topic by id. */
  get(id: string): Promise<Topic> {
    return this.http.request<Topic>({ method: 'GET', path: `/topics/${encodeURIComponent(id)}` })
  }
}

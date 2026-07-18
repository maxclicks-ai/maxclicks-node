import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Deleted, ListParams, Topic, TopicCreateParams, TopicDeleteParams, TopicUpdateParams } from '../types'

/** Manage communication topics. */
export class TopicsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's communication topics. Paginated. */
  list(params: ListParams = {}): Promise<Page<Topic>> {
    const fetcher: PageFetcher<Topic> = ({ limit, offset }) =>
      this.http.requestPage<Topic>({ method: 'GET', path: '/topics', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Creates a communication topic. `channel` defaults to `email`. */
  create(params: TopicCreateParams): Promise<Topic> {
    return this.http.request<Topic>({ method: 'POST', path: '/topics', body: params })
  }

  /** Fetches a topic by id. */
  get(id: string): Promise<Topic> {
    return this.http.request<Topic>({ method: 'GET', path: `/topics/${encodeURIComponent(id)}` })
  }

  /** Partially updates a topic's name, description, color, and/or privacy. `channel` is immutable. */
  update(id: string, params: TopicUpdateParams): Promise<Topic> {
    return this.http.request<Topic>({ method: 'PATCH', path: `/topics/${encodeURIComponent(id)}`, body: params })
  }

  /** Deletes a topic. Pass `force` to bypass the in-use check. */
  delete(id: string, params: TopicDeleteParams = {}): Promise<Deleted> {
    return this.http.request<Deleted>({
      method: 'DELETE',
      path: `/topics/${encodeURIComponent(id)}`,
      query: { force: params.force },
    })
  }
}

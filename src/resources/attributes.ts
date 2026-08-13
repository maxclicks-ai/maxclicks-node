import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Attribute, ListParams } from '../types'

/** Read a schema's attributes. */
export class AttributesResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists a schema's attributes: base attributes first, then custom. Paginated. */
  list(schema: string, params: ListParams = {}): Promise<Page<Attribute>> {
    const fetcher: PageFetcher<Attribute> = ({ limit, offset }) =>
      this.http.requestPage<Attribute>({
        method: 'GET',
        path: `/schemas/${encodeURIComponent(schema)}/attributes`,
        query: { limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }
}

import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Attribute, AttributeCreateParams, ListParams } from '../types'

/** Read a schema's attributes and add custom stored or AI-generated evaluated attributes. */
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

  /** Fetches one attribute by `base:<key>`, a custom attribute id, or a raw key. */
  get(schema: string, attribute: string): Promise<Attribute> {
    return this.http.request<Attribute>({
      method: 'GET',
      path: `/schemas/${encodeURIComponent(schema)}/attributes/${encodeURIComponent(attribute)}`,
    })
  }

  /** Adds a custom attribute: pass `definition` for a stored one, or `requirements` for an AI-generated evaluated one (billed). */
  create(schema: string, params: AttributeCreateParams): Promise<Attribute> {
    return this.http.request<Attribute>({
      method: 'POST',
      path: `/schemas/${encodeURIComponent(schema)}/attributes`,
      body: params,
    })
  }
}

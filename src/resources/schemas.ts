import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Schema, SchemaListParams } from '../types'

/** Read the space's schemas. */
export class SchemasResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's schemas, optionally filtered by type. Paginated. */
  list(params: SchemaListParams = {}): Promise<Page<Schema>> {
    const fetcher: PageFetcher<Schema> = ({ limit, offset }) =>
      this.http.requestPage<Schema>({
        method: 'GET',
        path: '/schemas',
        query: { type: params.type, limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a single schema by id or slug. */
  get(schema: string): Promise<Schema> {
    return this.http.request<Schema>({ method: 'GET', path: `/schemas/${encodeURIComponent(schema)}` })
  }
}

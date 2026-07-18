import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Deleted, Schema, SchemaCreateParams, SchemaListParams, SchemaUpdateParams } from '../types'

/** Create, read, update, and delete the space's schemas. */
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

  /** Creates a contact, object, or event schema. */
  create(params: SchemaCreateParams): Promise<Schema> {
    return this.http.request<Schema>({ method: 'POST', path: '/schemas', body: params })
  }

  /** Updates a schema's name, namePlural, and/or description (type and slug are immutable). */
  update(schema: string, params: SchemaUpdateParams): Promise<Schema> {
    return this.http.request<Schema>({
      method: 'PATCH',
      path: `/schemas/${encodeURIComponent(schema)}`,
      body: params,
    })
  }

  /** Deletes a schema by id or slug and cascades its records. */
  delete(schema: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/schemas/${encodeURIComponent(schema)}` })
  }
}

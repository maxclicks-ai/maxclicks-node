import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Import, ImportCreateParams, ListParams } from '../types'

/** Start and track bulk CSV imports of contact and object records. */
export class ImportsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists a schema's imports, newest first. Paginated. */
  list(schema: string, params: ListParams = {}): Promise<Page<Import>> {
    const fetcher: PageFetcher<Import> = ({ limit, offset }) =>
      this.http.requestPage<Import>({
        method: 'GET',
        path: `/schemas/${encodeURIComponent(schema)}/imports`,
        query: { limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }

  /** Starts an asynchronous import from an already-uploaded CSV file. Contact and object schemas only. */
  create(schema: string, params: ImportCreateParams): Promise<Import> {
    return this.http.request<Import>({
      method: 'POST',
      path: `/schemas/${encodeURIComponent(schema)}/imports`,
      body: params,
    })
  }

  /** Fetches an import by id. */
  get(id: string): Promise<Import> {
    return this.http.request<Import>({ method: 'GET', path: `/imports/${encodeURIComponent(id)}` })
  }

  /** Downloads the import's failure-row CSV as raw text (streamed `text/csv`, not the `{data}` envelope). */
  downloadFailureLog(id: string): Promise<string> {
    return this.http.request<string>({
      method: 'GET',
      path: `/imports/${encodeURIComponent(id)}/failure-log`,
    })
  }

  /** Cancels a pending or running import and returns the canceled import. */
  cancel(id: string): Promise<Import> {
    return this.http.request<Import>({ method: 'POST', path: `/imports/${encodeURIComponent(id)}/cancel` })
  }
}

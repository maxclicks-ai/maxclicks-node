import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  Deleted,
  Suppression,
  SuppressionBatchCreateResult,
  SuppressionBatchDeleteResult,
  SuppressionInput,
  SuppressionListParams,
} from '../types'

/** Manage the space's email suppression (do-not-contact) list. Requires an admin key. */
export class SuppressionsResource {
  constructor(private readonly http: HttpClient) {}

  /** Suppresses an email identifier for the space. */
  create(input: SuppressionInput): Promise<Suppression> {
    return this.http.request<Suppression>({ method: 'POST', path: '/contacts/suppressions', body: input })
  }

  /** Lists the space's suppressions, newest first, optionally filtered to one email. Paginated. */
  list(params: SuppressionListParams = {}): Promise<Page<Suppression>> {
    const fetcher: PageFetcher<Suppression> = ({ limit, offset }) =>
      this.http.requestPage<Suppression>({
        method: 'GET',
        path: '/contacts/suppressions',
        query: { identifier: params.identifier, limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a suppression by id. */
  get(id: string): Promise<Suppression> {
    return this.http.request<Suppression>({
      method: 'GET',
      path: `/contacts/suppressions/${encodeURIComponent(id)}`,
    })
  }

  /** Removes a suppression by id, re-allowing communication to that identifier. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({
      method: 'DELETE',
      path: `/contacts/suppressions/${encodeURIComponent(id)}`,
    })
  }

  /** Bulk-creates 1 to 100 suppressions; each item is processed independently. */
  batchCreate(suppressions: SuppressionInput[]): Promise<SuppressionBatchCreateResult> {
    return this.http.request<SuppressionBatchCreateResult>({
      method: 'POST',
      path: '/contacts/suppressions/batch',
      body: { suppressions },
    })
  }

  /** Bulk-removes 1 to 100 suppressions by id; each id is gated like the single delete. */
  batchDelete(ids: string[]): Promise<SuppressionBatchDeleteResult> {
    return this.http.request<SuppressionBatchDeleteResult>({
      method: 'POST',
      path: '/contacts/suppressions/batch-remove',
      body: { ids },
    })
  }
}

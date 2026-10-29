import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  Deleted,
  RequestOptions,
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

  /** Removes a suppression by id, re-allowing communication to that identifier. */
  delete(id: string, options: RequestOptions = {}): Promise<Deleted> {
    return this.http.request<Deleted>({
      method: 'DELETE',
      path: `/contacts/suppressions/${encodeURIComponent(id)}`,
      idempotencyKey: options.idempotencyKey,
    })
  }

  /**
   * Bulk-creates 1 to 100 suppressions; each item is processed independently.
   * Accepts `options.idempotencyKey`.
   */
  batchCreate(suppressions: SuppressionInput[], options: RequestOptions = {}): Promise<SuppressionBatchCreateResult> {
    return this.http.request<SuppressionBatchCreateResult>({
      method: 'POST',
      path: '/contacts/suppressions/batch',
      body: { suppressions },
      idempotencyKey: options.idempotencyKey,
    })
  }

  /**
   * Bulk-removes 1 to 100 suppressions by id; each id is gated like the single delete.
   * Accepts `options.idempotencyKey`.
   */
  batchDelete(ids: string[], options: RequestOptions = {}): Promise<SuppressionBatchDeleteResult> {
    return this.http.request<SuppressionBatchDeleteResult>({
      method: 'POST',
      path: '/contacts/suppressions/batch-remove',
      body: { ids },
      idempotencyKey: options.idempotencyKey,
    })
  }
}

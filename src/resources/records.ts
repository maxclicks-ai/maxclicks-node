import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  AuditTrailEntry,
  AuditTrailListParams,
  MaxclicksRecord,
  RecordDeletionStatus,
  RecordInput,
  RequestOptions,
} from '../types'

/** Create, read, update, and delete contact and object records within a schema. */
export class RecordsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Strictly creates a record (never updates an existing one). Any input `id` is ignored.
   * Accepts `options.idempotencyKey` so a retried create cannot duplicate the record.
   */
  create(schema: string, input: RecordInput, options: RequestOptions = {}): Promise<MaxclicksRecord> {
    return this.http.request<MaxclicksRecord>({
      method: 'POST',
      path: `/schemas/${encodeURIComponent(schema)}/records`,
      body: input,
      idempotencyKey: options.idempotencyKey,
    })
  }

  /**
   * Creates or updates a record by identity (contact: id/userId/email/phone; object: id/externalId).
   * Accepts `options.idempotencyKey`.
   */
  upsert(schema: string, input: RecordInput, options: RequestOptions = {}): Promise<MaxclicksRecord> {
    return this.http.request<MaxclicksRecord>({
      method: 'POST',
      path: `/schemas/${encodeURIComponent(schema)}/records/upsert`,
      body: input,
      idempotencyKey: options.idempotencyKey,
    })
  }

  /** Lists records in a schema, oldest first. Paginated. */
  list(schema: string, params: { limit?: number; offset?: number } = {}): Promise<Page<MaxclicksRecord>> {
    const fetcher: PageFetcher<MaxclicksRecord> = ({ limit, offset }) =>
      this.http.requestPage<MaxclicksRecord>({
        method: 'GET',
        path: `/schemas/${encodeURIComponent(schema)}/records`,
        query: { limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches one record by its platform id. */
  get(schema: string, id: string): Promise<MaxclicksRecord> {
    return this.http.request<MaxclicksRecord>({
      method: 'GET',
      path: `/schemas/${encodeURIComponent(schema)}/records/${encodeURIComponent(id)}`,
    })
  }

  /** Partially updates a record. An explicit `null` clears a nullable field. */
  update(schema: string, id: string, input: RecordInput): Promise<MaxclicksRecord> {
    return this.http.request<MaxclicksRecord>({
      method: 'PATCH',
      path: `/schemas/${encodeURIComponent(schema)}/records/${encodeURIComponent(id)}`,
      body: input,
    })
  }

  /**
   * Requests deletion of a record. Deletion runs in the background: the result is `completed` at once only when
   * nothing remains to drain, so follow a `pending` result with `getDeletion`. The API requires an idempotency
   * key identifying this attempt; one is generated when none is given. Pass your own to retry the same attempt.
   */
  delete(schema: string, id: string, options: RequestOptions = {}): Promise<RecordDeletionStatus> {
    return this.http.request<RecordDeletionStatus>({
      method: 'DELETE',
      path: `/schemas/${encodeURIComponent(schema)}/records/${encodeURIComponent(id)}`,
      idempotencyKey: options.idempotencyKey || globalThis.crypto.randomUUID(),
    })
  }

  /** Reads the progress of a record deletion by the `operationId` that `delete` returned. */
  getDeletion(operationId: string): Promise<RecordDeletionStatus> {
    return this.http.request<RecordDeletionStatus>({
      method: 'GET',
      path: `/record-deletions/${encodeURIComponent(operationId)}`,
    })
  }

  /** Cancels a record deletion before removal begins. Removed data cannot be restored. */
  cancelDeletion(operationId: string): Promise<RecordDeletionStatus> {
    return this.http.request<RecordDeletionStatus>({
      method: 'POST',
      path: `/record-deletions/${encodeURIComponent(operationId)}/cancel`,
    })
  }

  /** Lists a contact's consent audit trail, newest first. Paginated. */
  auditTrail(schema: string, id: string, params: AuditTrailListParams = {}): Promise<Page<AuditTrailEntry>> {
    const fetcher: PageFetcher<AuditTrailEntry> = ({ limit, offset }) =>
      this.http.requestPage<AuditTrailEntry>({
        method: 'GET',
        path: `/schemas/${encodeURIComponent(schema)}/records/${encodeURIComponent(id)}/audit-trail`,
        query: { channel: params.channel, limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }
}

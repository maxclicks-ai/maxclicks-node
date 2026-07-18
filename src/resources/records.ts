import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { AuditTrailEntry, AuditTrailListParams, Deleted, MaxclicksRecord, RecordInput } from '../types'

/** Create, read, update, and delete contact and object records within a schema. */
export class RecordsResource {
  constructor(private readonly http: HttpClient) {}

  /** Strictly creates a record (never updates an existing one). Any input `id` is ignored. */
  create(schema: string, input: RecordInput): Promise<MaxclicksRecord> {
    return this.http.request<MaxclicksRecord>({
      method: 'POST',
      path: `/schemas/${encodeURIComponent(schema)}/records`,
      body: input,
    })
  }

  /** Creates or updates a record by identity (contact: id/userId/email/phone; object: id/externalId). */
  upsert(schema: string, input: RecordInput): Promise<MaxclicksRecord> {
    return this.http.request<MaxclicksRecord>({
      method: 'POST',
      path: `/schemas/${encodeURIComponent(schema)}/records/upsert`,
      body: input,
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

  /** Deletes a record by its platform id. */
  delete(schema: string, id: string): Promise<Deleted> {
    return this.http.request<Deleted>({
      method: 'DELETE',
      path: `/schemas/${encodeURIComponent(schema)}/records/${encodeURIComponent(id)}`,
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

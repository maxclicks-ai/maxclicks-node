import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  ContactRecord,
  Deleted,
  ListParams,
  Segment,
  SegmentCount,
  SegmentCreateParams,
  SegmentUpdateParams,
} from '../types'

/** Generate and manage AI-defined contact filters (segments). */
export class SegmentsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's segments, newest first. Paginated. */
  list(params: ListParams = {}): Promise<Page<Segment>> {
    const fetcher: PageFetcher<Segment> = ({ limit, offset }) =>
      this.http.requestPage<Segment>({ method: 'GET', path: '/segments', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Generates a segment from a natural-language `requirements` prompt (slow, billed). The generated expression is never returned. */
  create(params: SegmentCreateParams): Promise<Segment> {
    return this.http.request<Segment>({ method: 'POST', path: '/segments', body: params })
  }

  /** Fetches a segment by id. */
  get(id: string): Promise<Segment> {
    return this.http.request<Segment>({ method: 'GET', path: `/segments/${encodeURIComponent(id)}` })
  }

  /** Updates a segment's name/description, or regenerates the condition when `requirements` is supplied (slow, billed). */
  update(id: string, params: SegmentUpdateParams): Promise<Segment> {
    return this.http.request<Segment>({ method: 'PATCH', path: `/segments/${encodeURIComponent(id)}`, body: params })
  }

  /** Permanently deletes a segment. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/segments/${encodeURIComponent(id)}` })
  }

  /** Returns the segment's live matching contact count and the schema's total contact count. */
  count(id: string): Promise<SegmentCount> {
    return this.http.request<SegmentCount>({ method: 'GET', path: `/segments/${encodeURIComponent(id)}/count` })
  }

  /** Lists the contacts currently matching the segment. Paginated (limit hard-capped at 100 server-side). */
  listContacts(id: string, params: ListParams = {}): Promise<Page<ContactRecord>> {
    const fetcher: PageFetcher<ContactRecord> = ({ limit, offset }) =>
      this.http.requestPage<ContactRecord>({
        method: 'GET',
        path: `/segments/${encodeURIComponent(id)}/contacts`,
        query: { limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }
}

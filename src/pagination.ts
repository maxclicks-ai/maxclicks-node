import { MaxclicksError } from './errors'
import type { Pagination } from './types'

/** The maximum offset the API accepts; auto-pagination stops before exceeding it. */
const MAX_OFFSET = 10_000

interface RawPage<T> {
  data: T[]
  pagination: Pagination
  warnings: string[] | null
}

/** Fetches one page given pagination parameters. */
export type PageFetcher<T> = (params: { limit: number; offset: number }) => Promise<RawPage<T>>

/**
 * A single page of results that also streams every item across all pages.
 *
 * ```ts
 * const page = await mc.records.list('students')
 * page.data           // this page's items
 * page.pagination     // { limit, offset, totalCount, hasMore }
 * for await (const record of page) { ... }   // every item, auto-fetching pages
 * const everything = await page.all()        // every item as an array
 * ```
 */
export class Page<T> implements AsyncIterable<T> {
  /** The items on this page. */
  readonly data: T[]
  /** Pagination metadata for this page. */
  readonly pagination: Pagination
  /** Warnings the API returned for this page, if any. */
  readonly warnings: string[] | null

  constructor(
    raw: RawPage<T>,
    private readonly fetcher: PageFetcher<T>
  ) {
    this.data = raw.data
    this.pagination = raw.pagination
    this.warnings = raw.warnings
  }

  /** Whether another page exists after this one. */
  hasNextPage(): boolean {
    if (!this.pagination.hasMore || this.data.length === 0) return false
    return this.pagination.offset + this.data.length <= MAX_OFFSET
  }

  /** Fetches the next page. Throws if there is none (guard with `hasNextPage`). */
  async getNextPage(): Promise<Page<T>> {
    if (!this.hasNextPage()) throw new MaxclicksError('There is no next page.', { code: 'no_next_page' })
    const nextOffset = this.pagination.offset + this.data.length
    const raw = await this.fetcher({ limit: this.pagination.limit, offset: nextOffset })
    return new Page(raw, this.fetcher)
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    for (const item of this.data) yield item
    if (!this.hasNextPage()) return
    let page = await this.getNextPage()
    for (;;) {
      for (const item of page.data) yield item
      if (!page.hasNextPage()) return
      page = await page.getNextPage()
    }
  }

  /** Collects every item across every page into a single array. */
  async all(): Promise<T[]> {
    const items: T[] = []
    for await (const item of this) items.push(item)
    return items
  }
}

/** Builds the first `Page` from a fetcher, applying the caller's `limit`/`offset`. */
export async function fetchFirstPage<T>(
  fetcher: PageFetcher<T>,
  params: { limit?: number; offset?: number } = {}
): Promise<Page<T>> {
  const raw = await fetcher({ limit: params.limit ?? 50, offset: params.offset ?? 0 })
  return new Page(raw, fetcher)
}

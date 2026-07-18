import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { ApiKey, ApiKeyCreateParams, ApiKeyWithSecret, Deleted, ListParams } from '../types'

/** Manage the space's API keys. All operations require an admin key. */
export class ApiKeysResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's API keys, newest first. Paginated. Only masked previews (`keyDisplay`) are returned. */
  list(params: ListParams = {}): Promise<Page<ApiKey>> {
    const fetcher: PageFetcher<ApiKey> = ({ limit, offset }) =>
      this.http.requestPage<ApiKey>({ method: 'GET', path: '/api-keys', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Creates an API key. The plaintext `key` is returned exactly once here and never again, so save it immediately. */
  create(params: ApiKeyCreateParams = {}): Promise<ApiKeyWithSecret> {
    return this.http.request<ApiKeyWithSecret>({ method: 'POST', path: '/api-keys', body: params })
  }

  /** Permanently deletes an API key by id. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/api-keys/${encodeURIComponent(id)}` })
  }
}

import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  Deleted,
  ListParams,
  RequestOptions,
  RotatedWebhookSecret,
  Webhook,
  WebhookCreateParams,
  WebhookUpdateParams,
  WebhookWithSecret,
} from '../types'

/** Manage outgoing webhooks. */
export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /** Creates a webhook. The response includes the signing secret, shown only here and on rotate. */
  create(params: WebhookCreateParams, options: RequestOptions = {}): Promise<WebhookWithSecret> {
    return this.http.request<WebhookWithSecret>({
      method: 'POST',
      path: '/webhooks',
      body: params,
      idempotencyKey: options.idempotencyKey,
    })
  }

  /** Lists the space's webhooks, newest first. Paginated. */
  list(params: ListParams = {}): Promise<Page<Webhook>> {
    const fetcher: PageFetcher<Webhook> = ({ limit, offset }) =>
      this.http.requestPage<Webhook>({ method: 'GET', path: '/webhooks', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a webhook by id. */
  get(id: string): Promise<Webhook> {
    return this.http.request<Webhook>({ method: 'GET', path: `/webhooks/${encodeURIComponent(id)}` })
  }

  /** Updates a webhook's url, email event types, condition, and/or status. */
  update(id: string, params: WebhookUpdateParams, options: RequestOptions = {}): Promise<Webhook> {
    return this.http.request<Webhook>({
      method: 'PATCH',
      path: `/webhooks/${encodeURIComponent(id)}`,
      body: params,
      idempotencyKey: options.idempotencyKey,
    })
  }

  /** Permanently deletes a webhook. */
  delete(id: string, options: RequestOptions = {}): Promise<Deleted> {
    return this.http.request<Deleted>({
      method: 'DELETE',
      path: `/webhooks/${encodeURIComponent(id)}`,
      idempotencyKey: options.idempotencyKey,
    })
  }

  /** Rotates the webhook's signing secret and returns the new value. */
  rotateSecret(id: string, options: RequestOptions = {}): Promise<RotatedWebhookSecret> {
    return this.http.request<RotatedWebhookSecret>({
      method: 'POST',
      path: `/webhooks/${encodeURIComponent(id)}/rotate-secret`,
      idempotencyKey: options.idempotencyKey,
    })
  }
}

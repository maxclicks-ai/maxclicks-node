import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { ListParams, RequestOptions, Template, TemplateSendParams, TemplateSendResponse } from '../types'

/** Read and send stored message templates. */
export class TemplatesResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's templates, newest first. Paginated. */
  list(params: ListParams = {}): Promise<Page<Template>> {
    const fetcher: PageFetcher<Template> = ({ limit, offset }) =>
      this.http.requestPage<Template>({ method: 'GET', path: '/templates', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a template by id. */
  get(id: string): Promise<Template> {
    return this.http.request<Template>({ method: 'GET', path: `/templates/${encodeURIComponent(id)}` })
  }

  /**
   * Sends a template to the recipient resolved from `data`. Renders and dispatches
   * synchronously. A genuine send failure resolves with `status: 'failed'` and a
   * generic `error`, not a thrown error. Any warnings are delivered via the `onWarning` callback.
   *
   * Accepts `options.idempotencyKey`, the only way to make a retried send safe:
   * without a key a timed-out send is never repeated by the SDK, because the
   * email may already be on its way.
   */
  send(templateId: string, params: TemplateSendParams, options: RequestOptions = {}): Promise<TemplateSendResponse> {
    return this.http.request<TemplateSendResponse>({
      method: 'POST',
      path: `/templates/${encodeURIComponent(templateId)}/send`,
      body: params,
      idempotencyKey: options.idempotencyKey,
    })
  }
}

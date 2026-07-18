import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type {
  Deleted,
  ListParams,
  Template,
  TemplateCreateParams,
  TemplateSendParams,
  TemplateSendResponse,
  TemplateUpdateParams,
} from '../types'

/** Create, read, update, delete, duplicate, and send stored message templates. */
export class TemplatesResource {
  constructor(private readonly http: HttpClient) {}

  /** Lists the space's templates, newest first. Paginated. */
  list(params: ListParams = {}): Promise<Page<Template>> {
    const fetcher: PageFetcher<Template> = ({ limit, offset }) =>
      this.http.requestPage<Template>({ method: 'GET', path: '/templates', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Creates a template with raw editor content. Created templates always start in the raw editor. */
  create(params: TemplateCreateParams): Promise<Template> {
    return this.http.request<Template>({ method: 'POST', path: '/templates', body: params })
  }

  /** Fetches a template by id. */
  get(id: string): Promise<Template> {
    return this.http.request<Template>({ method: 'GET', path: `/templates/${encodeURIComponent(id)}` })
  }

  /** Partially updates a template. An explicit `null` clears a nullable field. */
  update(id: string, params: TemplateUpdateParams): Promise<Template> {
    return this.http.request<Template>({ method: 'PATCH', path: `/templates/${encodeURIComponent(id)}`, body: params })
  }

  /** Permanently deletes a template. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/templates/${encodeURIComponent(id)}` })
  }

  /** Duplicates a template, including its content and data representation, as a fresh copy. */
  duplicate(id: string): Promise<Template> {
    return this.http.request<Template>({ method: 'POST', path: `/templates/${encodeURIComponent(id)}/duplicate` })
  }

  /**
   * Sends a template to the recipient resolved from `data`. Renders and dispatches
   * synchronously. A genuine send failure resolves with `status: 'failed'` and a
   * generic `error`, not a thrown error. Any warnings are delivered via the `onWarning` callback.
   */
  send(templateId: string, params: TemplateSendParams): Promise<TemplateSendResponse> {
    return this.http.request<TemplateSendResponse>({
      method: 'POST',
      path: `/templates/${encodeURIComponent(templateId)}/send`,
      body: params,
    })
  }
}

import { HttpClient, type HttpClientInternals } from './core/HttpClient'
import { type MaxclicksOptions, resolveConfig } from './core/MaxclicksConfig'
import {
  ApiKeysResource,
  AttributesResource,
  BroadcastsResource,
  DomainsResource,
  EmailsResource,
  EventsResource,
  FormsResource,
  ImportsResource,
  RecordsResource,
  SchemasResource,
  SegmentsResource,
  SendersResource,
  SuppressionsResource,
  TemplatesResource,
  TopicsResource,
  WebhooksResource,
  WorkflowsResource,
} from './resources'
import type { Me } from './types'

/**
 * The maxclicks Public API v1 client.
 *
 * ```ts
 * import { Maxclicks } from 'maxclicks'
 *
 * const mc = new Maxclicks('sk_live_...')
 * const me = await mc.me()
 * const contact = await mc.records.upsert('students', { email: 'a@b.com', firstName: 'Ada' })
 * for await (const record of await mc.records.list('students')) console.log(record.id)
 * ```
 */
export class Maxclicks {
  /** Read access to the space's schemas. */
  readonly schemas: SchemasResource
  /** Read access to a schema's attributes. */
  readonly attributes: AttributesResource
  /** Contact and object record CRUD. */
  readonly records: RecordsResource
  /** Bulk-import records into a schema and track import jobs. */
  readonly imports: ImportsResource
  /** Create and manage contact segments (natural-language audience filters). */
  readonly segments: SegmentsResource
  /** Email suppression list management (admin key). */
  readonly suppressions: SuppressionsResource
  /** Fire and read trigger events. */
  readonly events: EventsResource
  /** Send stored templates. */
  readonly templates: TemplatesResource
  /** Create, schedule, send, and measure broadcasts. */
  readonly broadcasts: BroadcastsResource
  /** Manage outgoing webhooks. */
  readonly webhooks: WebhooksResource
  /** Trigger workflows through incoming-webhook steps. */
  readonly workflows: WorkflowsResource
  /** Public form submission and double opt-in confirmation. */
  readonly forms: FormsResource
  /** Email recipient actions (one-click unsubscribe). */
  readonly emails: EmailsResource
  /** Register and verify sending domains. */
  readonly domains: DomainsResource
  /** Manage sender profiles. */
  readonly senders: SendersResource
  /** Manage communication topics. */
  readonly topics: TopicsResource
  /** Manage the space's API keys. Requires an admin key. */
  readonly apiKeys: ApiKeysResource

  private readonly http: HttpClient

  /**
   * @param optionsOrApiKey A bearer API key, or a full options object. Falls back
   *   to the `MAXCLICKS_API_KEY` environment variable when no key is given.
   * @param internals Test seams (deterministic time/jitter/sleep). Not part of the stable API.
   * @internal the second parameter
   */
  constructor(optionsOrApiKey: string | MaxclicksOptions = {}, internals?: HttpClientInternals) {
    const config = resolveConfig(optionsOrApiKey)
    this.http = new HttpClient(config, internals)
    this.schemas = new SchemasResource(this.http)
    this.attributes = new AttributesResource(this.http)
    this.records = new RecordsResource(this.http)
    this.imports = new ImportsResource(this.http)
    this.segments = new SegmentsResource(this.http)
    this.suppressions = new SuppressionsResource(this.http)
    this.events = new EventsResource(this.http)
    this.templates = new TemplatesResource(this.http)
    this.broadcasts = new BroadcastsResource(this.http)
    this.webhooks = new WebhooksResource(this.http)
    this.workflows = new WorkflowsResource(this.http)
    this.forms = new FormsResource(this.http)
    this.emails = new EmailsResource(this.http)
    this.domains = new DomainsResource(this.http)
    this.senders = new SendersResource(this.http)
    this.topics = new TopicsResource(this.http)
    this.apiKeys = new ApiKeysResource(this.http)
  }

  /** Identifies the calling API key: the key, its owner, the bound space, and the caller's role. */
  me(): Promise<Me> {
    return this.http.request<Me>({ method: 'GET', path: '/me' })
  }
}

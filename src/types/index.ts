import type { MaxclicksApiErrorBody } from '../errors'

/** Communication channels a contact can be reached through. Only `email` exists in v1. */
export type CommunicationChannel = 'email'

/** The kind of business record a schema describes. */
export type SchemaType = 'contact' | 'object' | 'event'

/** How a contact record entered the platform. */
export type ContactSource = 'import' | 'api' | 'form' | 'manual' | 'workflow' | 'integration'

/** Pagination metadata returned alongside every paginated list. */
export interface Pagination {
  limit: number
  offset: number
  totalCount: number
  hasMore: boolean
}

/** Parameters common to every paginated list endpoint. */
export interface ListParams {
  /** Page size, 1..200 (default 50). Out-of-range values are clamped server-side with a warning. */
  limit?: number
  /** Rows to skip, 0..10000 (default 0). Out-of-range values are clamped server-side with a warning. */
  offset?: number
}

// ---------------------------------------------------------------------------
// Meta (/me)
// ---------------------------------------------------------------------------

/** The identity of the calling API key: the key, its owner, the bound space, and the caller's role. */
export interface Me {
  apiKey: { id: string; name: string | null; keyDisplay: string; createdAt: string }
  user: { id: string; email: string; name: string | null }
  space: { id: string; slug: string; name: string } | null
  role: { name: 'admin' | 'non-paid admin' | 'member'; label: string; description: string } | null
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export interface Schema {
  id: string
  type: SchemaType
  slug: string
  name: string
  namePlural: string
  description: string | null
  /** Set when the schema is managed by an integration; `null` for user-created schemas. */
  integrationVendorName: string | null
  /** Count of custom attribute rows only (base attributes are not counted). */
  attributeCount: number
  createdAt: string
  updatedAt: string
}

export interface SchemaListParams extends ListParams {
  /** Filter by one or more schema types. */
  type?: SchemaType | SchemaType[]
}

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

export type AttributeStoredType =
  | 'string'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'date time'
  | 'date only'
  | 'time only'
  | 'url'
  | 'email'
  | 'phone'
  | 'json'
  | 'string array'
  | 'object'
  | 'object array'

/** Definition of a stored (persisted) attribute. Extra keys vary by `type` and sub-format. */
export interface StoredAttributeDefinition {
  type: AttributeStoredType
  nullable?: boolean
  autoFill?: { mode: 'default'; defaultValue: unknown } | { mode: 'ai'; prompt?: string }
  [key: string]: unknown
}

/** Definition of an evaluated (computed, never stored) attribute. */
export interface EvaluatedAttributeDefinition {
  type: 'evaluated'
  target: 'schema' | 'json'
  requirements?: string
  expressionReferences?: { schemaIds: string[]; attributeIds: string[]; segmentIds: string[] }
  [key: string]: unknown
}

export type AttributeDefinition = StoredAttributeDefinition | EvaluatedAttributeDefinition

export interface Attribute {
  /** A real attribute id for custom attributes, or `base:<key>` for platform base attributes. */
  id: string
  key: string
  label: string
  description: string | null
  /** Ordering value for custom attributes; `null` for base attributes. */
  sequence: string | null
  definition: AttributeDefinition
  integrationVendorName: string | null
  /** ISO date-time for custom attributes; `null` for base attributes. */
  createdAt: string | null
  updatedAt: string | null
}

// ---------------------------------------------------------------------------
// Records (contacts and objects)
// ---------------------------------------------------------------------------

export interface EmailStatistics {
  sent: number
  delivered: number
  bounced: number
  complained: number
  unsubscribed: number
  uniqueOpens: number
  uniqueClicks: number
}

/** A contact record. Custom attribute values are spread onto the top level. */
export interface ContactRecord {
  id: string
  schemaId: string
  schemaSlug: string
  source: ContactSource
  fullName: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  userId: string | null
  email: string | null
  phone: string | null
  subscriptions: CommunicationChannel[]
  topicIds: string[]
  notes: string | null
  tags: string[]
  emailStatistics: EmailStatistics | null
  createdAt: string
  updatedAt: string
  [customAttributeKey: string]: unknown
}

/** An object record. Custom attribute values are spread onto the top level. */
export interface ObjectRecord {
  id: string
  schemaId: string
  schemaSlug: string
  externalId: string | null
  notes: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  [customAttributeKey: string]: unknown
}

export type MaxclicksRecord = ContactRecord | ObjectRecord

/** Input for a contact create/upsert/update. All fields optional; custom keys allowed. */
export interface ContactInput {
  id?: string
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  userId?: string | null
  email?: string | null
  phone?: string | null
  subscriptions?: CommunicationChannel[]
  topicIds?: string[]
  notes?: string | null
  tags?: string[]
  [customAttributeKey: string]: unknown
}

/** Input for an object create/upsert/update. All fields optional; custom keys allowed. */
export interface ObjectInput {
  id?: string
  externalId?: string | null
  notes?: string | null
  tags?: string[]
  [customAttributeKey: string]: unknown
}

export type RecordInput = ContactInput | ObjectInput

/** Echoed by every delete endpoint. */
export interface Deleted {
  id: string
  deleted: true
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export type AuditTrailEventType =
  | 'email_verification_sent'
  | 'email_verified'
  | 'phone_verification_sent'
  | 'phone_verified'
  | 'subscribed'
  | 'unsubscribed'
  | 'topics_added'
  | 'topics_removed'
  | 'suppressed'
  | 'unsuppressed'
  | (string & {})

export type AuditTrailState =
  | 'subscribed'
  | 'not_subscribed'
  | 'unsubscribed'
  | 'pending'
  | 'invalid'
  | 'redacted'
  | (string & {})

export type AuditTrailOptInLevel = 'single' | 'double' | 'unknown' | (string & {})

export type AuditTrailActorType = 'contact' | 'admin' | 'system' | 'api' | (string & {})

export interface AuditTrailEntry {
  id: string
  createdAt: string
  communicationChannel: 'email'
  communicationTopicIds: string[]
  eventType: AuditTrailEventType
  state: AuditTrailState | null
  optInLevel: AuditTrailOptInLevel | null
  actorType: AuditTrailActorType
  actorIdentifier: string | null
  context: unknown
}

export interface AuditTrailListParams extends ListParams {
  /** Filter by communication channel (only `email` is valid in v1). */
  channel?: CommunicationChannel
}

// ---------------------------------------------------------------------------
// Suppressions
// ---------------------------------------------------------------------------

/** Every possible suppression reason on read. Only `manual` and `legal` are creatable/removable; the rest are system-applied and read-only. */
export type SuppressionReason =
  | 'manual'
  | 'legal'
  | 'unsubscribed'
  | 'hard_bounce'
  | 'soft_bounce_consecutive'
  | 'spam_complaint'

/** The subset of suppression reasons that can be created or removed through the API. */
export type SuppressionCreateReason = 'manual' | 'legal'

/** The scope a suppression applies to: only this space, or globally across the platform. */
export type SuppressionScope = 'space' | 'global'

export interface SuppressionInput {
  /** The email address to suppress. */
  identifier: string
  reason: SuppressionCreateReason
  notes?: string | null
}

export interface Suppression {
  id: string
  createdAt: string
  communicationChannel: 'email'
  reason: SuppressionReason
  notes: string | null
  scope: SuppressionScope
  /** A hash of the suppressed identifier. The raw identifier is never returned. */
  identifierHash: string
  /** Number of contacts in the space whose email matched the suppressed identifier. Present only on create and batchCreate responses. */
  affectedContactCount?: number
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Input for firing an event. `id` is ignored by the server on fire. */
export interface EventInput {
  /** Deduplication key. */
  eventId?: string | null
  /** ISO date-time for when the event actually happened. */
  occurredAt?: string
  [customAttributeKey: string]: unknown
}

export interface FireResult {
  accepted: number
}

export interface BatchFireItemResult {
  index: number
  status: 'accepted' | 'failed'
  error?: MaxclicksApiErrorBody
}

export interface BatchFireResult {
  results: BatchFireItemResult[]
  summary: { accepted: number; failed: number }
  /** Present only on an `onError: 'abort'` response, pointing at the first invalid item. */
  failedIndex?: number
}

export interface EventBatchParams {
  /** `continue` (default) validates all items; `abort` stops at the first invalid item. */
  onError?: 'continue' | 'abort'
}

export interface Event {
  id: string
  schemaId: string
  schemaSlug: string
  eventId: string | null
  createdAt: string
  [customAttributeKey: string]: unknown
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface TemplateSendParams {
  /** Payload keyed by the template's expected data-representation properties. */
  data: Record<string, unknown>
}

/** The outcome of a synchronous template send. A genuine send failure returns `status: 'failed'` with a generic `error`. */
export interface TemplateSendResponse {
  emailId: string | null
  status: 'sent' | 'failed' | null
  /** A generic message when `status` is `failed`; the real failure detail stays server-side. */
  error: string | null
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export type WebhookTrigger =
  | 'contact upserted'
  | 'contact deleted'
  | 'object upserted'
  | 'object deleted'
  | 'event fired'
  | 'email event'

export type EmailEventType =
  | 'scheduled'
  | 'sending failed'
  | 'sent'
  | 'rejected'
  | 'unsubscribed'
  | 'bounced'
  | 'complained'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'delivery delayed'

export type WebhookStatus = 'live' | 'paused' | 'circuit breaker'

export type WebhookCondition =
  | { type: 'none' }
  | { type: 'segment'; segmentId: string }
  | { type: 'custom filter'; description: string }

export interface Webhook {
  id: string
  createdAt: string
  updatedAt: string
  url: string
  trigger: WebhookTrigger
  emailEventTypes: EmailEventType[]
  schemaId: string | null
  condition: WebhookCondition
  status: WebhookStatus
  totalCalls: number
  failedCalls: number
  failedCallsInARow: number
  lastCalledAt: string | null
  lastCallErrorMessage: string | null
  /** Set when the webhook is integration-owned (then it cannot be updated/deleted/rotated). */
  integrationVendorName: string | null
}

/** Returned by create and rotate-secret only: the webhook plus its signing secret. */
export interface WebhookWithSecret extends Webhook {
  signatureVerificationSecret: string
}

export interface WebhookCreateParams {
  url: string
  trigger: WebhookTrigger
  /** Required and non-empty only when `trigger` is `email event`. */
  emailEventTypes?: EmailEventType[]
  /** Schema id or slug. Required for every trigger except `email event`. */
  schemaId?: string | null
  /** Defaults to `{ type: 'none' }`. A `custom filter` condition is AI-generated from `requirements` (billed, `ai` rate bucket). */
  condition?:
    | { type: 'none' }
    | { type: 'segment'; segmentId: string }
    | { type: 'custom filter'; requirements: string }
}

export interface WebhookUpdateParams {
  url?: string
  /** Only allowed when the webhook's trigger is `email event`. */
  emailEventTypes?: EmailEventType[]
  /** A `custom filter` condition is AI-generated from `requirements` (billed, `ai` rate bucket). */
  condition?:
    | { type: 'none' }
    | { type: 'segment'; segmentId: string }
    | { type: 'custom filter'; requirements: string }
  /** `circuit breaker` is not settable via the API. */
  status?: 'live' | 'paused'
}

export interface RotatedWebhookSecret {
  id: string
  signatureVerificationSecret: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Forms and emails (public, unauthenticated)
// ---------------------------------------------------------------------------

export interface FormContactInput {
  id?: string | null
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  userId?: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
  tags?: string[] | null
  [customAttributeKey: string]: unknown
}

export interface FormSubmission {
  contact: FormContactInput
  emailMarketingConsent?: boolean | null
  captchaToken?: string | null
}

export type FormSubmissionResult = { contactId: string } | { status: 'verification_pending' }

/** The outcome of a browser-redirect endpoint, with the resolved `Location`. */
export interface RedirectResult {
  status: number
  redirectUrl: string | null
}

// ---------------------------------------------------------------------------
// schemas additions
// ---------------------------------------------------------------------------

/** Parameters for creating a schema. `type` and `slug` are immutable once set. */
export interface SchemaCreateParams {
  /** The schema type: `contact`, `object`, or `event`. */
  type: SchemaType
  /** Singular display name, unique within the space. */
  name: string
  /** Plural display name. */
  namePlural: string
  /** URL-safe slug, unique within the space. */
  slug: string
  /** Optional human-readable description. */
  description?: string | null
}

/** Parameters for updating a schema. At least one field must be provided; `type` and `slug` are immutable. */
export interface SchemaUpdateParams {
  /** New singular display name. */
  name?: string
  /** New plural display name. */
  namePlural?: string
  /** New description; pass `null` to clear it. */
  description?: string | null
}

// ---------------------------------------------------------------------------
// attributes additions
// ---------------------------------------------------------------------------

/** Input to create a custom attribute. Provide exactly one of `definition` (stored) or `requirements` (evaluated). */
export interface AttributeCreateParams {
  /** 1-100 chars, no spaces or quotes, not a reserved base key. */
  key: string
  label: string
  description?: string | null
  /** A stored attribute definition. Cannot be `evaluated`; use `requirements` for that. */
  definition?: StoredAttributeDefinition
  /** Natural-language prompt: AI generates an evaluated attribute definition from it (billed, `ai` rate bucket). */
  requirements?: string
}

// ---------------------------------------------------------------------------
// suppressions additions
// ---------------------------------------------------------------------------

/** Filters for listing suppressions. */
export interface SuppressionListParams extends ListParams {
  /** Filter to the suppression(s) for one email address. */
  identifier?: string
}

/** One item in a batch-create response: suppression fields on `created`/`exists`, `error` on `failed`. */
export type SuppressionBatchCreateResultItem = Partial<Suppression> & {
  index: number
  status: 'created' | 'exists' | 'failed'
  error?: MaxclicksApiErrorBody
}

/** Per-item results and a summary for a batch-create call. */
export interface SuppressionBatchCreateResult {
  results: SuppressionBatchCreateResultItem[]
  summary: { created: number; exists: number; failed: number }
}

/** One item in a batch-delete response; `error` is present when `status` is `failed`. */
export interface SuppressionBatchDeleteResultItem {
  index: number
  status: 'removed' | 'failed'
  error?: MaxclicksApiErrorBody
}

/** Per-item results and a summary for a batch-delete call. */
export interface SuppressionBatchDeleteResult {
  results: SuppressionBatchDeleteResultItem[]
  summary: { removed: number; failed: number }
}

// ---------------------------------------------------------------------------
// events additions
// ---------------------------------------------------------------------------

/** Cursor pagination metadata, returned only by `events.list`. */
export interface CursorPagination {
  /** The page size that was applied. */
  limit: number
  /** Opaque cursor for the next page, or `null` when there are no more rows. */
  nextCursor: string | null
  /** Whether another page exists after this one. */
  hasMore: boolean
}

/** Filters for reading an event schema's history. `schema` is required. */
export interface EventListParams {
  /** The event schema id or slug to read history for. */
  schema: string
  /** Start of the time range (ISO 8601). Defaults to the 7 days before `to`. */
  from?: string
  /** End of the time range (ISO 8601). Defaults to now. */
  to?: string
  /** Opaque cursor from a previous page's `pagination.nextCursor`. */
  cursor?: string
  /** Page size, 1..200 (default 50). Out-of-range values are clamped server-side with a warning. */
  limit?: number
}

/** One cursor page of event history. */
export interface EventPage {
  /** The events on this page, newest first. */
  data: Event[]
  /** Cursor pagination metadata: follow `nextCursor` to page forward. */
  pagination: CursorPagination
  /** Warnings the API returned for this page, if any (for example a clamped time range). */
  warnings: string[] | null
}

// ---------------------------------------------------------------------------
// templates additions
// ---------------------------------------------------------------------------

/** A sender: either a verified domain with a manual slug and display name, or a saved sender profile. */
export type TemplateFrom =
  | { type: 'domain'; domainId: string; code: string; name?: string | null }
  | { type: 'sender'; senderId: string }

/** A path into a data payload, as property-key segments. */
export type DataPath = string[]

/** Which evaluated attributes to compute before a record-typed data property is consumed, nested recursively. */
export interface AttributeExpansions {
  [evaluatedAttributeKey: string]: AttributeExpansions
}

/** One property of a data representation: a `record` from a schema or a `json` value described by a JSON schema. */
export type DataRepresentationProperty =
  | { key: string; type: 'record'; schema: string; isArray?: boolean; description?: string | null }
  | { key: string; type: 'json'; jsonSchema: Record<string, unknown>; description?: string | null }

/** The rendered subject and body of a template's stored content. */
export interface TemplateContent {
  subject: string | null
  body: string | null
}

/** Raw editor content used to create or update a template. */
export interface TemplateContentInput {
  bodyFormat: 'mjml' | 'html'
  subject: string
  body: string
}

/** A stored message template with its content, sender, recipient path, and expected data representation. */
export interface Template {
  id: string
  createdAt: string
  updatedAt: string
  name: string | null
  description: string | null
  transactional: boolean
  contentFormat: 'mjml' | 'html' | null
  contentEditor: 'rich' | 'raw' | null
  content: TemplateContent | null
  from: TemplateFrom | null
  recipientDataPath: DataPath
  expectedDataRepresentation: DataRepresentationProperty[]
  communicationTopicId: string | null
}

/** Parameters for creating a template with raw editor content. */
export interface TemplateCreateParams {
  name?: string | null
  description?: string | null
  transactional: boolean
  content: TemplateContentInput
  from?: TemplateFrom
  recipientDataPath: DataPath
  communicationTopicId?: string | null
  attributeExpansions?: AttributeExpansions
  expectedDataRepresentation: DataRepresentationProperty[]
}

/** Parameters for updating a template. At least one field must be provided. */
export interface TemplateUpdateParams {
  name?: string | null
  description?: string | null
  transactional?: boolean
  content?: TemplateContentInput
  from?: TemplateFrom
  recipientDataPath?: DataPath
  communicationTopicId?: string | null
  attributeExpansions?: AttributeExpansions
  expectedDataRepresentation?: DataRepresentationProperty[]
}

// ---------------------------------------------------------------------------
// broadcasts additions
// ---------------------------------------------------------------------------

/** The scheduling state of a broadcast. */
export type BroadcastSchedulingStatus = 'none' | 'draft' | 'send now' | 'send at'

/** A broadcast's resolved audience. */
export type BroadcastAudience =
  | { type: 'all' }
  | { type: 'segment'; segmentId: string }
  | { type: 'custom filter'; requirements: string; conditionDescriptionMarkdown: string }

/**
 * The audience to create or update a broadcast with. A `custom filter` audience
 * can only be set via `broadcasts.generateAudience`, never directly through
 * create/update.
 */
export type BroadcastAudienceInput = { type: 'all' } | { type: 'segment'; segmentId: string }

/** Raw editor content used to create a broadcast, no rich-editor structure. */
export interface BroadcastContentInput {
  bodyFormat: 'mjml' | 'html'
  subject: string
  body: string
  transactional?: boolean
  from?: TemplateFrom
  communicationTopicId?: string | null
}

/** A broadcast: an audience, an owned copy of email content, and a scheduling state. */
export interface Broadcast {
  id: string
  createdAt: string
  updatedAt: string
  name: string | null
  description: string | null
  contactSchemaId: string
  contactSchemaSlug: string
  schedulingStatus: BroadcastSchedulingStatus
  scheduledFor: string | null
  sendingStartedAt: string | null
  sendingFinishedAt: string | null
  failureReason: string | null
  audience: BroadcastAudience
  /** Whether the broadcast has email content. Never includes the underlying content itself. */
  hasContent: boolean
}

/** Parameters for creating a broadcast. */
export interface BroadcastCreateParams {
  name?: string | null
  description?: string | null
  /** A contact schema id or slug. */
  contactSchema: string
  scheduledFor?: string | null
  audience?: BroadcastAudienceInput
  content?: BroadcastContentInput
}

/** Parameters for updating a broadcast. At least one field must be provided. */
export interface BroadcastUpdateParams {
  name?: string | null
  description?: string | null
  audience?: BroadcastAudienceInput
  scheduledFor?: string | null
}

/** Parameters for sending a broadcast. An empty or omitted body sends now; a `scheduledFor` schedules for later. */
export interface BroadcastSendParams {
  scheduledFor?: string
}

/** Parameters for generating a custom-filter audience from a natural-language prompt. */
export interface BroadcastAudienceGenerateParams {
  /** Natural-language description of the audience filter criteria. */
  requirements: string
}

/** The generated custom-filter audience and its live matching count. */
export interface BroadcastAudienceGenerateResult {
  audience: {
    type: 'custom filter'
    requirements: string
    conditionDescriptionMarkdown: string
  }
  /** A live count at generation time, not kept in sync afterward. */
  matchingCount: number
}

/** One reduced run record per recipient contact of a broadcast. */
export interface BroadcastRun {
  id: string
  createdAt: string
  contactId: string
  contactEmail: string | null
  status: 'sent' | 'failed' | 'pending'
  failureReason: string | null
  email: {
    id: string
    sentAt: string | null
    opensCount: number
    clicksCount: number
    bounced: boolean
    complained: boolean
  } | null
}

/** Aggregated email metrics for a broadcast. */
export interface EmailAggregatedMetrics {
  sent: number
  delivered: number
  bounced: number
  deliveryDelays: number
  rejected: number
  failed: number
  complained: number
  unsubscribed: number
  opens: number
  uniqueOpens: number
  clicks: number
  uniqueClicks: number
}

/** A broadcast's aggregated email metrics. `email` is omitted when the broadcast has no email content yet. */
export interface BroadcastMetrics {
  email?: EmailAggregatedMetrics
}

// ---------------------------------------------------------------------------
// workflows additions
// ---------------------------------------------------------------------------

/** An automated flow of steps. Runs start on the latest published version. */
export interface Workflow {
  id: string
  createdAt: string
  updatedAt: string
  name: string | null
  description: string | null
  paused: boolean
  /** Whether the workflow has edits not yet published. */
  isDirty: boolean
  published: boolean
}

/** The lifecycle status of a single workflow run. */
export type WorkflowRunStatus = 'running' | 'completed' | 'failed'

/** One entry in a run's step history: when it entered and left a step and which slot it took. */
export interface WorkflowRunStepHistoryRecord {
  stepId: string
  stepLabel: string | null
  slotKey: string | null
  enteredAt: string
  leftAt: string
  failureReason: string | null
}

/** A single execution of a workflow, with its status and step history. */
export interface WorkflowRun {
  id: string
  createdAt: string
  updatedAt: string
  versionId: string
  status: WorkflowRunStatus
  failureReason: string | null
  stepHistory: WorkflowRunStepHistoryRecord[]
}

// ---------------------------------------------------------------------------
// imports additions
// ---------------------------------------------------------------------------

/** The lifecycle status of a bulk import. */
export type ImportStatus = 'pending' | 'running' | 'succeeded' | 'partial' | 'failed' | 'canceled'

/** One sampled failed row from an import, for surfacing example errors without the full log. */
export interface ImportFailureSample {
  /** 1-based row number in the source CSV. */
  rowNumber: number
  /** The row's identifier value (email/externalId/etc.), or `null` when none could be read. */
  identifier: string | null
  /** Human-readable reason the row failed. */
  reason: string
}

/** A bulk import of contact or object records from an uploaded CSV file. */
export interface Import {
  id: string
  createdAt: string
  schemaId: string
  schemaSlug: string
  fileName: string
  /** Size of the source file in bytes. */
  byteSize: number
  status: ImportStatus
  /** Set when the whole import failed; `null` otherwise. */
  failureReason: string | null
  /** Total number of data rows detected in the file. */
  rowCount: number
  successCount: number
  failureCount: number
  /** Count of individual fields skipped (unknown/uneditable columns) across all rows. */
  skippedFieldCount: number
  failureSamples: ImportFailureSample[]
  /** When set, points at `imports.downloadFailureLog`, never a raw storage URL; `null` when there is no failure log. */
  failureLogUrl: string | null
  startedAt: string | null
  finishedAt: string | null
}

/** Parameters for starting an import from an already-uploaded CSV file. */
export interface ImportCreateParams {
  /** URL of an already-uploaded CSV file (a reference, not inline records or raw CSV text). */
  fileUrl: string
  /** File size in bytes. Rejected above 50 MB. */
  byteSize: number
  /** Original file name to record for the import. */
  fileName?: string | null
  /** Tags applied to every imported record. */
  defaultTags?: string[]
  /** Communication channels every imported contact is subscribed to. */
  defaultSubscriptions?: CommunicationChannel[]
}

// ---------------------------------------------------------------------------
// domains additions
// ---------------------------------------------------------------------------

/** The verification state of a single DNS record. */
export type DnsRecordStatus = 'not started' | 'pending' | 'success' | 'failed' | 'temporary failure'

/** A single DNS record the space must publish, with its live-checked verification status. */
export interface DnsRecord {
  /** The record type (e.g. TXT, CNAME, MX). */
  type: string
  /** The record host/name. */
  name: string
  /** The record value. */
  value: string
  /** The MX priority, or null for non-MX records. */
  priority: number | null
  /** The live-checked verification status of this record. */
  status: DnsRecordStatus
}

/** A sending domain and its DNS verification state. */
export interface Domain {
  /** The domain id. */
  id: string
  /** When the domain was added. */
  createdAt: string
  /** When the domain was last updated. */
  updatedAt: string
  /** The domain name (e.g. example.com). */
  name: string
  /** The bounce-handling subdomain label. */
  customReturnPath: string
  /** Whether DNS verification has been initiated. */
  verificationStarted: boolean
  /** Whether the domain is verified and ready for sending. */
  verifiedForSending: boolean
  /** Live-checked DNS records. Present on get, create, and verify; omitted on list. */
  records?: DnsRecord[]
}

/** Parameters for adding a sending domain. */
export interface DomainCreateParams {
  /** The domain name, e.g. example.com. */
  name: string
  /** The bounce-handling subdomain label (defaults to `send`). */
  customReturnPath?: string
}

// ---------------------------------------------------------------------------
// senders additions
// ---------------------------------------------------------------------------

/** A saved sender profile: an email local part and display name on a verified domain. */
export interface Sender {
  /** The sender's unique id. */
  id: string
  /** When the sender was created. */
  createdAt: string
  /** When the sender was last updated. */
  updatedAt: string
  /** The sender profile's display name. */
  name: string
  /** An optional description, or null. */
  description: string | null
  /** The email local part (for example `support`). */
  code: string
  /** The id of the verified domain this sender sends from. */
  domainId: string
  /** The derived sending address, `code`@domain. */
  email: string
}

/** Parameters for creating a sender profile. */
export interface SenderCreateParams {
  /** The sender profile's display name. */
  name: string
  /** The email local part (for example `support`). */
  code: string
  /** The id of the verified domain to send from. */
  domainId: string
  /** An optional description, or null to leave empty. */
  description?: string | null
}

/** Parameters for updating a sender profile. At least one field must be provided. */
export interface SenderUpdateParams {
  /** A new display name. */
  name?: string
  /** A new email local part. */
  code?: string
  /** A new verified domain id. */
  domainId?: string
  /** A new description, or null to clear it. */
  description?: string | null
}

// ---------------------------------------------------------------------------
// topics additions
// ---------------------------------------------------------------------------

/** A display color for tags and topics. */
export type BadgeColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'zinc'

/** A communication topic a contact can consent to within a channel. */
export interface Topic {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
  color: BadgeColor
  channel: CommunicationChannel
  /** Private topics only appear in the contact preferences page if the contact has been granted access. */
  private: boolean
}

/** Fields for creating a communication topic. `channel` defaults to `email`. */
export interface TopicCreateParams {
  name: string
  description?: string | null
  color?: BadgeColor
  channel?: CommunicationChannel
  private?: boolean
}

/** Fields for updating a communication topic. At least one must be provided; `channel` is immutable. */
export interface TopicUpdateParams {
  name?: string
  description?: string | null
  color?: BadgeColor
  private?: boolean
}

/** Options for deleting a communication topic. */
export interface TopicDeleteParams {
  /** Bypass the in-use check (topic referenced by a form or email template). */
  force?: boolean
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

/** An AI-defined contact filter. The generated expression is never returned, only its markdown description. */
export interface Segment {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
  contactSchemaId: string
  contactSchemaSlug: string
  /** The refined natural-language specification used to generate the condition. */
  requirements: string
  /** Human-readable markdown description of the condition. */
  conditionDescriptionMarkdown: string
  /** Set when the segment is integration-owned (then it cannot be updated or deleted). */
  integrationVendorName: string | null
  /** A live matching count captured at creation or when `requirements` was last regenerated; omitted otherwise. */
  matchingCount?: number
}

/** Parameters for generating a new segment from natural-language requirements. */
export interface SegmentCreateParams {
  name: string
  description?: string | null
  /** A contact schema id or slug. */
  contactSchema: string
  /** Natural-language description of the filter criteria. */
  requirements: string
}

/** Parameters for updating a segment. Supplying `requirements` regenerates the condition (slow, billed). At least one field is required. */
export interface SegmentUpdateParams {
  name?: string
  description?: string | null
  requirements?: string
}

/** The live matching contact count for a segment and the schema's total contact count. */
export interface SegmentCount {
  count: number
  total: number
}

// ---------------------------------------------------------------------------
// apiKeys additions
// ---------------------------------------------------------------------------

/** An API key belonging to a space. Only the masked `keyDisplay` preview is ever returned after creation. */
export interface ApiKey {
  /** The API key id. */
  id: string
  /** When the key was created (ISO 8601). */
  createdAt: string
  /** Human-readable label, or `null` if unnamed. */
  name: string | null
  /** A masked preview of the key, e.g. `max_...ab12`. */
  keyDisplay: string
  /** The space the key is bound to, or `null`. */
  spaceId: string | null
  /** The id of the API key used to create this key, or `null`. */
  createdViaApiKeyId: string | null
}

/** Parameters for creating an API key. */
export interface ApiKeyCreateParams {
  /** Human-readable label for the key. Pass `null` or omit to leave it unnamed. */
  name?: string | null
}

/** A newly created API key including its plaintext value. The `key` is shown exactly once and cannot be retrieved again. */
export interface ApiKeyWithSecret extends ApiKey {
  /** The plaintext API key. Shown exactly once on creation, so save it immediately. */
  key: string
}

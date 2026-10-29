# maxclicks

The official [maxclicks](https://maxclicks.ai) Node.js and TypeScript SDK for the Public API v1.

Manage contacts and objects, send events and follow their readiness, send templates, manage webhooks, trigger workflows, and submit forms, all with full TypeScript types, automatic pagination, typed errors, and safe retries.

## Installation

```bash
npm install maxclicks
```

Requires Node.js 18 or newer. Ships both ESM and CommonJS builds.

## Quickstart

```ts
import { Maxclicks } from 'maxclicks'

const mc = new Maxclicks('max_YOUR_API_KEY') // or set MAXCLICKS_API_KEY and call new Maxclicks()

// Who am I?
const me = await mc.me()
console.log(me.space?.name)

// Upsert a contact into a contact schema (by id or slug)
const contact = await mc.records.upsert('students', {
  email: 'ada@example.com',
  firstName: 'Ada',
  tags: ['beta'],
})

// Send an event, then follow its readiness by the receipt's id
const receipt = await mc.events.fire('purchase-completed', { eventId: 'ord_123', contactId: contact.id, amount: 42 })
const status = await mc.events.status('purchase-completed', receipt.id)

// Send a template
await mc.templates.send(templateId, { data: { contact: { email: 'ada@example.com' } } })
```

CommonJS works too:

```js
const { Maxclicks } = require('maxclicks')
```

## Configuration

```ts
const mc = new Maxclicks({
  apiKey: process.env.MAXCLICKS_API_KEY, // defaults to this env var
  baseUrl: 'https://api.maxclicks.ai/v1', // override for stage or self hosting
  timeoutMs: 60000, // per request timeout
  maxRetries: 2, // extra attempts, only where a retry is safe (see Errors)
  onWarning: warnings => console.warn(warnings), // non fatal API warnings
})
```

## Errors

Request errors throw a typed subclass of `MaxclicksError`. Some operations return failure outcomes in their data: `templates.send()` resolves with `status: 'failed'` and an `error` when a send fails. Batch results can also contain failed items; `events.fireBatch()` returns its structured result even for HTTP 422. Inspect these outcomes as well as catching request errors.

```ts
import { MaxclicksError, MaxclicksNotFoundError, MaxclicksRateLimitError } from 'maxclicks'

try {
  const record = await mc.records.get('students', 'missing-id')
} catch (error) {
  if (error instanceof MaxclicksNotFoundError) {
    // 404
  } else if (error instanceof MaxclicksRateLimitError) {
    console.log('retry after', error.retryAfterMs)
  } else if (error instanceof MaxclicksError) {
    console.error(error.status, error.code, error.type, error.message)
  }
}
```

| Error                                                | When                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `MaxclicksBadRequestError`                           | 400 validation failure                                       |
| `MaxclicksAuthenticationError`                       | 401 missing or invalid API key                               |
| `MaxclicksPermissionError`                           | 403 insufficient permission or space out of scope            |
| `MaxclicksNotFoundError`                             | 404 resource not found                                       |
| `MaxclicksConflictError`                             | 409 identifier or uniqueness conflict                        |
| `MaxclicksUnprocessableEntityError`                  | 422 outside operations that return a structured batch result |
| `MaxclicksRateLimitError`                            | 429 rate limited (carries `retryAfterMs`)                    |
| `MaxclicksServerError`                               | 5xx server error                                             |
| `MaxclicksConnectionError` / `MaxclicksTimeoutError` | transport failure or timeout                                 |
| `MaxclicksConfigurationError`                        | client misconfiguration (for example no API key)             |

The SDK retries with jittered exponential backoff, honoring the `Retry-After` header, but only when a retry cannot duplicate a write:

| Request                              | Retried on `429` | Retried on `5xx`, timeout, transport error |
| ------------------------------------ | ---------------- | ------------------------------------------ |
| `GET`                                | yes              | yes                                        |
| A write carrying an `idempotencyKey` | yes              | yes                                        |
| A write without a key                | yes              | **no**                                     |

A `429` is answered before the server does any work, so repeating the request duplicates nothing. A timeout or a `5xx` proves nothing: the send or the create may already have happened, so a keyless write fails fast with `MaxclicksTimeoutError`, `MaxclicksConnectionError`, or `MaxclicksServerError` instead of being repeated. Pass an idempotency key to get those retries back. `templates.send` and `records.delete` always carry a key, so they are always retried safely.

## Idempotency

Every write the API can deduplicate takes a trailing options object with an `idempotencyKey`. The first request with a given key executes; a repeat of the same operation and input with that key replays the original outcome instead of writing twice.

```ts
import { randomUUID } from 'node:crypto'

const key = randomUUID()
await mc.templates.send('tmpl_01hxyz...', { data: { contact: { email: 'ada@example.com' } } }, { idempotencyKey: key })
```

The API requires a key for `templates.send` and `records.delete`, so the SDK generates one when you pass none and reuses it for its own retries. Pass your own key when a retry can come from another process, such as a job queue, so the repeat replays the first outcome. A `MaxclicksConflictError` with code `idempotency_outcome_unknown` means the first attempt's outcome could not be confirmed: check what happened before you try again under a new key.

| Operations that accept `options.idempotencyKey`                                  |
| -------------------------------------------------------------------------------- |
| `records.create`, `records.upsert`, `records.delete` (key generated if omitted)  |
| `templates.send` (key generated if omitted)                                      |
| `suppressions.delete`, `suppressions.batchCreate`, `suppressions.batchDelete`    |
| `segments.create`, `segments.delete`                                             |
| `broadcasts.update`, `broadcasts.send`                                           |
| `webhooks.create`, `webhooks.update`, `webhooks.delete`, `webhooks.rotateSecret` |
| `workflows.trigger`, `workflows.pause`, `workflows.unpause`                      |

Use a key that is unique per logical operation (a UUID per order, per signup, per outgoing email) and reuse it only when retrying that same operation. One constant key shared by every call would make the API treat unrelated calls as replays.

## Pagination

Every `list` returns a `Page` that is both a single page and an async iterable over every item across all pages.

```ts
// One page
const page = await mc.records.list('students', { limit: 100 })
console.log(page.data, page.pagination.totalCount, page.pagination.hasMore)

// Every record, auto fetching subsequent pages
for await (const record of await mc.records.list('students')) {
  console.log(record.id)
}

// Or collect them all
const all = await (await mc.records.list('students')).all()
```

## API

```ts
mc.me()

mc.schemas.list(params?)                         // Page<Schema>
mc.schemas.get(schema)

mc.attributes.list(schema, params?)              // Page<Attribute>

mc.records.create(schema, input, options?)      // options: { idempotencyKey? }
mc.records.upsert(schema, input, options?)      // options: { idempotencyKey? }
mc.records.list(schema, params?)                 // Page<Record>
mc.records.get(schema, id)
mc.records.update(schema, id, input)
mc.records.delete(schema, id, options?)          // RecordDeletionStatus; runs in the background
mc.records.getDeletion(operationId)              // RecordDeletionStatus
mc.records.cancelDeletion(operationId)           // before removal begins
mc.records.auditTrail(schema, id, params?)       // Page<AuditTrailEntry>

mc.segments.list(params?)                        // Page<Segment>
mc.segments.create(params, options?)
mc.segments.get(id)
mc.segments.delete(id, options?)
mc.segments.count(id)                            // { count, total }
mc.segments.listContacts(id, params?)            // Page<Record>

mc.suppressions.create({ identifier, reason, notes? })  // admin key
mc.suppressions.delete(id, options?)
mc.suppressions.list(params?)                    // Page<Suppression>, admin key
mc.suppressions.batchCreate(inputs, options?)    // admin key
mc.suppressions.batchDelete(ids, options?)       // admin key

mc.events.fire(schema, input)                    // FireResult receipt: { accepted, id, eventId, isDuplicate, readinessAtAcceptance }
mc.events.fireBatch(schema, events, { onError? })
mc.events.status(schema, id)                     // EventStatus: current readiness
mc.events.list(params)                           // ready history, cursor-paginated, schema required
mc.eventIdentities.identify(input)               // link an anonymous browser identity to a contact

mc.templates.list(params?)                       // Page<Template>
mc.templates.get(id)
mc.templates.send(templateId, { data }, options?)

mc.broadcasts.list(params?)                      // Page<Broadcast>
mc.broadcasts.get(id)
mc.broadcasts.update(id, params, options?)
mc.broadcasts.send(id, params?, options?)
mc.broadcasts.listRuns(id, params?)              // Page<BroadcastRun>
mc.broadcasts.getMetrics(id)

mc.webhooks.create(params, options?)             // returns the signing secret once
mc.webhooks.list(params?)                        // Page<Webhook>
mc.webhooks.get(id)
mc.webhooks.update(id, params, options?)
mc.webhooks.delete(id, options?)
mc.webhooks.rotateSecret(id, options?)

mc.workflows.list(params?)                       // Page<Workflow>
mc.workflows.get(id)
mc.workflows.trigger(reference, body, options?)
mc.workflows.pause(id, options?)
mc.workflows.unpause(id, options?)
mc.workflows.listRuns(id, params?)               // Page<WorkflowRun>
mc.workflows.getRun(id, runId, { historyBefore? })  // latest 100 history entries, then page back

mc.forms.submit(formId, submission)              // unauthenticated
mc.forms.confirmDoubleOptIn(formId, token)
mc.emails.unsubscribeOneClick(emailId)

mc.domains.list(params?)                         // Page<Domain>
mc.domains.get(id)

mc.senders.list(params?)                         // Page<Sender>

mc.topics.list(params?)                          // Page<Topic>
mc.topics.get(id)
```

`schema` is a schema id or slug. Records are flat: base fields plus your custom attribute values at the top level. Custom attributes must be defined on the schema before you set them.

## Resources

### Schemas

Schemas define the structure of your contact, object, and event records.

```ts
// List only contact schemas
const contactSchemas = await mc.schemas.list({ type: 'contact' })

// Fetch a single schema by id or slug
const product = await mc.schemas.get('product')
console.log(product.type, product.namePlural, product.attributeCount)
```

### Attributes

Read a schema's attributes.

```ts
// List a schema's attributes (base attributes first, then custom)
const attributes = await mc.attributes.list('student')
for (const attribute of attributes.data) console.log(attribute.key, attribute.label)
```

### Suppressions

Manage the space's email do-not-contact list. All suppression endpoints require an admin key. Only `manual` and `legal` suppressions can be created or removed through the API; system-applied ones (bounce, complaint, unsubscribe) are read-only.

```ts
// Suppress a single address, then list and remove it
const suppression = await mc.suppressions.create({
  identifier: 'no-contact@example.com',
  reason: 'manual',
  notes: 'Requested removal by phone',
})

const page = await mc.suppressions.list({ identifier: 'no-contact@example.com' })
for (const entry of page.data) console.log(entry.id, entry.reason)

await mc.suppressions.delete(suppression.id)
```

```ts
// Bulk-suppress up to 100 addresses in one call
const result = await mc.suppressions.batchCreate([
  { identifier: 'a@example.com', reason: 'manual' },
  { identifier: 'b@example.com', reason: 'legal', notes: 'Court order' },
])
console.log(result.summary) // { created, exists, failed }

// Bulk-remove by id
await mc.suppressions.batchDelete(result.results.map(item => item.id).filter(Boolean) as string[])
```

### Events

Send business events, follow each one until it is ready for workflows, and read the ready history. Acceptance is durable but not the same as readiness: an accepted event can still fail preparation.

```ts
import { randomUUID } from 'node:crypto'

// Send one event. The receipt says it was accepted; `status` says whether it is ready.
const receipt = await mc.events.fire('purchase-completed', {
  eventId: 'order_1042', // your occurrence id: reuse it with the same input to retry safely
  occurredAt: '2026-10-29T10:30:00Z',
  contactId: 'con_01hxyz...',
  amount: 149.0,
  currency: 'usd',
})
console.log(receipt.id, receipt.isDuplicate, receipt.readinessAtAcceptance) // 'ev_...', false, 'pending'

const status = await mc.events.status('purchase-completed', receipt.id)
console.log(status.readinessState) // 'pending' | 'ready' | 'failed' | 'outcome_unknown'

// Send up to 500 events of one schema. Inspect every item: a batch can partly succeed.
const batch = await mc.events.fireBatch('page-viewed', [
  { eventId: 'view_1', contactId: 'con_1', path: '/pricing' },
  { eventId: 'view_2', contactId: 'con_2', path: '/docs' },
])
console.log(batch.summary) // { accepted: 2, failed: 0 }

// Read an event schema's history (cursor-paginated, newest first).
// `schema` is required. Follow `pagination.nextCursor` to page forward.
let page = await mc.events.list({ schema: 'purchase-completed', limit: 100 })
for (const event of page.data) console.log(event.id, event.createdAt)
while (page.pagination.hasMore && page.pagination.nextCursor) {
  page = await mc.events.list({ schema: 'purchase-completed', cursor: page.pagination.nextCursor })
  for (const event of page.data) console.log(event.id, event.createdAt)
}

// From your authenticated server, link a browser's anonymous identity to the signed-in contact.
await mc.eventIdentities.identify({
  sourceId: 'source_website',
  subjectSchemaId: 'sch_01hxyz...',
  anonymousId: 'visitor_1042',
  contactId: 'con_01hxyz...',
  operationId: randomUUID(), // reuse with the same body to retry
  expectedAliasRevision: '0',
})
```

### Records

Records are flat: base fields plus your custom attribute values at the top level. Deleting one runs in the background.

```ts
const deletion = await mc.records.delete('students', 'con_01hxyz...')
if (deletion.status === 'pending') {
  const later = await mc.records.getDeletion(deletion.operationId)
  console.log(later.status, later.message) // 'pending' | 'blocked' | 'completed' | 'cancelled'
}
```

### Templates

Read and send stored message templates. Templates are authored in the maxclicks app.

```ts
// List templates (paginated) and read one back.
const page = await mc.templates.list({ limit: 20 })
const template = await mc.templates.get(page.data[0].id)
console.log(template.recipientDataPath, template.expectedDataRepresentation)

// Send it to a contact resolved from the payload, then inspect the outcome.
const result = await mc.templates.send(template.id, {
  data: { contact: { email: 'student@example.com', firstName: 'Ada' } },
})
if (result.status === 'failed') console.error(result.error)
```

### Broadcasts

Schedule, send, and measure broadcasts to a filtered audience of contacts. Broadcasts are authored in the maxclicks app.

```ts
// Point a draft broadcast at a segment, then send it now.
const broadcast = await mc.broadcasts.update('b_01hxyz...', {
  name: 'Spring sale',
  audience: { type: 'segment', segmentId: 's_01hxyz...' },
})
await mc.broadcasts.send(broadcast.id)

// Later, read the aggregated results and per-recipient runs.
const metrics = await mc.broadcasts.getMetrics(broadcast.id)
console.log(metrics.email?.delivered, metrics.email?.uniqueOpens)

for await (const run of await mc.broadcasts.listRuns(broadcast.id)) {
  console.log(run.contactEmail, run.status)
}
```

### Workflows

Trigger workflows through their incoming-webhook steps, and inspect workflows and their runs.

```ts
// Start a run by posting to an incoming-webhook step reference (not a workflow id).
await mc.workflows.trigger('whs_9f3c...', { orderId: 'A-1024', total: 59.9 })

// Pause a workflow, then walk its most recent runs.
const workflow = await mc.workflows.pause('b1e7c0a2-...')
const runs = await mc.workflows.listRuns(workflow.id, { limit: 20 })
for (const run of runs.data) console.log(run.id, run.status, run.failureReason)
```

### Domains

Read the space's sending domains and their DNS verification state. Domains are added and verified in the maxclicks app.

```ts
// List existing domains (items omit `records`; call `get` for DNS records).
const page = await mc.domains.list({ limit: 20 })
for (const item of page.data) console.log(item.name, item.verifiedForSending)

// Read one domain back with its live-checked DNS records.
const domain = await mc.domains.get(page.data[0].id)
for (const record of domain.records ?? []) console.log(record.type, record.name, record.value, record.status)
```

### Senders

Saved sender profiles combine an email local part and display name on a verified domain.

```ts
// List every saved sender
const senders = await mc.senders.list()
for (const item of senders.data) console.log(item.name, item.email) // support@yourdomain.com
```

### Topics

Read the communication topics that contacts can consent to within a channel.

```ts
// List, then fetch one
const page = await mc.topics.list({ limit: 50 })
const topic = await mc.topics.get(page.data[0].id)
console.log(topic.name, topic.channel, topic.private)
```

### Segments

Segments are AI-defined contact filters. You describe the audience in plain language via `requirements`, and maxclicks generates the underlying condition (the generated expression is never returned, only a human-readable markdown description). Generating a segment is slow and billed.

```ts
// Generate a segment from a natural-language prompt
const segment = await mc.segments.create({
  name: 'High-value active customers',
  contactSchema: 'customers',
  requirements: 'Customers who spent over $500 in the last 90 days and opened an email this month',
})
console.log(segment.conditionDescriptionMarkdown, segment.matchingCount)

// Check how many contacts currently match, then page through them
const { count, total } = await mc.segments.count(segment.id)
console.log(`${count} of ${total} contacts match`)

for await (const contact of await mc.segments.listContacts(segment.id)) {
  console.log(contact.email)
}
```

## Development

```bash
npm install
npm run check         # type check (tsc --noEmit)
npm run build         # dual ESM + CJS build (tsup)
npm test              # unit tests (node --test)
npm run check.version # assert src/version.ts matches package.json (also runs on publish)
npm run sync.version  # stamp package.json's version into src/version.ts
```

`VERSION` in `src/version.ts` is sent as the `User-Agent` of every request, so it must match `package.json`. The canary and dev workflows set their version in CI and run `sync.version` before publishing; `prepack` refuses to pack a mismatch. [RELEASING.md](RELEASING.md) describes how a release is verified and published.

## License

MIT

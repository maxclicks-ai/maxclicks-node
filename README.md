# maxclicks

The official [maxclicks](https://maxclicks.ai) Node.js and TypeScript SDK for the Public API v1.

Manage contacts and objects, fire events, send templates, manage webhooks, trigger workflows, and submit forms, all with full TypeScript types, automatic pagination, typed errors, and built in retries.

## Installation

```bash
npm install maxclicks
```

Requires Node.js 18 or newer. Ships both ESM and CommonJS builds.

## Quickstart

```ts
import { Maxclicks } from 'maxclicks'

const mc = new Maxclicks('sk_live_...') // or set MAXCLICKS_API_KEY and call new Maxclicks()

// Who am I?
const me = await mc.me()
console.log(me.space?.name)

// Upsert a contact into a contact schema (by id or slug)
const contact = await mc.records.upsert('students', {
  email: 'ada@example.com',
  firstName: 'Ada',
  tags: ['beta'],
})

// Fire an event
await mc.events.fire('purchase-completed', { eventId: 'ord_123', amount: 42 })

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
  maxRetries: 2, // extra attempts on 429, 5xx, and transport errors
  onWarning: warnings => console.warn(warnings), // non fatal API warnings
})
```

## Errors

Every failure throws a typed subclass of `MaxclicksError`. The happy path returns data directly.

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

| Error | When |
| --- | --- |
| `MaxclicksBadRequestError` | 400 validation failure |
| `MaxclicksAuthenticationError` | 401 missing or invalid API key |
| `MaxclicksPermissionError` | 403 insufficient permission or space out of scope |
| `MaxclicksNotFoundError` | 404 resource not found |
| `MaxclicksConflictError` | 409 identifier or uniqueness conflict |
| `MaxclicksUnprocessableEntityError` | 422 (for example a batch abort) |
| `MaxclicksRateLimitError` | 429 rate limited (carries `retryAfterMs`) |
| `MaxclicksServerError` | 5xx server error |
| `MaxclicksConnectionError` / `MaxclicksTimeoutError` | transport failure or timeout |
| `MaxclicksConfigurationError` | client misconfiguration (for example no API key) |

The SDK automatically retries `429`, `5xx`, and transport errors with jittered exponential backoff, honoring the `Retry-After` header.

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
mc.attributes.get(schema, attribute)             // 'base:<key>' | id | key

mc.records.create(schema, input)
mc.records.upsert(schema, input)
mc.records.list(schema, params?)                 // Page<Record>
mc.records.get(schema, id)
mc.records.update(schema, id, input)
mc.records.delete(schema, id)
mc.records.auditTrail(schema, id, params?)       // Page<AuditTrailEntry>

mc.imports.create(schema, input)                 // start an import job
mc.imports.list(schema, params?)                 // Page<Import>
mc.imports.get(id)
mc.imports.downloadFailureLog(id)                // CSV text

mc.segments.create(params)
mc.segments.count(id)                            // { count, total }
mc.segments.listContacts(id, params?)            // Page<Record>

mc.suppressions.create({ identifier, reason, notes? })  // admin key
mc.suppressions.delete(id)
mc.suppressions.list(params?)                    // Page<Suppression>, admin key
mc.suppressions.batchCreate(inputs)              // admin key
mc.suppressions.batchDelete(ids)                 // admin key

mc.events.fire(schema, input)                    // { accepted }
mc.events.fireBatch(schema, events, { onError? })
mc.events.list(params)                           // Page<Event>, schema required
mc.events.get(id)

mc.templates.create(params)
mc.templates.list(params?)                       // Page<Template>
mc.templates.get(id)
mc.templates.update(id, params)
mc.templates.delete(id)
mc.templates.duplicate(id)
mc.templates.send(templateId, { data })

mc.broadcasts.create(params)                     // create, schedule, send, measure

mc.webhooks.create(params)                       // returns the signing secret once
mc.webhooks.list(params?)                        // Page<Webhook>
mc.webhooks.get(id)
mc.webhooks.update(id, params)
mc.webhooks.delete(id)
mc.webhooks.rotateSecret(id)

mc.workflows.trigger(reference, body)
mc.workflows.pause(id)
mc.workflows.listRuns(id, params?)               // Page<WorkflowRun>

mc.forms.submit(formId, submission)              // unauthenticated
mc.forms.confirmDoubleOptIn(formId, token)
mc.emails.unsubscribeOneClick(emailId)

mc.domains.create(params)                        // admin key
mc.domains.list(params?)                         // Page<Domain>
mc.domains.get(id)
mc.domains.verify(id)                            // admin key

mc.senders.create(params)
mc.senders.list(params?)                         // Page<Sender>
mc.senders.update(id, params)

mc.topics.create(params)
mc.topics.list(params?)                          // Page<Topic>
mc.topics.get(id)
mc.topics.update(id, params)
mc.topics.delete(id, params?)

mc.apiKeys.create(params)                        // admin key, plaintext key once
mc.apiKeys.list(params?)                         // Page<ApiKey>, admin key
mc.apiKeys.delete(id)                            // admin key
```

`schema` is a schema id or slug. Records are flat: base fields plus your custom attribute values at the top level. Custom attributes must be defined on the schema before you set them.

## Resources

### Schemas

Schemas define the structure of your contact, object, and event records.

```ts
// List only contact schemas
const contactSchemas = await mc.schemas.list({ type: 'contact' })

// Create an object schema
const product = await mc.schemas.create({
  type: 'object',
  name: 'Product',
  namePlural: 'Products',
  slug: 'product',
  description: 'Items available in the catalog',
})

// Rename it, then delete it (cascading its records)
await mc.schemas.update(product.id, { name: 'Catalog Product' })
await mc.schemas.delete(product.id)
```

### Attributes

Read a schema's attributes and add custom ones.

```ts
// List a schema's attributes (base attributes first, then custom)
const attributes = await mc.attributes.list('student')
for (const attribute of attributes.data) console.log(attribute.key, attribute.label)

// Fetch a single attribute (base:<key>, a custom attribute id, or a raw key)
const email = await mc.attributes.get('student', 'base:email')

// Add a stored attribute
const loyaltyPoints = await mc.attributes.create('student', {
  key: 'loyaltyPoints',
  label: 'Loyalty Points',
  definition: { type: 'number' },
})

// Add an AI-generated evaluated attribute (slow, billed)
const company = await mc.attributes.create('student', {
  key: 'company',
  label: 'Company',
  requirements: 'The company this contact works for, matched by email domain.',
})
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
await mc.suppressions.batchDelete(result.results.map((item) => item.id).filter(Boolean) as string[])
```

### Events

Fire trigger events into the ingest pipeline and read their archived history.

```ts
// Fire a single event. Fire-and-forget: resolves with the accepted count.
const result = await mc.events.fire('purchase-completed', {
  eventId: 'order_1042',
  occurredAt: '2026-07-18T10:30:00Z',
  amount: 149.0,
  currency: 'usd',
})
console.log(result.accepted) // 1

// Fire a batch of up to 500 events of one schema.
const batch = await mc.events.fireBatch('page-viewed', [
  { userId: 'u_1', path: '/pricing' },
  { userId: 'u_2', path: '/docs' },
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

// Fetch one previously-fired event by its platform id.
const event = await mc.events.get('018f3e...uuid')
```

### Templates

Create, read, update, delete, duplicate, and send stored message templates.

```ts
// Create a template, then send it to a contact resolved by email.
const template = await mc.templates.create({
  name: 'Welcome',
  transactional: true,
  content: {
    bodyFormat: 'mjml',
    subject: 'Welcome, {{ contact.firstName }}',
    body: '<mjml><mj-body><mj-section><mj-column><mj-text>Hello!</mj-text></mj-column></mj-section></mj-body></mjml>',
  },
  recipientDataPath: ['contact'],
  expectedDataRepresentation: [{ key: 'contact', type: 'record', schema: 'student' }],
})

await mc.templates.send(template.id, {
  data: { contact: { email: 'student@example.com', firstName: 'Ada' } },
})

// List templates (paginated) and duplicate one.
const page = await mc.templates.list({ limit: 20 })
const copy = await mc.templates.duplicate(page.data[0].id)
```

### Broadcasts

Create, schedule, send, and measure broadcasts to a filtered audience of contacts.

```ts
const broadcast = await mc.broadcasts.create({
  name: 'Spring sale',
  contactSchema: 'customers',
})
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

### Imports

Bulk-import contact or object records from an already-uploaded CSV file. Imports run asynchronously: create one, then poll `get` until the status settles, and pull the failure log when rows are rejected.

```ts
// Start an import from an uploaded CSV, then check on it.
const started = await mc.imports.create('students', {
  fileUrl: 'https://files.example.com/uploads/students-2026-07.csv',
  byteSize: 48213,
  fileName: 'students-2026-07.csv',
  defaultTags: ['spring-cohort'],
  defaultSubscriptions: ['email'],
})

const current = await mc.imports.get(started.id)
if (current.status === 'partial') {
  // failureLogUrl points at downloadFailureLog; the CSV comes back as raw text.
  const failuresCsv = await mc.imports.downloadFailureLog(current.id)
  console.log(failuresCsv)
}

// List a schema's imports (paginated, newest first).
for await (const record of await mc.imports.list('students')) {
  console.log(record.id, record.status, record.successCount, record.failureCount)
}
```

### Domains

Manage sending domains and their DNS verification. Most write endpoints require an admin key.

```ts
// Add a domain and read back the DNS records to publish.
const domain = await mc.domains.create({ name: 'example.com' })
for (const record of domain.records ?? [])
  console.log(record.type, record.name, record.value, record.status)

// After publishing the records at your DNS provider, re-check verification.
const verified = await mc.domains.verify(domain.id)
console.log(verified.verifiedForSending)

// List existing domains (items omit `records`; call `get` for DNS records).
const page = await mc.domains.list({ limit: 20 })
for (const item of page.data) console.log(item.name, item.verifiedForSending)
```

### Senders

Saved sender profiles combine an email local part and display name on a verified domain.

```ts
// Create a sender profile on a verified domain
const sender = await mc.senders.create({
  name: 'Support Team',
  code: 'support',
  domainId: 'd_01hxyz...',
  description: 'Customer support replies',
})
console.log(sender.email) // support@yourdomain.com

// List every saved sender, then update one
const senders = await mc.senders.list()
for (const item of senders.data) console.log(item.name, item.email)

await mc.senders.update(sender.id, { name: 'Customer Support' })
```

### Topics

Manage communication topics that contacts can consent to within a channel.

```ts
// Create a topic (channel defaults to email)
const topic = await mc.topics.create({
  name: 'Product Updates',
  description: 'Occasional news about new features.',
  color: 'indigo',
  private: false,
})

// List, fetch, update, and delete
const page = await mc.topics.list({ limit: 50 })
const one = await mc.topics.get(topic.id)
await mc.topics.update(topic.id, { color: 'violet', private: true })
await mc.topics.delete(topic.id, { force: true })
```

### Segments

Segments are AI-defined contact filters. You describe the audience in plain language via `requirements`, and maxclicks generates the underlying condition (the generated expression is never returned, only a human-readable markdown description). Generating or regenerating a segment is slow and billed.

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

### API keys

Self-service API key management. Every operation requires an admin key.

```ts
// Create a key. The plaintext `key` is returned ONCE here and never again, save it now.
const created = await mc.apiKeys.create({ name: 'CI pipeline' })
console.log(created.key) // e.g. "max_live_...", store securely
console.log(created.keyDisplay) // masked preview shown on every later read

// List existing keys (only masked previews are returned).
const page = await mc.apiKeys.list({ limit: 50 })
for (const apiKey of page.data) console.log(apiKey.id, apiKey.name, apiKey.keyDisplay)

// Delete a key by id.
await mc.apiKeys.delete(created.id)
```

## Development

```bash
npm install
npm run check   # type check (tsc --noEmit)
npm run build   # dual ESM + CJS build (tsup)
npm test        # unit tests (node --test)
```

## License

MIT

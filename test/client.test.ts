import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Maxclicks, MaxclicksConfigurationError } from '../src/index'
import { makeClient } from './helpers'

test('me() sends a bearer-authenticated GET to /me and unwraps data', async () => {
  const { client, calls } = makeClient({
    json: {
      data: {
        apiKey: { id: 'k1', name: null, keyDisplay: 'sk_...1', createdAt: 't' },
        user: { id: 'u1', email: 'a@b.com', name: null },
        space: null,
        role: null,
      },
    },
  })
  const me = await client.me()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'GET')
  assert.ok(calls[0].url.endsWith('/v1/me'))
  assert.equal(calls[0].headers['authorization'], 'Bearer sk_test')
  assert.equal(calls[0].headers['accept'], 'application/json')
  assert.equal(me.user.email, 'a@b.com')
  assert.equal(me.space, null)
})

test('records.create posts the body to the schema records path and returns the record', async () => {
  const { client, calls } = makeClient({
    status: 201,
    json: { data: { id: 'c1', schemaId: 's1', schemaSlug: 'students', email: 'ada@example.com' } },
  })
  const record = await client.records.create('students', { email: 'ada@example.com', firstName: 'Ada' })
  assert.equal(calls[0].method, 'POST')
  assert.ok(calls[0].url.endsWith('/v1/schemas/students/records'))
  assert.equal(calls[0].headers['content-type'], 'application/json')
  assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { email: 'ada@example.com', firstName: 'Ada' })
  assert.equal((record as { id: string }).id, 'c1')
})

test('schemas.list serializes a repeated type filter and pagination params', async () => {
  const { client, calls } = makeClient({
    json: { data: [], pagination: { limit: 50, offset: 0, totalCount: 0, hasMore: false } },
  })
  await client.schemas.list({ type: ['contact', 'object'] })
  const url = new URL(calls[0].url)
  assert.deepEqual(url.searchParams.getAll('type'), ['contact', 'object'])
  assert.equal(url.searchParams.get('limit'), '50')
  assert.equal(url.searchParams.get('offset'), '0')
})

test('records.get encodes path segments', async () => {
  const { client, calls } = makeClient({ json: { data: { id: 'a b' } } })
  await client.records.get('my schema', 'id/with/slash')
  assert.ok(calls[0].url.includes('/v1/schemas/my%20schema/records/id%2Fwith%2Fslash'))
})

test('events.fireBatch treats a 422 abort as a result, not an error', async () => {
  const { client } = makeClient({
    status: 422,
    json: { data: { results: [{ index: 0, status: 'failed' }], summary: { accepted: 0, failed: 1 }, failedIndex: 0 } },
  })
  const result = await client.events.fireBatch('purchase', [{ amount: 1 }], { onError: 'abort' })
  assert.equal(result.summary.failed, 1)
  assert.equal(result.failedIndex, 0)
})

test('templates.send returns the send outcome and surfaces header warnings via onWarning', async () => {
  const warnings: string[][] = []
  const { client, calls } = makeClient(
    {
      status: 200,
      json: { data: { emailId: 'em_1', status: 'sent', error: null } },
      headers: {
        'content-type': 'application/json',
        'maxclicks-warning-message': encodeURIComponent('first line\nsecond line'),
      },
    },
    { onWarning: w => warnings.push(w) }
  )
  const result = await client.templates.send('tmpl_1', { data: { contact: { email: 'a@b.com' } } })
  assert.deepEqual(result, { emailId: 'em_1', status: 'sent', error: null })
  assert.ok(calls[0].url.endsWith('/v1/templates/tmpl_1/send'))
  assert.deepEqual(warnings, [['first line', 'second line']])
})

test('body warnings are surfaced via onWarning', async () => {
  const warnings: string[][] = []
  const { client } = makeClient(
    { json: { data: { id: 'c1' }, warnings: ['Skipped update of email.'] } },
    { onWarning: w => warnings.push(w) }
  )
  await client.records.upsert('students', { email: 'a@b.com' })
  assert.deepEqual(warnings, [['Skipped update of email.']])
})

test('forms.submit is unauthenticated (no Authorization header)', async () => {
  const { client, calls } = makeClient({ json: { data: { contactId: 'c1' } } })
  const result = await client.forms.submit('form_1', { contact: { email: 'a@b.com' }, emailMarketingConsent: true })
  assert.equal(calls[0].headers['authorization'], undefined)
  assert.deepEqual(result, { contactId: 'c1' })
})

test('emails.unsubscribeOneClick posts the RFC 8058 form body and returns the landing url', async () => {
  const { client, calls } = makeClient({ status: 200, url: 'https://app.maxclicks.ai/unsubscribed' })
  const result = await client.emails.unsubscribeOneClick('email_1')
  assert.equal(calls[0].headers['content-type'], 'application/x-www-form-urlencoded')
  assert.equal(calls[0].body, 'List-Unsubscribe=One-Click')
  assert.deepEqual(result, { status: 200, redirectUrl: 'https://app.maxclicks.ai/unsubscribed' })
})

test('a missing API key throws MaxclicksConfigurationError before any request', async () => {
  let fetchCalled = false
  const client = new Maxclicks({
    apiKey: '',
    fetch: async () => {
      fetchCalled = true
      return new Response('{}')
    },
  })
  await assert.rejects(
    () => client.me(),
    (error: unknown) => {
      assert.ok(error instanceof MaxclicksConfigurationError)
      assert.equal((error as MaxclicksConfigurationError).code, 'no_api_key')
      return true
    }
  )
  assert.equal(fetchCalled, false)
})

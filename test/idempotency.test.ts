import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Maxclicks, RequestOptions } from '../src/index'
import { HttpClient } from '../src/core/HttpClient'
import { resolveConfig } from '../src/core/MaxclicksConfig'
import { makeClient } from './helpers'

type Operation = [name: string, call: (client: Maxclicks, options?: RequestOptions) => Promise<unknown>]

/** Every operation the API spec marks with `IdempotencyKeyParam`. */
const operations: Operation[] = [
  ['records.create', (client, options) => client.records.create('students', { email: 'a@b.com' }, options)],
  ['records.upsert', (client, options) => client.records.upsert('students', { email: 'a@b.com' }, options)],
  [
    'suppressions.batchCreate',
    (client, options) => client.suppressions.batchCreate([{ identifier: 'a@b.com', reason: 'manual' }], options),
  ],
  ['suppressions.batchDelete', (client, options) => client.suppressions.batchDelete(['sup_1'], options)],
  ['templates.send', (client, options) => client.templates.send('tmpl_1', { data: { contact: {} } }, options)],
  ['broadcasts.send', (client, options) => client.broadcasts.send('bc_1', {}, options)],
  ['workflows.trigger', (client, options) => client.workflows.trigger('ref_1', { a: 1 }, options)],
]

for (const [name, call] of operations) {
  test(`${name} sends the supplied key as the Idempotency-Key header`, async () => {
    const { client, calls } = makeClient({ json: { data: {} } })
    await call(client, { idempotencyKey: 'key-123' })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].headers['idempotency-key'], 'key-123')
  })

  test(`${name} sends no Idempotency-Key header when no key is supplied`, async () => {
    const { client, calls } = makeClient({ json: { data: {} } })
    await call(client)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].headers['idempotency-key'], undefined)
  })
}

test('an empty idempotency key is treated as no key', async () => {
  const { client, calls } = makeClient({ json: { data: {} } })
  await client.records.create('students', { email: 'a@b.com' }, { idempotencyKey: '' })
  assert.equal(calls[0].headers['idempotency-key'], undefined)
})

test('read operations send no Idempotency-Key header', async () => {
  const { client, calls } = makeClient({ json: { data: { id: 'c1' } } })
  await client.records.get('students', 'c1')
  assert.equal(calls[0].headers['idempotency-key'], undefined)
})

test('per-request headers reach the transport, with a single canonical idempotency key', async () => {
  const sent: Record<string, string>[] = []
  const fetch = async (_url: string, init: RequestInit = {}) => {
    sent.push({ ...(init.headers as Record<string, string>) })
    return new Response(JSON.stringify({ data: {} }), { headers: { 'content-type': 'application/json' } })
  }
  const http = new HttpClient(resolveConfig({ apiKey: 'sk_test', fetch }))
  await http.request({
    method: 'POST',
    path: '/schemas/students/records',
    body: { email: 'a@b.com' },
    headers: { 'X-Trace-Id': 'trace-1', 'idempotency-key': 'header-key' },
  })
  assert.equal(sent[0]['X-Trace-Id'], 'trace-1')
  const idempotencyHeaders = Object.keys(sent[0]).filter(key => key.toLowerCase() === 'idempotency-key')
  assert.deepEqual(idempotencyHeaders, ['Idempotency-Key'])
  assert.equal(sent[0]['Idempotency-Key'], 'header-key')
})

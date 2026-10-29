import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MaxclicksConnectionError, MaxclicksServerError, MaxclicksTimeoutError } from '../src/index'
import { makeClient } from './helpers'

const serverError = { status: 500, json: { error: { type: 'api_error', code: null, message: 'boom' } } }
const rateLimited = {
  status: 429,
  json: { error: { type: 'invalid_request_error', code: 'rate_limit_exceeded', message: 'slow down' } },
}
const timeout = () => {
  throw Object.assign(new Error('aborted'), { name: 'AbortError' })
}

test('a GET is retried after a transport error', async () => {
  const { client, calls } = makeClient((_call, index) => {
    if (index === 0) throw new Error('ECONNRESET')
    return { json: { data: { id: 'c1' } } }
  })
  await client.records.get('students', 'c1')
  assert.equal(calls.length, 2)
})

test('a GET is retried on 5xx', async () => {
  const { client, calls } = makeClient([serverError, { json: { data: { id: 'c1' } } }])
  await client.records.get('students', 'c1')
  assert.equal(calls.length, 2)
})

test('a keyless POST is not retried after a transport error', async () => {
  const { client, calls } = makeClient(() => {
    throw new Error('ECONNRESET')
  })
  await assert.rejects(() => client.records.create('students', { email: 'a@b.com' }), MaxclicksConnectionError)
  assert.equal(calls.length, 1)
})

test('a template send without a caller key is retried after a timeout under the same generated key', async () => {
  const { client, calls } = makeClient((_call, index) => {
    if (index === 0) return timeout()
    return { json: { data: { emailId: 'em_1', status: 'sent', error: null } } }
  })
  const result = await client.templates.send('tmpl_1', { data: {} })
  assert.equal(result.status, 'sent')
  assert.equal(calls.length, 2)
  assert.ok(calls[0].headers['idempotency-key'])
  assert.equal(calls[1].headers['idempotency-key'], calls[0].headers['idempotency-key'])
})

test('a template send that keeps timing out still fails with a timeout', async () => {
  const { client } = makeClient(timeout)
  await assert.rejects(() => client.templates.send('tmpl_1', { data: {} }), MaxclicksTimeoutError)
})

test('a keyless POST is not retried on 5xx', async () => {
  const { client, calls, sleeps } = makeClient(serverError)
  await assert.rejects(() => client.broadcasts.send('bc_1'), MaxclicksServerError)
  assert.equal(calls.length, 1)
  assert.equal(sleeps.length, 0)
})

test('a POST carrying an idempotency key is retried after a transport error, resending the key', async () => {
  const { client, calls } = makeClient((_call, index) => {
    if (index === 0) throw new Error('ECONNRESET')
    return { json: { data: { id: 'c1' } } }
  })
  await client.records.create('students', { email: 'a@b.com' }, { idempotencyKey: 'key-1' })
  assert.equal(calls.length, 2)
  assert.deepEqual(
    calls.map(call => call.headers['idempotency-key']),
    ['key-1', 'key-1']
  )
})

test('a POST carrying an idempotency key is retried on 5xx', async () => {
  const { client, calls } = makeClient([serverError, { json: { data: { emailId: 'em_1', status: 'sent' } } }])
  const result = await client.templates.send('tmpl_1', { data: {} }, { idempotencyKey: 'key-2' })
  assert.equal(calls.length, 2)
  assert.equal(result.emailId, 'em_1')
})

test('a keyless POST is still retried on 429, which the server answered before doing any work', async () => {
  const { client, calls } = makeClient([rateLimited, { json: { data: { id: 'c1' } } }])
  await client.records.upsert('students', { email: 'a@b.com' })
  assert.equal(calls.length, 2)
})

test('a keyless DELETE is not retried', async () => {
  const { client, calls } = makeClient(serverError)
  await assert.rejects(() => client.webhooks.delete('wh_1'), MaxclicksServerError)
  assert.equal(calls.length, 1)
})

test('a record deletion is retried on 5xx under the same generated attempt key', async () => {
  const deletion = { operationId: 'delete:records:abc', status: 'pending', canCancel: false, message: 'In progress.' }
  const { client, calls } = makeClient([serverError, { status: 202, json: { data: deletion } }])
  const result = await client.records.delete('students', 'c1')
  assert.deepEqual(result, deletion)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].headers['idempotency-key'], calls[0].headers['idempotency-key'])
})

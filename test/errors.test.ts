import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MaxclicksApiError,
  MaxclicksAuthenticationError,
  MaxclicksBadRequestError,
  MaxclicksConflictError,
  MaxclicksNotFoundError,
  MaxclicksPermissionError,
  MaxclicksRateLimitError,
  MaxclicksServerError,
  MaxclicksTimeoutError,
} from '../src/index'
import { makeClient } from './helpers'

const cases: [number, string, new (...args: never[]) => MaxclicksApiError][] = [
  [400, 'bad_input', MaxclicksBadRequestError],
  [401, 'invalid_api_key', MaxclicksAuthenticationError],
  [403, 'forbidden', MaxclicksPermissionError],
  [404, 'schema_not_found', MaxclicksNotFoundError],
  [409, 'identifier_conflict', MaxclicksConflictError],
]

for (const [status, code, ErrorClass] of cases) {
  test(`status ${status} maps to ${ErrorClass.name}`, async () => {
    const { client } = makeClient(
      {
        status,
        json: {
          error: { type: status >= 500 ? 'api_error' : 'invalid_request_error', code, message: `msg ${status}` },
        },
      },
      { maxRetries: 0 }
    )
    await assert.rejects(
      () => client.records.get('s', 'x'),
      (error: unknown) => {
        assert.ok(error instanceof ErrorClass, `expected ${ErrorClass.name}`)
        const apiError = error as MaxclicksApiError
        assert.equal(apiError.status, status)
        assert.equal(apiError.code, code)
        assert.equal(apiError.message, `msg ${status}`)
        return true
      }
    )
  })
}

test('5xx maps to MaxclicksServerError and retries up to maxRetries', async () => {
  const { client, calls } = makeClient(
    { status: 500, json: { error: { type: 'api_error', code: null, message: 'x' } } },
    { maxRetries: 2 }
  )
  await assert.rejects(() => client.records.get('s', 'x'), MaxclicksServerError)
  assert.equal(calls.length, 3)
})

test('429 then 200 succeeds after one retry', async () => {
  const { client, calls, sleeps } = makeClient([
    {
      status: 429,
      json: { error: { type: 'invalid_request_error', code: 'rate_limit_exceeded', message: 'slow down' } },
    },
    { json: { data: { id: 'c1' } } },
  ])
  const record = await client.records.get('s', 'c1')
  assert.equal((record as { id: string }).id, 'c1')
  assert.equal(calls.length, 2)
  assert.equal(sleeps.length, 1)
})

test('Retry-After (seconds) sets the retry delay', async () => {
  const { client, sleeps } = makeClient([
    {
      status: 429,
      headers: { 'retry-after': '2' },
      json: { error: { type: 'invalid_request_error', code: 'rate_limit_exceeded', message: 'slow' } },
    },
    { json: { data: { id: 'c1' } } },
  ])
  await client.records.get('s', 'c1')
  assert.deepEqual(sleeps, [2000])
})

test('RateLimitError exposes retryAfterMs when not retrying', async () => {
  const { client } = makeClient(
    {
      status: 429,
      headers: { 'retry-after': '5' },
      json: { error: { type: 'invalid_request_error', code: 'rate_limit_exceeded', message: 'slow' } },
    },
    { maxRetries: 0 }
  )
  await assert.rejects(
    () => client.records.get('s', 'x'),
    (error: unknown) => {
      assert.ok(error instanceof MaxclicksRateLimitError)
      assert.equal((error as MaxclicksRateLimitError).retryAfterMs, 5000)
      return true
    }
  )
})

test('a transport error is retried, then succeeds', async () => {
  let call = 0
  const { client } = makeClient(() => {
    call += 1
    if (call === 1) throw new Error('ECONNRESET')
    return { json: { data: { id: 'c1' } } }
  })
  const record = await client.records.get('s', 'c1')
  assert.equal((record as { id: string }).id, 'c1')
  assert.equal(call, 2)
})

test('an abort maps to MaxclicksTimeoutError', async () => {
  const { client } = makeClient(
    () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' })
    },
    { maxRetries: 0 }
  )
  await assert.rejects(() => client.records.get('s', 'x'), MaxclicksTimeoutError)
})

test('a plain-text error body (workflows) is parsed into the taxonomy', async () => {
  const { client } = makeClient(
    { status: 404, text: 'Workflow step is not found.', headers: { 'content-type': 'text/plain' } },
    { maxRetries: 0 }
  )
  await assert.rejects(
    () => client.workflows.trigger('ref', { a: 1 }),
    (error: unknown) => {
      assert.ok(error instanceof MaxclicksNotFoundError)
      assert.equal((error as MaxclicksNotFoundError).message, 'Workflow step is not found.')
      return true
    }
  )
})

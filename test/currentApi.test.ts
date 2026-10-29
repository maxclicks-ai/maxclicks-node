import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { EventStatus, FireResult, RecordDeletionStatus } from '../src/index'
import { makeClient } from './helpers'

const deletion: RecordDeletionStatus = {
  operationId: 'delete:records:0123',
  status: 'pending',
  canCancel: false,
  message: 'Record deletion is in progress.',
}

test('records.delete returns the deletion operation, not a deleted echo', async () => {
  const { client, calls } = makeClient({ status: 202, json: { data: deletion } })
  const result = await client.records.delete('students', 'con_1')
  assert.deepEqual(result, deletion)
  assert.equal(calls[0].method, 'DELETE')
  assert.match(calls[0].url, /\/schemas\/students\/records\/con_1$/)
})

test('records.getDeletion and records.cancelDeletion address the deletion operation', async () => {
  const { client, calls } = makeClient({ json: { data: deletion } })
  await client.records.getDeletion('delete:records:0123')
  await client.records.cancelDeletion('delete:records:0123')
  assert.deepEqual(
    calls.map(call => [call.method, new URL(call.url).pathname]),
    [
      ['GET', '/v1/record-deletions/delete%3Arecords%3A0123'],
      ['POST', '/v1/record-deletions/delete%3Arecords%3A0123/cancel'],
    ]
  )
})

test('events.fire returns the acceptance receipt and events.status reads readiness by its id', async () => {
  const receipt: FireResult = {
    accepted: 1,
    id: 'ev_1',
    eventId: 'order_1',
    isDuplicate: false,
    readinessAtAcceptance: 'pending',
  }
  const status: EventStatus = {
    id: 'ev_1',
    eventId: 'order_1',
    receivedAt: '2026-10-29T10:00:00.000Z',
    occurredAt: '2026-10-29T10:00:00.000Z',
    readyAt: null,
    readinessState: 'pending',
    definitionRevision: 'rev',
    contactId: 'con_1',
    objectId: null,
    data: { amount: 42 },
  }
  const { client, calls } = makeClient([{ status: 202, json: { data: receipt } }, { json: { data: status } }])
  const accepted = await client.events.fire('order-placed', { eventId: 'order_1', contactId: 'con_1', amount: 42 })
  const current = await client.events.status('order-placed', accepted.id)
  assert.equal(accepted.id, 'ev_1')
  assert.equal(current.readinessState, 'pending')
  assert.equal(new URL(calls[1].url).pathname, '/v1/events/order-placed/ev_1/status')
  assert.equal(JSON.parse(calls[0].body ?? '{}').contactId, 'con_1')
})

test('eventIdentities.identify posts the identity change as given', async () => {
  const input = {
    sourceId: 'source_website',
    subjectSchemaId: 'sch_1',
    anonymousId: 'visitor_1',
    contactId: 'con_1',
    operationId: 'e125aecb-8b4e-4c7e-8f08-8f768bced7ab',
    expectedAliasRevision: '0',
  }
  const { client, calls } = makeClient({
    json: { data: { identityRevision: '1', affectedSubjectIds: ['con_1'], isDuplicate: false } },
  })
  const result = await client.eventIdentities.identify(input)
  assert.equal(result.identityRevision, '1')
  assert.equal(calls[0].method, 'POST')
  assert.equal(new URL(calls[0].url).pathname, '/v1/event-identities')
  assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), input)
})

test('workflows.getRun pages back through history with history_before', async () => {
  const { client, calls } = makeClient({
    json: { data: { id: 'wfr_1', stepHistory: [], nextHistoryBeforeIndex: null } },
  })
  await client.workflows.getRun('wf_1', 'wfr_1')
  await client.workflows.getRun('wf_1', 'wfr_1', { historyBefore: 100 })
  assert.equal(new URL(calls[0].url).search, '')
  assert.equal(new URL(calls[1].url).searchParams.get('history_before'), '100')
})

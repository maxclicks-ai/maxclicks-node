import assert from 'node:assert/strict'
import { test } from 'node:test'
import { makeClient } from './helpers'

const page1 = {
  json: {
    data: [{ id: 'a' }, { id: 'b' }],
    pagination: { limit: 2, offset: 0, totalCount: 3, hasMore: true },
  },
}
const page2 = {
  json: {
    data: [{ id: 'c' }],
    pagination: { limit: 2, offset: 2, totalCount: 3, hasMore: false },
  },
}

test('a Page exposes this page plus its pagination metadata', async () => {
  const { client } = makeClient(page1)
  const page = await client.records.list('students', { limit: 2 })
  assert.deepEqual(
    page.data.map(r => (r as { id: string }).id),
    ['a', 'b']
  )
  assert.equal(page.pagination.totalCount, 3)
  assert.equal(page.hasNextPage(), true)
})

test('auto-iteration walks every item across pages', async () => {
  const { client, calls } = makeClient([page1, page2])
  const ids: string[] = []
  for await (const record of await client.records.list('students', { limit: 2 })) {
    ids.push((record as { id: string }).id)
  }
  assert.deepEqual(ids, ['a', 'b', 'c'])
  assert.equal(calls.length, 2)
  const secondUrl = new URL(calls[1].url)
  assert.equal(secondUrl.searchParams.get('offset'), '2')
})

test('.all() collects every item', async () => {
  const { client } = makeClient([page1, page2])
  const all = await (await client.records.list('students', { limit: 2 })).all()
  assert.equal(all.length, 3)
})

test('the last page reports no next page', async () => {
  const { client } = makeClient(page2)
  const page = await client.records.list('students', { limit: 2, offset: 2 })
  assert.equal(page.hasNextPage(), false)
})

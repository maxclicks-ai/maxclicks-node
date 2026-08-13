import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { VERSION } from '../src/index'

const rootUrl = new URL('../', import.meta.url)

test('VERSION matches the version in package.json', () => {
  const packageVersion = JSON.parse(readFileSync(fileURLToPath(new URL('package.json', rootUrl)), 'utf8')).version
  assert.equal(
    VERSION,
    packageVersion,
    'src/version.ts drifted from package.json; run `node scripts/sync-version.js`. VERSION is sent as the User-Agent of every request.'
  )
})

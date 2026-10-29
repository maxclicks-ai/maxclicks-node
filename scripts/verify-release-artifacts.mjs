import assert from 'node:assert/strict'
import { execFile, execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { promisify } from 'node:util'

// Run from a source checkout. Only npm package downloads and a loopback fixture
// server are used. No real workspace credentials, API calls, or model calls.
const [artifactArgument, snippetsArgument] = process.argv.slice(2)
if (!artifactArgument)
  throw new Error('Usage: node scripts/verify-release-artifacts.mjs <artifact-directory> [developer-platform.ts]')
const artifacts = resolve(artifactArgument)
const consumer = mkdtempSync(join(tmpdir(), 'maxclicks-release-consumer-'))
const names = ['maxclicks', '@maxclicks/browser', 'maxclicks-cli', 'maxclicks-mcp']
const packed = new Map()
for (const name of readdirSync(artifacts).filter(name => name.endsWith('.tgz'))) {
  const path = join(artifacts, name)
  const manifest = JSON.parse(execFileSync('tar', ['-xOf', path, 'package/package.json'], { encoding: 'utf8' }))
  if (!names.includes(manifest.name)) continue
  assert.ok(!packed.has(manifest.name), `More than one artifact for ${manifest.name}`)
  for (const dependency of Object.values(manifest.dependencies ?? {})) {
    assert.ok(!/^(file:|link:|workspace:)/.test(dependency), `${manifest.name} contains a local dependency`)
  }
  const entries = execFileSync('tar', ['-tzf', path], { encoding: 'utf8' }).split('\n')
  assert.ok(
    !entries.some(name => /(^|\/)\.env(?:\.|$)|\.tgz$|\/node_modules\//.test(name)),
    'Unexpected private/dependency files in tarball'
  )
  packed.set(manifest.name, {
    path,
    version: manifest.version,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
  })
}
for (const name of names) assert.ok(packed.has(name), `Missing artifact: ${name}`)
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }) + '\n')
execFileSync(
  'npm',
  [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--save-exact',
    ...Array.from(packed.values(), artifact => artifact.path),
    'typescript@5.9.3',
    '@types/node@22.20.0',
  ],
  { cwd: consumer, stdio: 'inherit' }
)
for (const name of names) {
  const manifest = JSON.parse(readFileSync(join(consumer, 'node_modules', name, 'package.json'), 'utf8'))
  assert.equal(manifest.version, packed.get(name).version)
}

const nodeTypes = `import { Maxclicks } from 'maxclicks'
const mc = new Maxclicks({ apiKey: process.env.MAXCLICKS_API_KEY })
await mc.records.upsert('customers', { userId: 'customer_42', email: 'nadia@example.com', firstName: 'Nadia' }, { idempotencyKey: 'signup:customer_42' })
const email = await mc.templates.send('YOUR_TEMPLATE_ID', { data: { contact: { email: 'nadia@example.com' } } }, { idempotencyKey: 'welcome:customer_42' })
if (email.status === 'failed') throw new Error(email.error ?? 'Send failed')
`
const browserTypes = `import { createClient } from '@maxclicks/browser'
const analytics = createClient<{ product_viewed: { product_id: string } }>({
  endpoint: 'https://YOUR_DEPLOYED_COLLECTOR', sourceId: 'YOUR_BROWSER_SOURCE_ID',
  writeKey: 'YOUR_PUBLIC_BROWSER_SOURCE_KEY', consent: 'pending',
  identify: async (identity, signal) => {
    const response = await fetch('/api/analytics/identify', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(identity), signal,
    })
    if (!response.ok) throw new Error('Identity link failed')
  },
})
await analytics.setConsent('granted')
await analytics.identify({ subjectSchemaId: 'YOUR_CONTACT_SCHEMA_ID' })
await analytics.track('product_viewed', { product_id: 'ridge-01' })
`
const snippets = snippetsArgument ? readFileSync(resolve(snippetsArgument), 'utf8') : null
for (const [id, fallback] of [
  ['node', nodeTypes],
  ['browser', browserTypes],
]) {
  const code = snippets?.match(new RegExp("id: '" + id + "',[\\s\\S]*?code: `([\\s\\S]*?)`,"))?.[1]
  if (snippets) assert.ok(code, `Could not read ${id} example from landing content`)
  writeFileSync(join(consumer, `${id}.mts`), code ?? fallback)
}
writeFileSync(
  join(consumer, 'commonjs.cts'),
  `import Node = require('maxclicks')
import Browser = require('@maxclicks/browser')
const mc = new Node.Maxclicks({ apiKey: 'fixture-key' })
void mc.records.upsert('customers', { email: 'test@example.com' }, { idempotencyKey: 'fixture' })
const analytics = Browser.createClient<{ view: { id: string } }>({ endpoint: 'https://example.invalid', sourceId: 'test', writeKey: 'test', consent: 'pending' })
void analytics.track('view', { id: 'fixture' })
`
)
execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    '--noEmit',
    '--strict',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--lib',
    'ES2022,DOM',
    '--types',
    'node',
    'node.mts',
    'browser.mts',
    'commonjs.cts',
  ],
  { cwd: consumer, stdio: 'inherit' }
)
execFileSync(
  process.execPath,
  [
    '--input-type=module',
    '-e',
    `
  import assert from 'node:assert/strict';
  import { Maxclicks } from 'maxclicks';
  import { createClient } from '@maxclicks/browser';
  import { createRequire } from 'node:module';
  const require = createRequire(import.meta.url);
  assert.equal(typeof require('maxclicks').Maxclicks, 'function');
  assert.equal(typeof require('@maxclicks/browser').createClient, 'function');
  assert.equal(typeof createClient, 'function');
  const calls = [];
  const mc = new Maxclicks({ apiKey: 'fixture-key', fetch: async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ data: url.endsWith('/send') ? { emailId: 'fixture', status: 'sent', error: null } : { id: 'fixture' } }), { headers: { 'content-type': 'application/json' } });
  }});
  await mc.records.upsert('customers', { email: 'fixture@example.com' }, { idempotencyKey: 'fixture-upsert' });
  const result = await mc.templates.send('fixture-template', { data: { contact: { email: 'fixture@example.com' } } }, { idempotencyKey: 'fixture-send' });
  assert.equal(result.status, 'sent');
  assert.equal(calls.length, 2);
  assert.equal(new Headers(calls[0].init.headers).get('idempotency-key'), 'fixture-upsert');
  assert.equal(new Headers(calls[1].init.headers).get('idempotency-key'), 'fixture-send');
`,
  ],
  { cwd: consumer, stdio: 'inherit' }
)

const whoami = {
  apiKey: { id: 'fixture-key', name: 'fixture', keyDisplay: 'fixture', createdAt: '2026-01-01T00:00:00Z' },
  user: { id: 'fixture-user', email: 'fixture@example.com', name: 'Fixture' },
  space: null,
  role: null,
  oauth: null,
}
const sendOutcomes = {
  'fixture-failed': { emailId: 'fixture-email-failed', status: 'failed', error: 'Fixture send failure' },
  'fixture-sent': { emailId: 'fixture-email-sent', status: 'sent', error: null },
}
const requests = []
const fixture = createServer((request, response) => {
  const recorded = {
    method: request.method,
    path: request.url,
    authorization: request.headers.authorization,
    idempotencyKey: request.headers['idempotency-key'] ?? null,
  }
  requests.push(recorded)
  response.setHeader('content-type', 'application/json')
  if (request.headers.authorization === 'Bearer fixture-key') {
    if (request.method === 'GET' && request.url === '/v1/me') {
      response.end(JSON.stringify({ data: whoami }))
      return
    }
    const templateId = /^\/v1\/templates\/(fixture-failed|fixture-sent)\/send$/.exec(request.url)?.[1]
    // The API refuses a template send without an Idempotency-Key, so the fixture does too.
    if (request.method === 'POST' && templateId && recorded.idempotencyKey) {
      let body = ''
      request.on('data', chunk => {
        body += chunk
      })
      request.on('end', () => {
        recorded.body = JSON.parse(body)
        response.end(JSON.stringify({ data: sendOutcomes[templateId] }))
      })
      return
    }
  }
  response.writeHead(400).end(JSON.stringify({ error: { message: 'Unexpected fixture request' } }))
})
fixture.listen(0, '127.0.0.1')
await once(fixture, 'listening')
const baseUrl = `http://127.0.0.1:${fixture.address().port}/v1`
// The preload rejects network requests outside the fixture, even if a CLI or
// MCP regression ignores the configured base URL.
const guard = join(consumer, 'fixture-only.mjs')
writeFileSync(
  guard,
  `const originalFetch = globalThis.fetch; globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.origin !== ${JSON.stringify(new URL(baseUrl).origin)}) throw new Error('Non-fixture request blocked');
  return originalFetch(input, init);
};\n`
)
const env = {
  PATH: process.env.PATH,
  MAXCLICKS_API_KEY: 'fixture-key',
  MAXCLICKS_BASE_URL: baseUrl,
  XDG_CONFIG_HOME: join(consumer, 'config'),
  NODE_OPTIONS: `--import=${guard}`,
}
const run = promisify(execFile)
let mcp
try {
  const cli = join(consumer, 'node_modules/.bin/maxclicks')
  const help = await run(cli, ['--help'], { cwd: consumer, env, timeout: 10_000 })
  assert.match(help.stdout, /whoami/)
  const version = await run(cli, ['--version'], { cwd: consumer, env, timeout: 10_000 })
  assert.equal(version.stdout.trim(), packed.get('maxclicks-cli').version)
  const identity = await run(cli, ['whoami'], { cwd: consumer, env, timeout: 10_000 })
  assert.deepEqual(JSON.parse(identity.stdout), whoami)
  const sendData = { contact: { email: 'fixture@example.com' } }
  for (const [templateId, outcome] of Object.entries(sendOutcomes)) {
    const result = await run(cli, ['templates', 'send', templateId, '--data', JSON.stringify(sendData)], {
      cwd: consumer,
      env,
      timeout: 10_000,
    }).then(
      result => ({ ...result, code: 0 }),
      error => error
    )
    assert.equal(result.code, outcome.status === 'failed' ? 1 : 0, `CLI ${outcome.status} send exit status`)
    const { idempotencyKey, ...printed } = JSON.parse(result.stdout)
    assert.deepEqual(printed, { templateId, ...outcome })
    assert.equal(idempotencyKey, requests.at(-1).idempotencyKey, 'CLI prints the key it sent')
    assert.equal(result.stderr, '')
  }
  const noKey = await run(join(consumer, 'node_modules/.bin/maxclicks-mcp'), [], {
    cwd: consumer,
    env: { ...env, MAXCLICKS_API_KEY: '' },
    timeout: 10_000,
  }).then(
    () => null,
    error => error
  )
  assert.equal(noKey?.code, 1)
  assert.match(noKey.stderr, /MAXCLICKS_API_KEY is required/)
  assert.equal(noKey.stdout, '')

  mcp = spawn(join(consumer, 'node_modules/.bin/maxclicks-mcp'), [], {
    cwd: consumer,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const pending = new Map()
  const messages = []
  let stderr = ''
  mcp.stderr.on('data', chunk => {
    stderr += chunk
  })
  const lines = createInterface({ input: mcp.stdout })
  lines.on('line', line => {
    try {
      const message = JSON.parse(line)
      messages.push(message)
      pending.get(message.id)?.(message)
    } catch {
      messages.push({ invalidStdout: line })
    }
  })
  const request = (id, method, params) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`${method} timed out: ${stderr}`))
      }, 10_000)
      pending.set(id, message => {
        clearTimeout(timeout)
        pending.delete(id)
        resolve(message)
      })
      mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    })
  const initialized = await request(1, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'release-fixture', version: '1.0.0' },
  })
  assert.equal(initialized.result.serverInfo.name, 'maxclicks-mcp')
  assert.equal(initialized.result.serverInfo.version, packed.get('maxclicks-mcp').version)
  mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
  const catalog = await request(2, 'tools/list', {})
  for (const name of ['whoami', 'list_schemas', 'list_records', 'send_template'])
    assert.ok(
      catalog.result.tools.some(tool => tool.name === name),
      `Missing MCP tool ${name}`
    )
  const identityTool = await request(3, 'tools/call', { name: 'whoami', arguments: {} })
  assert.ok(!identityTool.result.isError)
  assert.deepEqual(JSON.parse(identityTool.result.content[0].text), whoami)
  assert.ok(
    messages.every(message => message.jsonrpc === '2.0'),
    'MCP wrote non-protocol data to stdout'
  )
  assert.match(stderr, /MCP \(stdio\) ready/)
  assert.equal(requests.length, 5, 'Only the three identity reads and two CLI template fixtures may hit the fixture')
  for (const request of requests.filter(request => request.method === 'POST')) {
    assert.deepEqual(request.body, { data: sendData })
  }
  const report = {
    consumer,
    snippets: snippetsArgument ? resolve(snippetsArgument) : 'embedded examples',
    artifacts: Object.fromEntries(packed),
    tools: catalog.result.tools.length,
    fixtureRequests: requests,
    checks: [
      'tarball content and dependencies',
      'install without lifecycle scripts',
      'ESM and CommonJS exports',
      'Node and browser snippet declarations',
      'Node mocked records/templates idempotency',
      'CLI help/version/whoami',
      'CLI sent/failed template outcomes, exit statuses and required idempotency key',
      'MCP missing-key error',
      'MCP stdio initialize/tools/list/whoami',
    ],
  }
  writeFileSync(join(artifacts, 'verification.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  if (mcp && mcp.exitCode === null) {
    const stopped = once(mcp, 'exit')
    mcp.kill('SIGTERM')
    await stopped
  }
  fixture.closeAllConnections()
  await new Promise(resolve => fixture.close(resolve))
}

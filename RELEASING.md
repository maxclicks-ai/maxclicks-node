# Releasing the developer packages

Four npm packages ship together: `maxclicks` (this client), `@maxclicks/browser`, `maxclicks-cli` and `maxclicks-mcp`. The CLI and the MCP server depend on `maxclicks`, so the client is always published first.

## Build the artifacts

Work from sibling checkouts. Use Node 24.12+ for the browser build tools. `npm pack` rebuilds the current source, so a previous `dist` or `build` directory is not required.

```sh
mkdir -p /tmp/maxclicks-release-artifacts

cd maxclicks-node
npm ci --ignore-scripts
npm run check
npm test
npm pack --pack-destination /tmp/maxclicks-release-artifacts

cd ../maxclicks-browser
npm ci --ignore-scripts
npx playwright install chromium firefox webkit
npm run check
npm run lint
npm test
npm pack --pack-destination /tmp/maxclicks-release-artifacts

cd ../maxclicks-cli
npm run sdk:link
npm run check
npm pack --pack-destination /tmp/maxclicks-release-artifacts

cd ../maxclicks-mcp
npm run sdk:link
npm run check
npm pack --pack-destination /tmp/maxclicks-release-artifacts
```

On Linux, use `npx playwright install --with-deps chromium firefox webkit` when the browser system libraries also need installation. On macOS, Playwright's Firefox exits with `Could not find profile folder.` when the app that launched it may not read `~/Library/Application Support/Firefox`; run the Firefox project from a terminal that has that access, or in CI.

`sdk:link` packs the sibling client and installs that tarball plus the package's own dependencies with `--no-save --package-lock=false`, so the CLI and MCP are checked against the client being released. Their manifests keep a registry range (`maxclicks@^1.1.0`) and never a local tarball reference.

## Verify the consumer artifacts

From the parent directory of all four packages:

```sh
node maxclicks-node/scripts/verify-release-artifacts.mjs \
  /tmp/maxclicks-release-artifacts \
  ops/landing/src/content/developer-platform.ts
```

The optional final argument reads the landing page's browser and Node snippets. Without it, the verifier uses equivalent embedded examples. It creates an isolated consumer, installs all four tarballs and a pinned TypeScript compiler, then checks:

- No local dependency references, environment files, bundled tarballs, or `node_modules` in the artifacts.
- ESM/CommonJS imports and declarations for `Maxclicks` and `createClient`.
- Browser/Node example types and Node record/template idempotency headers using an in-memory fetch fixture.
- Installed CLI help, version, `whoami`, and template send outcomes against a loopback fixture, including the generated idempotency key, failure JSON and exit code 1 for `status: 'failed'`.
- Installed MCP missing-key failure and stdio initialization, tool discovery, and `whoami` against the same fixture.

The CLI/MCP child processes receive only a fixture credential and URL. A fetch guard rejects every non-fixture request. No real API, email, event, or model call is made. The script writes `verification.json` alongside the tarballs with SHA-256 hashes and the fresh consumer path.

## Publish

Publish the verified tarballs themselves, so the registry receives exactly what was checked. Publishing a tarball skips the lifecycle scripts, which already ran when it was packed and verified.

1. `npm publish /tmp/maxclicks-release-artifacts/maxclicks-<version>.tgz`
2. In `maxclicks-cli` and `maxclicks-mcp`, record the published client's registry URL and integrity with `npm install --package-lock-only --ignore-scripts`, review the lockfile diff, confirm `npm ci` installs from the registry, commit, and pack again.
3. Publish the CLI, MCP and browser tarballs.

The publishing credential comes from the environment through a user config that names it (`//registry.npmjs.org/:_authToken=${NPM_TOKEN}`), never from a file in a checkout. Revoke a one-time token once the release is out.

## After publishing

Download the published tarballs with `npm pack <name>@<version>` into an empty directory and run the verifier against them, then install each package from the registry into a clean project and make one real read (`maxclicks whoami`, or `new Maxclicks({ apiKey }).me()`) with a development workspace's key. Local fixture checks do not establish workspace permissions, collector routing, hosted MCP reachability or delivery.

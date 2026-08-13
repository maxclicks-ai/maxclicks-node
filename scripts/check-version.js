/**
 * Fails when `src/version.ts` and `package.json` disagree.
 *
 * VERSION is stamped into the `User-Agent` and `X-Maxclicks-Client` headers of
 * every request, so a build whose VERSION drifted from the published version
 * reports a release that does not exist. This runs as part of `prepublishOnly`;
 * `npm test` asserts the same thing.
 *
 * Prerelease publishes (`npm run publish:canary`, `npm run publish:dev`) set the
 * package version in CI, so those workflows run `scripts/sync-version.js` first.
 *
 * Usage: `node scripts/check-version.js`
 */

import { readFileSync } from 'fs'

const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version
const source = readFileSync('src/version.ts', 'utf8')
const match = /export const VERSION = '([^']*)'/.exec(source)

if (!match) {
  console.error('Error: could not find an exported VERSION in src/version.ts.')
  process.exit(1)
}

if (match[1] !== packageVersion) {
  console.error(`Error: version mismatch. package.json is "${packageVersion}", src/version.ts is "${match[1]}".`)
  console.error('Run `node scripts/sync-version.js` to stamp the package version into src/version.ts.')
  process.exit(1)
}

console.log(`Version check passed: ${packageVersion}`)

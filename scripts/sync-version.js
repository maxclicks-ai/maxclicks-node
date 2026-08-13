/**
 * Rewrites `src/version.ts` with the version currently in `package.json`.
 *
 * The canary and dev workflows pick their version in CI (`npm version
 * <base>-canary.N`), so without this step the published bundle would advertise
 * the previous stable version in its `User-Agent`.
 *
 * Usage: `node scripts/sync-version.js`
 */

import { readFileSync, writeFileSync } from 'fs'

const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version
const path = 'src/version.ts'
const source = readFileSync(path, 'utf8')
const updated = source.replace(/export const VERSION = '[^']*'/, `export const VERSION = '${packageVersion}'`)

if (updated === source && !source.includes(`export const VERSION = '${packageVersion}'`)) {
  console.error(`Error: could not find an exported VERSION in ${path}.`)
  process.exit(1)
}

writeFileSync(path, updated)
console.log(`Stamped ${packageVersion} into ${path}.`)

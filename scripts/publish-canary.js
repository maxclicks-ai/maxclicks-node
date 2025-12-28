/**
 * Triggers canary version publish via GitHub Actions.
 *
 * Flow:
 * 1. Force-pushes the "canary" tag to origin
 * 2. GitHub Actions workflow detects the tag and runs
 * 3. Publishes {version}-canary.{N} to npm with "canary" tag
 *
 * Usage: `npm run publish:canary`
 *
 * Prerequisites:
 * - Git configured with push access to origin
 *
 * After publishing, install in your other project:
 *   `npm install <package-name>@canary`
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const { name: packageName, repository } = JSON.parse(readFileSync('package.json', 'utf8'))
const repoUrl = repository?.url?.replace(/^\.git$|\.git$/, '') || repository

console.log('Publishing canary version via GitHub Actions...\n')

try {
  execSync('git tag canary -f', { stdio: 'inherit' })
  execSync('git push origin canary -f', { stdio: 'inherit' })
  console.log('\n✓ Canary tag pushed! Workflow triggered.')
  console.log('\nWatch progress:')
  console.log('  gh run watch')
  console.log(`  ${repoUrl}/actions`)
  console.log('\nAfter completion, install with:')
  console.log(`  npm install ${packageName}@canary`)
} catch {
  console.error('\nFailed to push canary tag.')
  console.error('Make sure you have push access to the repository.')
  process.exit(1)
}

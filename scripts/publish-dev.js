/**
 * Triggers dev version publish via GitHub Actions.
 *
 * Flow:
 * 1. Uses GitHub CLI to trigger the publish-dev workflow
 * 2. Workflow runs on GitHub Actions (uses NPM_TOKEN from secrets)
 * 3. Publishes {version}-dev.{timestamp} to npm with "dev" tag
 *
 * Usage: `npm run publish:dev`
 *
 * Prerequisites:
 * - GitHub CLI installed: https://cli.github.com
 * - Authenticated: `gh auth login`
 *
 * After publishing, install in your other project:
 *   `npm install <package-name>@dev`
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const { name: packageName, repository } = JSON.parse(readFileSync('package.json', 'utf8'))
const repoUrl = repository?.url?.replace(/^\.git$|\.git$/, '') || repository

console.log('Triggering dev publish workflow on GitHub Actions...\n')

try {
  execSync('gh workflow run publish-dev.yml', { stdio: 'inherit' })
  console.log('\n✓ Workflow triggered!')
  console.log('\nWatch progress:')
  console.log('  gh run watch')
  console.log(`  ${repoUrl}/actions`)
  console.log('\nAfter completion, install with:')
  console.log(`  npm install ${packageName}@dev`)
} catch {
  console.error('\nFailed to trigger workflow.')
  console.error('Make sure GitHub CLI is installed and authenticated:')
  console.error('  https://cli.github.com')
  console.error('  gh auth login')
  process.exit(1)
}

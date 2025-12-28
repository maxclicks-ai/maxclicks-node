/**
 * Creates and pushes a git tag for stable release.
 *
 * Flow:
 * 1. Reads version from package.json (must be clean semver like "1.2.0")
 * 2. Creates git tag "v1.2.0"
 * 3. Pushes tag to origin
 * 4. GitHub Actions workflow handles npm publish
 *
 * Usage: `npm run publish:stable`
 *
 * Prerequisites:
 * - Version in package.json should be the stable version (no `-dev` or `-canary` suffix)
 * - All changes should be committed
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { createInterface } from 'readline'

const { name: packageName, version, repository } = JSON.parse(readFileSync('package.json', 'utf8'))
const repoUrl = repository?.url?.replace(/^\.git$|\.git$/, '') || repository

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

void (async function () {
  // Validate version is clean semver (no prerelease)
  if (version.includes('-')) {
    console.error(`Error: Version "${version}" contains prerelease suffix.`)
    console.error('Update package.json to stable version first (e.g., "1.2.0").')
    process.exit(1)
  }

  const tag = `v${version}`

  // Check for uncommitted changes
  try {
    execSync('git diff-index --quiet HEAD --')
  } catch {
    console.error('Error: You have uncommitted changes. Commit or stash them first.')
    process.exit(1)
  }

  console.log(`This will:`)
  console.log(`  1. Create git tag: ${tag}`)
  console.log(`  2. Push tag to origin`)
  console.log(`  3. Trigger GitHub Actions to publish ${packageName}@${version} to npm`)
  console.log()

  const confirm = await prompt('Continue? (yes/no): ')
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Cancelled.')
    return
  }

  execSync(`git tag ${tag}`, { stdio: 'inherit' })
  execSync(`git push origin ${tag}`, { stdio: 'inherit' })

  console.log(`\n✓ Tag ${tag} pushed. GitHub Actions will publish to npm.`)
  console.log(`  Watch progress: ${repoUrl}/actions`)
})()

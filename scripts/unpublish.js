/**
 * Triggers version unpublish via GitHub Actions.
 *
 * Usage:
 *   `npm run unpublish`                    # Lists dev versions (default), prompts for selection
 *   `npm run unpublish -- --canary`        # Lists canary versions
 *   `npm run unpublish -- --stable`        # Lists stable versions (requires extra confirmation)
 *   `npm run unpublish -- 1.2.0-dev.xxx`   # Unpublish specific version directly
 *   `npm run unpublish -- --all`           # Unpublish ALL dev versions
 *   `npm run unpublish -- --all --canary`  # Unpublish ALL canary versions
 *
 * Prerequisites:
 * - GitHub CLI installed: https://cli.github.com
 * - Authenticated: `gh auth login`
 *
 * Note: npm only allows unpublishing within 72 hours of publish.
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { createInterface } from 'readline'

const { name: packageName, repository } = JSON.parse(readFileSync('package.json', 'utf8'))
const repoUrl = repository?.url?.replace(/^\.git$|\.git$/, '') || repository

const args = process.argv.slice(2)
const isCanary = args.includes('--canary')
const isStable = args.includes('--stable')
const isAll = args.includes('--all')
const versionArg = args.find(a => !a.startsWith('--'))

const versionType = isStable ? 'stable' : isCanary ? 'canary' : 'dev'

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function getVersions(type) {
  try {
    const result = execSync(`npm view ${packageName} versions --json`, { encoding: 'utf8' })
    const versions = JSON.parse(result)
    const list = Array.isArray(versions) ? versions : [versions]

    if (type === 'dev') return list.filter(v => v.includes('-dev.'))
    if (type === 'canary') return list.filter(v => v.includes('-canary.'))
    // stable = no prerelease suffix
    return list.filter(v => !v.includes('-'))
  } catch {
    return []
  }
}

function deleteGitHubRelease(version) {
  const tag = `v${version}`
  console.log(`Deleting GitHub release: ${tag}`)
  try {
    execSync(`gh release delete ${tag} --yes --cleanup-tag`, { stdio: 'inherit' })
    console.log(`✓ GitHub release ${tag} deleted`)
    return true
  } catch {
    console.error(`✗ Failed to delete GitHub release ${tag}`)
    return false
  }
}

function triggerUnpublish(version, type) {
  console.log(`\nTriggering unpublish workflow for: ${version}`)
  execSync(`gh workflow run unpublish.yml -f version=${version} -f type=${type}`, { stdio: 'inherit' })
  console.log('\n✓ Workflow triggered!')
  console.log('\nWatch progress:')
  console.log('  gh run watch')
  console.log(`  ${repoUrl}/actions`)
}

void (async function () {
  // Extra confirmation for stable versions
  if (isStable) {
    console.log('\n⚠️  WARNING: You are about to unpublish STABLE versions!')
    console.log('This can break production applications depending on this package.\n')
    const confirm = await prompt('Type "I understand" to continue: ')
    if (confirm !== 'I understand') {
      console.log('Cancelled.')
      return
    }
  }

  // Unpublish all of a type
  if (isAll) {
    const confirm = await prompt(`Unpublish ALL ${versionType} versions? (yes/no): `)
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.')
      return
    }

    // For stable versions, delete all GitHub releases first
    if (isStable) {
      const versions = getVersions('stable')
      console.log('\nDeleting GitHub releases first...')
      for (const v of versions) {
        if (!deleteGitHubRelease(v)) {
          console.error(`\nStopping: Failed to delete GitHub release for ${v}`)
          console.error('Fix the issue and try again.')
          return
        }
      }
      console.log()
    }

    triggerUnpublish('all', versionType)
    return
  }

  // Unpublish specific version
  if (versionArg) {
    // For stable versions, delete GitHub release first
    if (isStable || !versionArg.includes('-')) {
      if (!deleteGitHubRelease(versionArg)) {
        console.error('\nAborting: Fix the GitHub release issue first.')
        return
      }
    }
    triggerUnpublish(versionArg, versionType)
    return
  }

  // Interactive mode - list versions first
  const versions = getVersions(versionType)

  if (versions.length === 0) {
    console.log(`No ${versionType} versions found on npm.`)
    return
  }

  console.log(`${versionType.charAt(0).toUpperCase() + versionType.slice(1)} versions on npm:`)
  versions.forEach((v, i) => console.log(`  ${i + 1}. ${v}`))
  console.log()

  const answer = await prompt('Enter number to unpublish (or "all" or "cancel"): ')

  if (answer.toLowerCase() === 'cancel') {
    console.log('Cancelled.')
    return
  }

  if (answer.toLowerCase() === 'all') {
    // For stable versions, delete all GitHub releases first
    if (isStable) {
      console.log('\nDeleting GitHub releases first...')
      for (const v of versions) {
        if (!deleteGitHubRelease(v)) {
          console.error(`\nStopping: Failed to delete GitHub release for ${v}`)
          console.error('Fix the issue and try again.')
          return
        }
      }
      console.log()
    }
    triggerUnpublish('all', versionType)
    return
  }

  const index = parseInt(answer, 10) - 1
  if (isNaN(index) || index < 0 || index >= versions.length) {
    console.log('Invalid selection.')
    return
  }

  const selectedVersion = versions[index]

  // For stable versions, delete GitHub release first
  if (isStable) {
    if (!deleteGitHubRelease(selectedVersion)) {
      console.error('\nAborting: Fix the GitHub release issue first.')
      return
    }
  }

  triggerUnpublish(selectedVersion, versionType)
})().catch(() => {
  console.error('\nFailed to trigger workflow.')
  console.error('Make sure GitHub CLI is installed and authenticated:')
  console.error('  https://cli.github.com')
  console.error('  gh auth login')
  process.exit(1)
})

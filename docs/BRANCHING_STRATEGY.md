# Git Branching Strategy for Maxclicks Node.js SDK

## Branch Structure

We use a **Git Flow** inspired strategy optimized for SDK development and npm publishing.

### Main Branches

#### `main`
- **Purpose:** Production-ready code
- **Protection:** Protected, requires PR and reviews
- **Publishes to:** npm with `@latest` tag
- **Versioning:** Stable releases only (1.0.0, 1.1.0, 2.0.0)
- **Never commit directly to this branch**

#### `canary`
- **Purpose:** Pre-release testing and integration
- **Protection:** Protected, requires PR
- **Publishes to:** npm with `@canary` tag
- **Versioning:** Pre-release versions (1.0.0-canary.1, 1.1.0-canary.2)
- **Automatically published on merge**

#### `develop`
- **Purpose:** Active development and feature integration
- **Protection:** Optional protection
- **Publishes to:** npm with `@dev` tag (optional)
- **Versioning:** Development versions (1.0.0-dev.1)
- **Daily integration point for features**

### Supporting Branches

#### Feature Branches (`feature/*`)
- **Naming:** `feature/add-webhooks`, `feature/improve-error-handling`
- **Branch from:** `develop`
- **Merge to:** `develop`
- **Lifetime:** Temporary (deleted after merge)
- **Example:**
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/add-retry-logic
  # ... work on feature ...
  git push origin feature/add-retry-logic
  # Create PR to develop
  ```

#### Bugfix Branches (`bugfix/*`)
- **Naming:** `bugfix/fix-template-validation`, `bugfix/contact-update-error`
- **Branch from:** `develop`
- **Merge to:** `develop`
- **Lifetime:** Temporary (deleted after merge)

#### Hotfix Branches (`hotfix/*`)
- **Naming:** `hotfix/1.0.1-critical-security-fix`
- **Branch from:** `main`
- **Merge to:** `main` AND `develop`
- **Lifetime:** Temporary (deleted after merge)
- **Purpose:** Critical production fixes
- **Example:**
  ```bash
  git checkout main
  git pull origin main
  git checkout -b hotfix/1.0.1-security-patch
  # ... fix the issue ...
  # Update version to 1.0.1
  git push origin hotfix/1.0.1-security-patch
  # Create PR to main
  # After merge to main, also merge to develop
  ```

#### Release Branches (`release/*`)
- **Naming:** `release/1.1.0`
- **Branch from:** `develop`
- **Merge to:** `canary` first, then `main`
- **Lifetime:** Temporary (deleted after merge to main)
- **Purpose:** Prepare for production release
- **Example:**
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b release/1.1.0
  # Update version in package.json
  # Update CHANGELOG.md
  # Final testing
  git push origin release/1.1.0
  # Create PR to canary first
  # After testing, create PR to main
  ```

## Version Tagging Strategy

### Semantic Versioning (SemVer)

We follow [Semantic Versioning 2.0.0](https://semver.org/):

**Format:** `MAJOR.MINOR.PATCH[-PRERELEASE]`

- **MAJOR:** Breaking changes (2.0.0)
- **MINOR:** New features, backwards compatible (1.1.0)
- **PATCH:** Bug fixes, backwards compatible (1.0.1)
- **PRERELEASE:** Pre-release identifier (1.1.0-canary.1)

### Tag Types

#### Production Tags (`v*`)
```bash
# Stable releases on main branch
v1.0.0
v1.1.0
v1.2.0
v2.0.0
```

#### Canary Tags (`v*-canary.*`)
```bash
# Pre-release versions on canary branch
v1.1.0-canary.1
v1.1.0-canary.2
v1.1.0-canary.3
```

#### Dev Tags (`v*-dev.*`)
```bash
# Development versions on develop branch (optional)
v1.1.0-dev.1
v1.1.0-dev.2
```

#### Beta/RC Tags (for major releases)
```bash
v2.0.0-beta.1
v2.0.0-rc.1
```

## Workflow Examples

### 1. Regular Feature Development

```bash
# 1. Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/add-batch-delete

# 2. Work on the feature
# ... make changes ...
git add .
git commit -m "feat: add batch delete for contacts"
git push origin feature/add-batch-delete

# 3. Create PR to develop
# 4. After review and merge, delete the branch
git checkout develop
git pull origin develop
git branch -d feature/add-batch-delete
```

### 2. Canary Release (Pre-release Testing)

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.1.0

# 2. Update version to canary
npm version 1.1.0-canary.1 --no-git-tag-version
# Update CHANGELOG.md

# 3. Commit and push
git add package.json CHANGELOG.md
git commit -m "chore: prepare 1.1.0-canary.1 release"
git push origin release/1.1.0

# 4. Create PR to canary branch
# 5. After merge, CI publishes to npm with @canary tag

# 6. Tag the canary release
git checkout canary
git pull origin canary
git tag v1.1.0-canary.1
git push origin v1.1.0-canary.1

# 7. Test the canary release
npm install maxclicks@canary

# 8. If issues found, fix in release branch and create canary.2
# 9. If stable, proceed to production release
```

### 3. Production Release

```bash
# 1. After successful canary testing
git checkout release/1.1.0

# 2. Update version to stable
npm version 1.1.0 --no-git-tag-version
# Update CHANGELOG.md (remove -canary suffix)

# 3. Commit and push
git add package.json CHANGELOG.md
git commit -m "chore: release v1.1.0"
git push origin release/1.1.0

# 4. Create PR to main
# 5. After merge, tag the release
git checkout main
git pull origin main
git tag v1.1.0
git push origin v1.1.0

# 6. CI publishes to npm with @latest tag

# 7. Merge back to develop
git checkout develop
git merge main
git push origin develop

# 8. Delete release branch
git branch -d release/1.1.0
git push origin --delete release/1.1.0
```

### 4. Hotfix (Emergency Production Fix)

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/1.0.1-template-validation

# 2. Fix the issue
# ... make changes ...

# 3. Update version
npm version patch --no-git-tag-version
# Update CHANGELOG.md

# 4. Commit and push
git add .
git commit -m "fix: critical template validation bug"
git push origin hotfix/1.0.1-template-validation

# 5. Create PR to main
# 6. After merge and publish, merge to develop
git checkout develop
git merge main
git push origin develop

# 7. Delete hotfix branch
git branch -d hotfix/1.0.1-template-validation
```

## Unpulish withing 72 hours window
```bash
npm view maxclicks versions --json
```

```bash
npm unpublish maxclicks@1.0.0-canary.0 --force
```

## NPM Publishing Strategy

### Distribution Tags

#### `@latest` (default)
- **Source:** `main` branch
- **Version:** Stable releases (1.0.0, 1.1.0)
- **Installation:** `npm install maxclicks`
- **Users:** Production applications

#### `@canary`
- **Source:** `canary` branch
- **Version:** Pre-release (1.1.0-canary.1)
- **Installation:** `npm install maxclicks@canary`
- **Users:** Early adopters, testing environments

#### `@dev`
- **Source:** `develop` branch (optional)
- **Version:** Development (1.1.0-dev.1)
- **Installation:** `npm install maxclicks@dev`
- **Users:** Internal testing only

#### `@beta` (for major releases)
- **Source:** Beta release branches
- **Version:** Beta versions (2.0.0-beta.1)
- **Installation:** `npm install maxclicks@beta`
- **Users:** Beta testing program

### Publishing Commands

```bash
# Publish stable release
npm publish

# Publish canary release
npm publish --tag canary

# Publish beta release
npm publish --tag beta

# Publish dev release (if needed)
npm publish --tag dev
```

## Branch Protection Rules

### `main` Branch
- ✅ Require pull request reviews (2 approvers)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Restrict who can push (CI/CD only)
- ✅ Require signed commits

### `canary` Branch
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict who can push

### `develop` Branch
- ⚠️ Optional: Require pull request reviews
- ✅ Require status checks to pass
- ⚠️ Optional: Restrict who can push

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Build process, tooling changes
- `ci:` CI/CD changes
- `revert:` Revert a previous commit

### Examples
```bash
feat(contacts): add batch delete operation
fix(templates): validate UUID format correctly
docs(readme): update installation instructions
chore(deps): update TypeScript to 5.3.0
ci: add canary release workflow
```

## Release Checklist

### For Canary Release
- [ ] Create release branch from `develop`
- [ ] Update version to `X.Y.Z-canary.1`
- [ ] Update CHANGELOG.md
- [ ] Create PR to `canary` branch
- [ ] Merge and let CI publish to npm
- [ ] Tag the release (`vX.Y.Z-canary.1`)
- [ ] Test the canary release
- [ ] Announce in team channel

### For Production Release
- [ ] Successful canary testing completed
- [ ] Update version to stable `X.Y.Z`
- [ ] Update CHANGELOG.md (remove pre-release tags)
- [ ] Update README if needed
- [ ] Create PR to `main` branch
- [ ] Get required approvals
- [ ] Merge to main
- [ ] Tag the release (`vX.Y.Z`)
- [ ] CI publishes to npm
- [ ] Verify on npm registry
- [ ] Create GitHub Release with notes
- [ ] Merge main back to develop
- [ ] Delete release branch
- [ ] Announce on all channels
- [ ] Update documentation site

### For Hotfix Release
- [ ] Create hotfix branch from `main`
- [ ] Fix the critical issue
- [ ] Update version (patch increment)
- [ ] Update CHANGELOG.md
- [ ] Create PR to `main`
- [ ] Emergency review and merge
- [ ] Tag the release
- [ ] CI publishes to npm
- [ ] Merge main to develop
- [ ] Merge main to canary (if exists)
- [ ] Delete hotfix branch
- [ ] Post-mortem documentation

## Version Numbering Guide

### When to increment MAJOR (X.0.0)
- Breaking API changes
- Removing features
- Changing method signatures
- **Example:** v1.x.x → v2.0.0

### When to increment MINOR (x.Y.0)
- New features (backwards compatible)
- New API endpoints
- Deprecating features (not removing)
- **Example:** v1.5.0 → v1.6.0

### When to increment PATCH (x.x.Z)
- Bug fixes
- Performance improvements
- Documentation updates
- **Example:** v1.5.2 → v1.5.3

### Pre-release Versions
- **Canary:** `1.6.0-canary.1`, `1.6.0-canary.2`
- **Beta:** `2.0.0-beta.1`, `2.0.0-beta.2`
- **RC:** `2.0.0-rc.1`, `2.0.0-rc.2`

## Quick Reference

```bash
# Current branch
git branch --show-current

# List all branches
git branch -a

# List all tags
git tag -l

# Delete local branch
git branch -d feature/branch-name

# Delete remote branch
git push origin --delete feature/branch-name

# Delete tag locally
git tag -d v1.0.0

# Delete tag remotely
git push origin --delete v1.0.0

# View version
npm version

# Bump version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm version prerelease --preid=canary  # 1.0.0 -> 1.0.1-canary.0
```

## Summary

This branching strategy provides:
- ✅ Clear separation between development, testing, and production
- ✅ Safe pre-release testing with canary releases
- ✅ Quick hotfix capability
- ✅ Semantic versioning compliance
- ✅ Multiple release channels (latest, canary, beta)
- ✅ CI/CD friendly workflow
- ✅ Professional SDK development practices

For questions, refer to the team lead or check the GitHub repository wiki.

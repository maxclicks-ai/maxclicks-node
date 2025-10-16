# Git Workflow Quick Start Guide

This guide will help you set up and use the professional Git branching strategy for the Maxclicks Node.js SDK.

## 🚀 Initial Setup (One-time)

### Step 1: Create Branches

Run the setup script to create `develop` and `canary` branches:

```bash
./scripts/setup-branches.sh
```

This creates:
- `develop` - active development branch
- `canary` - pre-release testing branch
- `main` - production releases (already exists)

### Step 2: Configure GitHub Branch Protection

Go to your repository settings on GitHub and set up branch protection:

**For `main` branch:**
- ✅ Require pull request reviews before merging (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Do not allow bypassing the above settings

**For `canary` branch:**
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

**For `develop` branch:**
- ✅ Require status checks to pass (optional but recommended)

### Step 3: Add NPM Token to GitHub Secrets

1. Generate an npm access token:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token

2. Add to GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: paste your npm token
   - Click "Add secret"

## 📋 Daily Development Workflow

### Making Changes

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# ... code, commit, code, commit ...

# 4. Push and create PR to develop
git push origin feature/your-feature-name
gh pr create --base develop --title "feat: your feature description"
```

### Testing with Canary Release

When you want to test changes in a real environment:

```bash
# 1. Make sure develop has your changes
git checkout develop
git pull origin develop

# 2. Run the canary release script
./scripts/release-canary.sh

# This will:
# - Bump version to X.Y.Z-canary.N
# - Update CHANGELOG
# - Create commit and tag
# - Provide next steps

# 3. Create PR to canary
gh pr create --base canary --title "Release vX.Y.Z-canary.N"

# 4. After PR merge, push the tag
git checkout canary
git pull origin canary
git push origin vX.Y.Z-canary.N

# 5. CI will automatically publish to npm with @canary tag
```

### Installing Canary Version

Users can test canary releases:

```bash
npm install maxclicks@canary
```

### Releasing to Production

When canary testing is successful and you're ready for production:

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/X.Y.Z

# 2. Run production release script
./scripts/release-production.sh

# This will:
# - Remove canary suffix from version
# - Clean CHANGELOG
# - Run tests
# - Create commit
# - Provide next steps

# 3. Create PR to main
gh pr create --base main --title "Release vX.Y.Z"

# 4. After PR approval and merge:
git checkout main
git pull origin main
git tag vX.Y.Z
git push origin vX.Y.Z

# 5. CI will automatically:
# - Publish to npm with @latest tag
# - Create GitHub Release

# 6. Merge back to develop
git checkout develop
git merge main
git push origin develop

# 7. Clean up release branch
git branch -d release/X.Y.Z
git push origin --delete release/X.Y.Z
```

## 🏷️ Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

Canary versions: `1.2.3-canary.1`, `1.2.3-canary.2`, etc.

## 📦 NPM Distribution Tags

- `@latest` - Stable production releases (from `main`)
- `@canary` - Pre-release testing versions (from `canary`)

Users install:
```bash
npm install maxclicks        # Gets @latest
npm install maxclicks@canary # Gets @canary
```

## 🔄 Complete Release Cycle Example

```bash
# 1. Feature development
git checkout develop
git checkout -b feature/add-campaigns
# ... make changes ...
git commit -m "feat: add campaign management"
git push origin feature/add-campaigns
gh pr create --base develop

# 2. Canary testing
git checkout develop
./scripts/release-canary.sh
# Version: 1.1.0-canary.1
gh pr create --base canary --title "Release v1.1.0-canary.1"
# After merge:
git checkout canary
git push origin v1.1.0-canary.1
# CI publishes to npm with @canary tag

# 3. Test in real project
npm install maxclicks@canary
# ... test the new feature ...

# 4. Production release
git checkout develop
git checkout -b release/1.1.0
./scripts/release-production.sh
# Version: 1.1.0
gh pr create --base main --title "Release v1.1.0"
# After PR merge:
git checkout main
git tag v1.1.0
git push origin v1.1.0
# CI publishes to npm with @latest tag

# 5. Sync back
git checkout develop
git merge main
git push origin develop
```

## 🛠️ Useful Commands

```bash
# Check current version
node -p "require('./package.json').version"

# View all tags
git tag -l

# View branches
git branch -a

# Delete local feature branch after merge
git branch -d feature/branch-name

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View GitHub Actions status
gh run list

# Create draft PR
gh pr create --draft --base develop
```

## ❓ Troubleshooting

### "Script permission denied"

```bash
chmod +x scripts/*.sh
```

### "Branch protection prevents push"

You need to create a Pull Request instead of pushing directly.

### "npm publish failed"

Check that `NPM_TOKEN` is set in GitHub Secrets.

### "CI tests failing"

View logs: `gh run list` then `gh run view <run-id>`

## 📚 More Details

For comprehensive documentation, see [BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md).

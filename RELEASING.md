# Release Process

This project uses automated release scripts to streamline the publishing process.

## 🚀 Quick Release Commands

```bash
# For bug fixes and patches (1.2.3 -> 1.2.4)
npm run release:patch

# For new features (1.2.3 -> 1.3.0)
npm run release:minor

# For breaking changes (1.2.3 -> 2.0.0)
npm run release:major
```

## 📋 What Happens During Release

When you run a release command, the following steps occur automatically:

1. **Version Bump**: Updates version in `package.json` and `src/server.ts`
2. **Tests**: Runs the full test suite to ensure everything works
3. **Build**: Compiles TypeScript and prepares distribution files
4. **Git Commit**: Commits the version changes
5. **Git Tag**: Creates an annotated git tag (e.g., `v1.2.3`)
6. **Push**: Pushes commits and tags to GitHub
7. **GitHub Release**: Creates a GitHub release (if `gh` CLI is installed)
8. **NPM Publish**: GitHub Actions automatically publishes to npm

## 🔧 Prerequisites

### Required Setup

1. **NPM Token in GitHub Secrets**
   - Go to npmjs.com → Account Settings → Access Tokens
   - Create an "Automation" token
   - Add to GitHub: Settings → Secrets → Actions → `NPM_TOKEN`

2. **GitHub CLI (Optional but Recommended)**
   ```bash
   # macOS
   brew install gh
   
   # Or download from: https://cli.github.com/
   ```

3. **Clean Working Directory**
   - Commit or stash all changes before releasing
   - The release script will check this automatically

## 📝 Manual Release Process

If you prefer to release manually:

```bash
# 1. Update version in package.json
npm version patch  # or minor/major

# 2. Update src/server.ts version to match

# 3. Run tests
npm test

# 4. Commit changes
git add -A
git commit -m "chore: release v1.2.3"

# 5. Create and push tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin main
git push origin v1.2.3

# 6. Create GitHub release
# Go to: https://github.com/hesreallyhim/diy-tools-mcp/releases/new
# Select the tag and publish
```

## 🎯 Semantic Versioning Guide

- **Patch** (`1.2.3` → `1.2.4`): Bug fixes, typos, small improvements
- **Minor** (`1.2.3` → `1.3.0`): New features, backwards compatible
- **Major** (`1.2.3` → `2.0.0`): Breaking changes, API changes

## 🔍 Troubleshooting

### NPM Publish Fails in GitHub Actions

- Check that `NPM_TOKEN` secret is set correctly
- Ensure the version doesn't already exist on npm
- View action logs at: https://github.com/hesreallyhim/diy-tools-mcp/actions

### Release Script Fails

- Ensure you have a clean git working directory
- Check that you're on the main branch
- Verify you have push permissions to GitHub

### Version Mismatch

The release script automatically keeps `package.json` and `src/server.ts` in sync.

## 📊 Monitoring Releases

- **NPM Package**: https://www.npmjs.com/package/diy-tools-mcp
- **GitHub Releases**: https://github.com/hesreallyhim/diy-tools-mcp/releases
- **GitHub Actions**: https://github.com/hesreallyhim/diy-tools-mcp/actions

## 🔄 Rollback Process

If you need to rollback a release:

1. **Unpublish from npm** (within 72 hours):
   ```bash
   npm unpublish diy-tools-mcp@1.2.3
   ```

2. **Delete git tag**:
   ```bash
   git tag -d v1.2.3
   git push origin --delete v1.2.3
   ```

3. **Delete GitHub release**: Via GitHub UI

⚠️ **Note**: Once a version is published to npm for >72 hours, it cannot be unpublished.
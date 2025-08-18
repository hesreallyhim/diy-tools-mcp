#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf-8', cwd: rootDir, ...options });
  } catch (error) {
    log(`Error executing: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function getPackageVersion() {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  return packageJson.version;
}

function updateServerVersion(version) {
  const serverPath = join(rootDir, 'src', 'server.ts');
  let serverContent = readFileSync(serverPath, 'utf-8');
  serverContent = serverContent.replace(/version:\s*['"][\d.]+['"]/, `version: '${version}'`);
  writeFileSync(serverPath, serverContent);
}

async function main() {
  log('\n🚀 Starting automated release process...', 'bright');

  // 1. Check git status
  log('\n📋 Checking git status...', 'blue');
  const gitStatus = exec('git status --porcelain');
  const uncommittedFiles = gitStatus
    .split('\n')
    .filter(
      (line) => line.trim() && !line.includes('package.json') && !line.includes('src/server.ts')
    );

  if (uncommittedFiles.length > 0) {
    log('Error: You have uncommitted changes:', 'red');
    console.log(uncommittedFiles.join('\n'));
    log('\nPlease commit or stash your changes before releasing.', 'yellow');
    process.exit(1);
  }

  // 2. Get current version
  const version = getPackageVersion();
  log(`\n📦 Preparing to release version: ${version}`, 'green');

  // 3. Update server.ts version
  log('\n🔧 Updating server.ts version...', 'blue');
  updateServerVersion(version);

  // 4. Run tests
  log('\n🧪 Running tests...', 'blue');
  exec('npm test', { stdio: 'inherit' });

  // 5. Build the project
  log('\n🔨 Building project...', 'blue');
  exec('npm run build');

  // 6. Commit version changes
  log('\n💾 Committing version changes...', 'blue');
  exec('git add package.json package-lock.json src/server.ts');

  const commitMessage = `chore: release v${version}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

  exec(`git commit -m "${commitMessage}"`);

  // 7. Create git tag
  log('\n🏷️  Creating git tag...', 'blue');
  const tagMessage = `Release v${version}

Published to npm registry`;
  exec(`git tag -a v${version} -m "${tagMessage}"`);

  // 8. Push to GitHub
  log('\n📤 Pushing to GitHub...', 'blue');
  exec('git push origin main');
  exec(`git push origin v${version}`);

  // 9. Create GitHub release
  log('\n📝 Creating GitHub release...', 'blue');
  try {
    // Check if gh CLI is installed
    exec('gh --version', { stdio: 'pipe' });

    const releaseNotes = `## Release v${version}

### 📦 Installation
\`\`\`bash
npm install -g diy-tools-mcp@${version}
\`\`\`

### 🚀 What's Changed
- See commit history for details

### 📝 Full Changelog
https://github.com/hesreallyhim/diy-tools-mcp/compare/v${getPreviousVersion()}...v${version}`;

    exec(`gh release create v${version} --title "v${version}" --notes "${releaseNotes}"`);
    log('✅ GitHub release created!', 'green');
  } catch (error) {
    log('⚠️  GitHub CLI not found. Please create release manually at:', 'yellow');
    log(`https://github.com/hesreallyhim/diy-tools-mcp/releases/new?tag=v${version}`, 'blue');
  }

  // Success message
  log('\n✨ Release process complete!', 'green');
  log(`\n📊 Version ${version} has been:`, 'bright');
  log('  ✅ Committed to git', 'green');
  log('  ✅ Tagged in git', 'green');
  log('  ✅ Pushed to GitHub', 'green');
  log('  ✅ Will be published to npm via GitHub Actions', 'green');

  log('\n📈 Monitor the publish action at:', 'blue');
  log('https://github.com/hesreallyhim/diy-tools-mcp/actions', 'blue');
}

function getPreviousVersion() {
  try {
    const tags = exec('git tag -l --sort=-version:refname')
      .split('\n')
      .filter((t) => t.startsWith('v'));
    return tags[1] || 'v1.0.0';
  } catch {
    return 'v1.0.0';
  }
}

// Run the release
main().catch((error) => {
  log('\n❌ Release failed:', 'red');
  console.error(error);
  process.exit(1);
});

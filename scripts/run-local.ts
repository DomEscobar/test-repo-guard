import * as path from 'path';
import * as fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

/**
 * Local Test Harness for GitHub Action
 * Usage: 
 *   npx ts-node scripts/run-local.ts pr    # Simulate Pull Request event
 *   npx ts-node scripts/run-local.ts fix   # Simulate @opencode fix comment
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eventType = process.argv[2];
process.env.GITHUB_REF = 'refs/heads/master';
const isFix = eventType === 'fix';
const mockFile = isFix ? 'comment_event.json' : 'pr_event.json';
const eventPath = path.join(__dirname, '..', 'mocks', mockFile);

if (!fs.existsSync(eventPath)) {
  console.error(`Error: Mock file not found at ${eventPath}`);
  process.exit(1);
}

// Set GitHub Action environment variables
process.env.GITHUB_EVENT_PATH = eventPath;
process.env.GITHUB_EVENT_NAME = isFix ? 'issue_comment' : 'pull_request';
process.env.GITHUB_REPOSITORY = 'DomEscobar/test-repo-guard';
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'mock-token';
process.env.GITHUB_SHA = 'ec26c3e571111111111111111111111111111111';
process.env.GITHUB_WORKSPACE = path.join(__dirname, '..');

console.log(`>>> Starting Local Simulation`);
console.log(`>>> Event: ${process.env.GITHUB_EVENT_NAME}`);
console.log(`>>> Mock:  ${mockFile}`);

const entryPoint = path.join(__dirname, '..', 'dist', 'index.js');
if (!fs.existsSync(entryPoint)) {
  console.error(`\n[ERROR] Compiled entry point 'dist/index.js' not found.`);
  console.error(`Please run 'npm run build' first.\n`);
  process.exit(1);
}

// Execute the action entry point using node
const result = spawnSync('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true
});

if (result.error) {
  console.error(`\n[ERROR] Execution failed: ${result.error.message}`);
  process.exit(1);
}

console.log(`\n>>> Simulation finished with exit code: ${result.status}`);
process.exit(result.status ?? 0);

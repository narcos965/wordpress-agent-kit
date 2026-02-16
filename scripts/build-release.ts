#!/usr/bin/env tsx
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Re-implement path logic since we're outside src/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const outDir = path.join(PACKAGE_ROOT, 'dist');
const archive = path.join(outDir, 'wordpress-agent-kit.tar.gz');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

if (fs.existsSync(archive)) {
  fs.rmSync(archive, { force: true });
}

const args = [
  '-czf',
  archive,
  '--exclude=./dist',
  '--exclude=./.git',
  '--exclude=./.git/*',
  '--exclude=./node_modules',
  '--exclude=./node_modules/*',
  '--exclude=./.DS_Store',
  '--exclude=./*.log',
  '.'
];

console.log(`Creating release archive at ${archive}...`);

const result = spawnSync('tar', args, {
  cwd: PACKAGE_ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.status !== 0) {
  console.error('Failed to create archive.');
  process.exit(result.status || 1);
}

console.log(`Built release archive: ${archive}`);

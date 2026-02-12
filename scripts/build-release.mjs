#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kitRoot = path.resolve(__dirname, '..');
const outDir = path.join(kitRoot, 'dist');
const archive = path.join(outDir, 'wordpress-agent-kit.tar.gz');

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(archive)) {
  fs.rmSync(archive, { force: true });
}

const args = [
  '-czf',
  archive,
  '--exclude=./dist',
  '--exclude=./.DS_Store',
  '--exclude=./*.log',
  '.'
];

const result = spawnSync('tar', args, {
  cwd: kitRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`Built release archive: ${archive}`);
#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kitRoot = path.resolve(__dirname, '..');
const port = process.env.PORT || '9400';

const args = [
  '@wp-playground/cli@latest',
  'server',
  '--auto-mount',
  `--port=${port}`,
  '--blueprint=playground/blueprint.json'
];

const result = spawnSync('npx', args, {
  cwd: kitRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(result.status || 0);
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function run(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const skillsRepoUrl = process.argv[2];
const ref = process.argv[3] || '';

if (!skillsRepoUrl) {
  console.error('Usage: node scripts/sync-skills.mjs <skills_repo_url> [ref]');
  process.exit(2);
}

const repoRoot = process.cwd();
const submodulePath = path.join('vendor', 'wp-agent-skills');
const submoduleGitDir = path.join(repoRoot, submodulePath, '.git');

if (!fs.existsSync(submoduleGitDir)) {
  fs.mkdirSync(path.join(repoRoot, 'vendor'), { recursive: true });
  run('git', ['submodule', 'add', skillsRepoUrl, submodulePath], repoRoot);
}

run('git', ['submodule', 'update', '--init', '--recursive', submodulePath], repoRoot);

if (ref) {
  run('git', ['fetch', '--all', '--tags'], path.join(repoRoot, submodulePath));
  run('git', ['checkout', ref], path.join(repoRoot, submodulePath));
}

const targetSkills = path.join(repoRoot, '.github', 'skills');
const sourceSkills = path.join(repoRoot, submodulePath, '.github', 'skills');

if (fs.existsSync(targetSkills)) {
  fs.rmSync(targetSkills, { recursive: true, force: true });
}

fs.mkdirSync(path.join(repoRoot, '.github'), { recursive: true });
fs.cpSync(sourceSkills, targetSkills, { recursive: true });

console.log(`Synced skills into: ${targetSkills}`);
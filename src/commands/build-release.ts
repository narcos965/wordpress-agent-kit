import { Command } from 'commander';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { PACKAGE_ROOT } from '../utils/paths.js';

export const buildReleaseCommand = new Command('build-release')
  .description('Build a release archive')
  .action(() => {
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
  });

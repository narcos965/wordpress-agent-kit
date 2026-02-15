import { Command } from 'commander';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PACKAGE_ROOT } from '../utils/paths';

export const runPlaygroundCommand = new Command('playground')
  .description('Run local WordPress Playground')
  .action(() => {
    const port = process.env.PORT || '9400';
    const blueprintPath = path.join(PACKAGE_ROOT, 'playground', 'blueprint.json');

    const args = [
      '@wp-playground/cli@latest',
      'server',
      '--auto-mount',
      `--port=${port}`,
      `--blueprint=${blueprintPath}`
    ];

    console.log(`Starting WordPress Playground on port ${port}...`);

    const result = spawnSync('npx', args, {
      cwd: PACKAGE_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    process.exit(result.status || 0);
  });

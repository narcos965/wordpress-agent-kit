import { spawnSync } from 'node:child_process';

export function run(command: string, args: string[], cwd: string = process.cwd()) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    console.error(`Command failed with status ${result.status}: ${command} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

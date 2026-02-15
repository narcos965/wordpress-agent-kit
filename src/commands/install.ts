import { Command } from 'commander';
import path from 'node:path';
import { installKit } from '../lib/installer.js';

export const installCommand = new Command('install')
  .description('Install the WordPress Agent Kit into a target directory')
  .argument('[dir]', 'Target directory to install into', process.cwd())
  .action(async (dir) => {
      // If the directory argument is provided, commander passes it as first arg.
      // If default is used, it's process.cwd().
      // Wait, specific behavior:
      // If I invoke `wp-agent-kit install` without args, dir is process.cwd().
      // If I invoke `wp-agent-kit install my-dir`, dir is 'my-dir'.
      const targetDir = path.resolve(dir);
      try {
          await installKit(targetDir);
      } catch (error: any) {
          console.error(error.message);
          process.exit(1);
      }
  });

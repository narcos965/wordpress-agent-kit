#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../package.json';
import { installCommand } from './commands/install';
import { setupCommand } from './commands/setup';
import { syncSkillsCommand } from './commands/sync-skills';
import { runPlaygroundCommand } from './commands/run-playground';

const program = new Command();

program
  .name('wp-agent-kit')
  .description('Utilities for WordPress Agent Kit')
  .version(version);

program.addCommand(installCommand);
program.addCommand(setupCommand);
program.addCommand(syncSkillsCommand);
program.addCommand(runPlaygroundCommand);

program.parse(process.argv);

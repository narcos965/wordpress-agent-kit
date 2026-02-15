#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'module';
import { installCommand } from './commands/install.js';
import { setupCommand } from './commands/setup.js';
import { syncSkillsCommand } from './commands/sync-skills.js';
import { runPlaygroundCommand } from './commands/run-playground.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

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

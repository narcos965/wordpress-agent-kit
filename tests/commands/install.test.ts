import { describe, it, expect } from 'vitest';
import { installCommand } from '../../src/commands/install.js';
import { Command } from 'commander';

describe('installCommand', () => {
  it('should be a Commander command', () => {
    expect(installCommand).toBeInstanceOf(Command);
    expect(installCommand.name()).toBe('install');
  });

  it('should have correct command configuration', () => {
    expect(installCommand.description()).toContain('Install');
    expect(installCommand.arguments).toBeDefined();
  });
});

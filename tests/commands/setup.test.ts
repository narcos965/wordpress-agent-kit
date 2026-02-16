import { describe, it, expect } from 'vitest';
import { setupCommand } from '../../src/commands/setup.js';
import { Command } from 'commander';

describe('setupCommand', () => {
  it('should be a Commander command', () => {
    expect(setupCommand).toBeInstanceOf(Command);
    expect(setupCommand.name()).toBe('setup');
  });

  it('should have correct command configuration', () => {
    expect(setupCommand.description()).toContain('setup');
    expect(setupCommand.options).toBeDefined();
  });

  it('should have reset option', () => {
    const options = setupCommand.options;
    const resetOption = options.find(opt => opt.long === '--reset');
    expect(resetOption).toBeDefined();
  });
});

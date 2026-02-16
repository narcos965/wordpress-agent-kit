import { describe, it, expect } from 'vitest';
import { runPlaygroundCommand } from '../../dist/commands/run-playground';
import { Command } from 'commander';
describe('runPlaygroundCommand', () => {
    it('should be a Commander command', () => {
        expect(runPlaygroundCommand).toBeInstanceOf(Command);
        expect(runPlaygroundCommand.name()).toBe('playground');
    });
    // Adding more robust tests require mocking spawnSync which is imported inside the module.
    // We can do that with vi.mock() if we want.
});

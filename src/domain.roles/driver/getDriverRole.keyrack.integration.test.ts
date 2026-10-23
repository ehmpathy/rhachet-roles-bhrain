import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

describe('getDriverRole.keyrack', () => {
  given('[case1] the keyrack manifest beside the driver role', () => {
    when('[t0] its content is read from disk', () => {
      then(
        'it declares the openrouter key for prep, and no fireworks key',
        async () => {
          // guards and the tally fallback run on openrouter/deepseek/flash
          const content = await fs.readFile(
            path.join(__dirname, 'keyrack.yml'),
            'utf-8',
          );
          expect(content).toContain('env.prep:');
          expect(content).toContain('- OPENROUTER_API_KEY');
          expect(content).not.toContain('FIREWORKS');
        },
      );
    });
  });
});

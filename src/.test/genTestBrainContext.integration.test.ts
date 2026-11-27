import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN, genTestBrainContext } from './genTestBrainContext';

/**
 * .what = clamp: a live-brain test demands its key, even though setup sources keys leniently
 * .why = the integration setup no longer refuses a run with no brain key, so a suite that calls
 *        no model runs keyless. that leniency must never let a live-brain test start keyless
 */
describe('genTestBrainContext', () => {
  given('[case1] the brain key is absent from the env', () => {
    const keyPrior = process.env.OPENROUTER_API_KEY;
    beforeEach(() => {
      delete process.env.OPENROUTER_API_KEY;
    });
    afterEach(() => {
      if (keyPrior !== undefined) process.env.OPENROUTER_API_KEY = keyPrior;
    });

    when('[t0] a live-brain test asks for its brain context', () => {
      then('it refuses with a ConstraintError that names the key', async () => {
        const error = await getError(
          genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('OPENROUTER_API_KEY');
        expect(error.message).toContain('rhx keyrack set');
      });
    });
  });
});

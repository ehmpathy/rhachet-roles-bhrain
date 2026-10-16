import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asBrainLookupFault } from './asBrainLookupFault';

// a stand-in for rhachet's own class: only its NAME is what the transformer reads
class BrainChoiceNotFoundError extends Error {}

describe('asBrainLookupFault', () => {
  given('[case1] the lookup found no registered brain', () => {
    when('[t0] the fault is cast', () => {
      const fault = asBrainLookupFault({
        error: new BrainChoiceNotFoundError(
          'brain not found: openrouter/deepseek/flash',
        ),
        choice: 'openrouter/deepseek/flash',
      });

      then('it becomes a caller fault', () => {
        expect(fault).toBeInstanceOf(ConstraintError);
      });

      then('it names the brain, the lookup, and the keyrack fix', () => {
        const message = (fault as Error).message;
        expect(message).toContain(
          "brain 'openrouter/deepseek/flash' is not registered",
        );
        expect(message).toContain('brain not found: openrouter/deepseek/flash');
        expect(message).toContain(
          'rhx keyrack unlock --owner ehmpath --env prep',
        );
      });
    });
  });

  given('[case3] the lookup carries the registered brains', () => {
    when('[t0] the fault is cast', () => {
      // rhachet's error carries the menu in metadata.available, atoms then repls
      const error = Object.assign(
        new BrainChoiceNotFoundError('brain not found: nonexistent/brain'),
        {
          metadata: {
            choice: 'nonexistent/brain',
            available: {
              atoms: ['openrouter/deepseek/flash', 'openrouter/qwen/coder'],
              repls: ['anthropic/claude/code'],
            },
          },
        },
      );
      const fault = asBrainLookupFault({ error, choice: 'nonexistent/brain' });

      then('the registered slugs ride in known, atoms then repls', () => {
        expect((fault as ConstraintError).metadata?.known).toEqual([
          'openrouter/deepseek/flash',
          'openrouter/qwen/coder',
          'anthropic/claude/code',
        ]);
      });
    });
  });

  given('[case2] any other fault', () => {
    when('[t0] the fault is cast', () => {
      then('it passes through unchanged', () => {
        const error = new Error('socket hang up');
        expect(
          asBrainLookupFault({ error, choice: 'openrouter/deepseek/flash' }),
        ).toBe(error);
      });
    });
  });
});

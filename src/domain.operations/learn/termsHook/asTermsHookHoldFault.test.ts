import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { given, then, when } from 'test-fns';
import { SimpleMutexAcquireTimeoutError } from 'with-simple-mutex';

import { asTermsHookHoldFault } from './asTermsHookHoldFault';

describe('asTermsHookHoldFault', () => {
  given('[case1] the hold timed out on acquire', () => {
    const error = new SimpleMutexAcquireTimeoutError(
      'could not acquire the mutex lock within the acquire timeout',
      { key: { given: '.claude/settings.json', used: 'k' }, waitedMse: 120000 },
    );

    when('[t0] it is mapped', () => {
      const fault = asTermsHookHoldFault({
        error,
        pathShown: '.claude/settings.json',
      });

      then('it is a ConstraintError that names the busy file', () => {
        expect(fault).toBeInstanceOf(ConstraintError);
        expect(fault).not.toBe(error);
        expect((fault as ConstraintError).message).toContain(
          'another process held the settings file past a 2 min wait',
        );
        expect((fault as ConstraintError).metadata).toMatchObject({
          settings: '.claude/settings.json',
          waitedMse: 120000,
        });
      });
    });
  });

  given('[case2] any other error', () => {
    when('[t0] a ConstraintError from the logic is mapped', () => {
      const error = new ConstraintError('the settings target is a dir');
      then('it passes through as found', () => {
        expect(
          asTermsHookHoldFault({ error, pathShown: '.claude/settings.json' }),
        ).toBe(error);
      });
    });

    when('[t1] a MalfunctionError is mapped', () => {
      const error = new MalfunctionError('disk full');
      then('it passes through as found', () => {
        expect(
          asTermsHookHoldFault({ error, pathShown: '.claude/settings.json' }),
        ).toBe(error);
      });
    });
  });
});

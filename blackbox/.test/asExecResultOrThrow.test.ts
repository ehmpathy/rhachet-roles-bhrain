import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asExecResultOrThrow } from './asExecResultOrThrow';

/**
 * .what = clamps on the exec rejection cast every skill harness shares
 * .why  = a harness that folds a spawn fault into `code: 1` reports a skill result that never
 *         happened, so a broken fixture reads to the suite as a legitimately failed skill
 */
describe('asExecResultOrThrow', () => {
  given('[case1] a nonzero exit — exec rejects with a numeric code', () => {
    when('[t0] the rejection is cast', () => {
      then('it carries the streams and the exit code', () => {
        const error = Object.assign(new Error('Command failed'), {
          code: 2,
          stdout: 'out',
          stderr: '✋ ConstraintError: nope',
        });
        expect(asExecResultOrThrow({ error })).toEqual({
          stdout: 'out',
          stderr: '✋ ConstraintError: nope',
          code: 2,
        });
      });
    });
  });

  given('[case2] a spawn fault — the code is the string ENOENT', () => {
    when('[t0] the rejection is cast', () => {
      then('it rethrows the fault, never a fake exit', async () => {
        const error = Object.assign(new Error('spawn bash ENOENT'), {
          code: 'ENOENT',
          stdout: '',
          stderr: '',
        });
        const thrown = await getError(async () => asExecResultOrThrow({ error }));
        expect(thrown).toBe(error);
      });
    });
  });

  given('[case3] a signal kill — the code is null', () => {
    when('[t0] the rejection is cast', () => {
      then('it rethrows the fault', async () => {
        const error = Object.assign(new Error('killed'), {
          code: null,
          signal: 'SIGTERM',
          stdout: '',
          stderr: '',
        });
        const thrown = await getError(async () => asExecResultOrThrow({ error }));
        expect(thrown).toBe(error);
      });
    });
  });

  given('[case5] exit 127 — the skill never launched', () => {
    // .why = a skill that never ran prints naught, so a returned `code: 127` lets every
    //        content assertion below it fail on an empty string, and the loudest of those
    //        names a behavior defect that does not exist
    when('[t0] the rejection is cast', () => {
      then('it throws a MalfunctionError that names the launch and carries stderr', async () => {
        const error = Object.assign(new Error('Command failed'), {
          code: 127,
          stdout: '',
          stderr: 'rhx: command not found',
        });
        const thrown = await getError(async () => asExecResultOrThrow({ error }));
        expect(thrown).toBeInstanceOf(MalfunctionError);
        expect(thrown.message).toContain('never launched');
        expect(thrown.message).toContain('rhx: command not found');
      });
    });
  });

  given('[case4] an unexpected fault inside the harness', () => {
    when('[t0] the rejection is cast', () => {
      then('it rethrows the fault', async () => {
        const error = new TypeError('cannot read properties of undefined');
        const thrown = await getError(async () => asExecResultOrThrow({ error }));
        expect(thrown).toBe(error);
      });
    });
  });
});

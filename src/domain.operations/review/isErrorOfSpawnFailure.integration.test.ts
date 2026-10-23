import { execSync } from 'child_process';
import { UnexpectedCodePathError } from 'helpful-errors';
import { given, then, useThen, when } from 'test-fns';

import { isErrorOfSpawnFailure } from './isErrorOfSpawnFailure';

/**
 * .what = the REAL error `execSync` throws for a given command
 * .why = 🔴 the whole subject here is the SHAPE node puts on a child-process
 *        rejection, so a hand-built `{ status: 1 }` would clamp the fixture writer
 *        rather than the predicate. these commands are run for real and their throws
 *        are caught — a spawned process is outside the process memory, so this is an
 *        integration test (`rule.forbid.unit.remote-boundaries`)
 */
const getOneExecError = (input: { command: string }): unknown => {
  // run the command; a throw here is the error under test
  const error = (() => {
    try {
      execSync(input.command, { stdio: 'ignore' });
      return null;
    } catch (thrown) {
      return thrown;
    }
  })();

  // 🔴 a command that exits zero yields no error, so the case would grade naught.
  //    thrown OUTSIDE the catch, so the sentinel cannot be swallowed into the result
  if (error === null)
    throw new UnexpectedCodePathError(
      'the command did not fail — this fixture proves naught',
      {
        command: input.command,
        hint: 'pick a command that exits non-zero (`exit 3`) or cannot spawn (`/no/such/bin`)',
      },
    );
  return error;
};

describe('isErrorOfSpawnFailure', () => {
  given('[case1] a child that started and exited NON-ZERO', () => {
    when('[t0] the catch asks', () => {
      // one real child, shared. the error rides in a plain object, since the
      // `useThen` proxy does not carry an Error instance through itself
      const exec = useThen('the child exits', async () => ({
        error: getOneExecError({ command: 'exit 3' }),
      }));

      then('🔴 it answers true — the opener ran and refused', () => {
        // `--open bat` on a file `bat` cannot render is exactly this shape
        expect(isErrorOfSpawnFailure({ error: exec.error })).toEqual(true);
      });

      then('and the fixture really carries a numeric status', () => {
        // 🔴 the clamp that stops a vacuous green. `true` is also what a launch
        //    failure answers, so without this the case would pass even if `exit 3`
        //    had failed to launch at all (rule.require.clamp-edge-cases)
        expect((exec.error as { status: unknown }).status).toEqual(3);
      });
    });
  });

  given('[case2] a command that could never be launched', () => {
    when('[t0] the catch asks', () => {
      then('🔴 it answers true — the program is not on this box', () => {
        // the commonest real case: a driver names an opener they do not have
        const error = getOneExecError({
          command: 'a-program-no-box-carries-2c1f9b',
        });
        expect(isErrorOfSpawnFailure({ error })).toEqual(true);
      });
    });
  });

  given('[case3] a throw that came from THIS code, never the child', () => {
    /**
     * 🔴 .why = the whole reason the predicate exists. the `--open` block runs AFTER a
     *           review has fully succeeded, so a malfunction inside it used to print
     *           as *"opener unavailable"* while the run exited 0 — a driver read a
     *           clean review and a cosmetic note over a real fault.
     *
     * ⚠️ a bare `instanceof Error` catch answers TRUE for every row below but the
     *    last, and the last one it swallowed in total silence with no rethrow.
     */
    when('[t0] the catch asks about each shape', () => {
      then('🔴 every one answers FALSE, so every one surfaces', () => {
        const shapes: Array<{ what: string; error: unknown }> = [
          {
            what: 'a TypeError from a defect above',
            error: new TypeError('x'),
          },
          { what: 'a RangeError', error: new RangeError('x') },
          { what: 'a bare Error with no child fields', error: new Error('x') },
          { what: 'an fs code OUTSIDE the launch set', error: { code: 'EIO' } },
          { what: 'a non-numeric status', error: { status: 'nope' } },
          { what: 'a non-string signal', error: { signal: 7 } },
          // 🔴 the row the old catch dropped with NO log and NO rethrow at all
          { what: 'a thrown string', error: 'not an error object' },
          { what: 'a thrown null', error: null },
          { what: 'a thrown undefined', error: undefined },
        ];
        for (const shape of shapes)
          expect({
            what: shape.what,
            verdict: isErrorOfSpawnFailure({ error: shape.error }),
          }).toEqual({ what: shape.what, verdict: false });
      });
    });
  });

  given('[case4] a child that was KILLED by a signal', () => {
    when('[t0] the catch asks', () => {
      then('it answers true — the opener started and was cut down', () => {
        // a real `execSync` kill is racy to provoke, so the SHAPE is asserted
        // directly here and the two real shapes above cover the launch/exit arms.
        // 🟡 stated rather than hidden: this one row is shape-only
        expect(isErrorOfSpawnFailure({ error: { signal: 'SIGTERM' } })).toEqual(
          true,
        );
      });
    });
  });
});

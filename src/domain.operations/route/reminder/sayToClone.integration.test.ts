import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { sayToClone } from './sayToClone';

/**
 * .what = integration cases for sayToClone (the `rhx clone say` boundary)
 * .why = this communicator crosses to the real `rhx clone say` command, so it is proven
 *        against the real binary — no mock. it covers the reached:FALSE door for real: a
 *        dispatch to a bogus address exits 2 (ConstraintError), which the communicator must
 *        classify as `{ reached: false }` — that is the daemon's dead-session self-exit signal.
 *        it ALSO covers the real execFile timeout + kill path: a sub-cost timeout forces the
 *        OS to SIGTERM the child, and the communicator must classify that killed exit as a
 *        GENUINE fault (a throw), never the exit-2 dead-session door.
 *
 * .note = the reached:TRUE happy path needs a real enrolled LIVE clone; that is the vision's
 *         must-validate spike, run on a real driver, not here.
 */
describe('sayToClone.integration', () => {
  given('[case1] a dispatch to an address no LIVE clone answers', () => {
    const scene = useBeforeAll(async () => {
      const result = await sayToClone({
        addr: '@:nonexistent-clone-for-test',
        what: 'you can do it! drive on, fulcrum, and converge',
      });
      return { result };
    });

    when('[t0] the boundary classifies the exit', () => {
      then('it reports the clone was not reached (dead-session door)', () => {
        expect(scene.result.reached).toBe(false);
      });

      then('it carries a reason for the unreachable clone', () => {
        if (scene.result.reached !== false)
          throw new Error('expected reached=false');
        expect(scene.result.reason).toContain('@:nonexistent-clone-for-test');
      });
    });
  });

  // the real OS-level timeout + kill path — the coverage gap the i029 review named. the other
  // cases exercise the exit-2 (reached:false) door; NONE forced an actual execFile timeout, so the
  // "killed child → genuine fault throw" classification was inferred from a code read only. here a
  // 1ms bound guarantees the real `rhx clone say` subprocess (a node spawn, tens of ms to start) is
  // killed by SIGTERM BEFORE it can exit — so execFile rejects with { killed: true, code: null },
  // which sayToClone must classify as a genuine fault (an UnexpectedCodePathError throw), NEVER as
  // the exit-2 dead-session door (which would mis-read a merely-slow-but-alive clone as gone). RED
  // if the killed branch were folded into reached:false; GREEN with the throw (rule.require.clamp-edge-cases).
  given('[case2] a dispatch bounded by a sub-cost timeout (real kill)', () => {
    const scene = useBeforeAll(async () => {
      const error = await getError(
        sayToClone({
          addr: '@:nonexistent-clone-for-test',
          what: 'you can do it! drive on, fulcrum, and converge',
          timeoutMs: 1,
        }),
      );
      return { error };
    });

    when('[t0] the boundary classifies the killed child', () => {
      then('it throws a genuine fault, not the reached:false door', () => {
        expect(scene.error).toBeInstanceOf(UnexpectedCodePathError);
      });

      then(
        'the fault names the timeout + the bound (errors-name-the-fix)',
        () => {
          expect(scene.error.message).toContain('timed out after 1ms');
          expect(scene.error.message).toContain('wedged');
        },
      );
    });
  });
});

import * as fs from 'fs/promises';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { getRouteReminderCrashLogPath } from './getRouteReminderCrashLogPath';
import { runRouteReminderDaemon } from './runRouteReminderDaemon';
import { sayToClone } from './sayToClone';

/**
 * .what = an end-to-end proof that the REAL daemon loop tears itself down from REAL state
 * .why = U3's no-infiniloop guarantee is proven here as a whole, not in pieces: the real loop
 *        composes the real stepRouteReminderTick (imported, not injected) over a real
 *        passage.jsonl. two cases drive the real `rhx clone say` boundary; one drives a fake
 *        sayToClone to prove the loop's cadence (sleep after a nudge, never after an exit). the
 *        exit REASON is the proof of the exit door taken: a blocked route yields `route-not-live`
 *        (the inject is never consulted — else it would read `session-dead`), and an active route
 *        whose clone is unreachable yields `session-dead`. (the last inch — a real OS process
 *        whose pid the kernel reaps — is the vision's S5 host spike, out of reach of an
 *        in-process test.)
 */

// an instant sleep so the wall-clock interval collapses — the loop's cadence order is under test,
// not its real duration. the sleep fake records each interval it is asked to wait.
const genSleepRecorder = (): {
  sleep: (ms: number) => Promise<void>;
  waits: number[];
} => {
  const waits: number[] = [];
  const sleep = async (ms: number): Promise<void> => {
    waits.push(ms);
  };
  return { sleep, waits };
};

describe('runRouteReminderDaemon.integration', () => {
  given('[case1] a route whose latest passage is blocked', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      }),
    );

    when('[t0] the real daemon loop runs against the blocked route', () => {
      const outcome = useBeforeAll(async () =>
        runRouteReminderDaemon(
          {
            route: scene.route,
            cloneAddr: '@:driver-1',
            intervalMs: 1,
            sayTimeoutMs: 30_000,
          },
          { sayToClone, sleep: async () => undefined },
        ),
      );

      then('the daemon self-exits — a dead route is never nudged', () => {
        // route-not-live (NOT session-dead) proves the inject was never consulted: the loop read
        // blocked from disk and tore itself down before it could reach the clone
        expect(outcome.exitReason).toBe('route-not-live');
      });

      then('it exits on the FIRST tick — no sleep, no second cycle', () => {
        expect(outcome.ticks).toBe(1);
      });
    });
  });

  given('[case2] an active route whose driver session is gone', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] the loop runs and the inject cannot reach the clone', () => {
      const outcome = useBeforeAll(async () =>
        // a bogus address no LIVE clone answers → the real `rhx clone say` exits 2 → the
        // dead-session door → the loop self-exits
        runRouteReminderDaemon(
          {
            route: scene.route,
            cloneAddr: '@:nonexistent-clone-for-test',
            intervalMs: 1,
            sayTimeoutMs: 30_000,
          },
          { sayToClone, sleep: async () => undefined },
        ),
      );

      then('the daemon self-exits on the dead-session door', () => {
        expect(outcome.exitReason).toBe('session-dead');
      });

      then('it exits on the FIRST tick', () => {
        expect(outcome.ticks).toBe(1);
      });

      then(
        'the first-fail exit is OBSERVABLE — a malfunction crash log lands (not silent)',
        async () => {
          // the wisher accepted the first-fail self-exit ON THE CONDITION it leaves a durable trace
          // (vision U3 decision). so a session-dead exit MUST write the crash record — else the exit
          // is silent and this goes red (rule.require.clamp-edge-cases / rule.require.status-feedback).
          const body = await fs.readFile(
            getRouteReminderCrashLogPath({ route: scene.route, index: 0 }),
            'utf8',
          );
          expect(body).toContain('reason=session-dead');
          expect(body).toContain('clone:  @:nonexistent-clone-for-test');
        },
      );
    });
  });

  given(
    '[case3] an active route where the clone answers twice then drops',
    () => {
      // a fake sayToClone (the real external boundary is legitimately injectable) reaches the clone
      // for the first two ticks, then the session drops on the third. the route stays active
      // throughout, so the loop's cadence — nudge, sleep, nudge, sleep, exit with no sleep after
      // the exit — is the whole subject here. this is the deterministic loop-mechanics proof.
      const scene = useBeforeAll(async () => {
        const built = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        });
        let calls = 0;
        const sayToCloneFake = async (): Promise<
          { reached: true } | { reached: false; reason: string }
        > => {
          calls += 1;
          return calls <= 2
            ? { reached: true }
            : { reached: false, reason: 'clone dropped' };
        };
        return { route: built.route, sayToCloneFake };
      });

      when('[t0] the loop runs', () => {
        const result = useBeforeAll(async () => {
          const recorder = genSleepRecorder();
          const outcome = await runRouteReminderDaemon(
            {
              route: scene.route,
              cloneAddr: '@:driver-1',
              intervalMs: 1000,
              sayTimeoutMs: 30_000,
            },
            {
              sayToClone: scene.sayToCloneFake,
              sleep: recorder.sleep,
              // pin jitter to 0.5 → offset 0 → the interval is exact, so the cadence order (not
              // the jittered duration) is what this case asserts
              random: () => 0.5,
            },
          );
          return { outcome, waits: recorder.waits };
        });

        then('it ran exactly three ticks then exited session-dead', () => {
          expect(result.outcome.exitReason).toBe('session-dead');
          expect(result.outcome.ticks).toBe(3);
        });

        then(
          'it slept once after each of the two nudges, not after the exit',
          () => {
            expect(result.waits).toEqual([1000, 1000]);
          },
        );
      });
    },
  );

  given('[case4] an active route whose clone-say hits a genuine fault', () => {
    // a non-exit-2 fault (rhx absent, timeout, unexpected exit) THROWS out of sayToClone — it is
    // NOT the reach-gate `reached:false` door. the loop has NO try/catch, by design: the
    // crash-loud contract wants the throw to propagate so a host sees the crash and respawns. this
    // clamps that invariant — a future "harden the loop" refactor that wrapped the tick in a
    // try/catch would swallow the fault into a busy retry-loop, and THIS test would flip red
    // (rule.require.clamp-edge-cases). the route stays active throughout, so the tick reaches the
    // inject and the throw is the subject.
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] the loop runs and sayToClone throws a genuine fault', () => {
      then(
        'the fault propagates out of the loop — it is NOT swallowed',
        async () => {
          // await getError over a thunk (its idiomatic form — a bare promise would let the
          // rejection escape unhandled before getError attaches its handler)
          const error = await getError(async () =>
            runRouteReminderDaemon(
              {
                route: scene.route,
                cloneAddr: '@:driver-1',
                intervalMs: 1,
                sayTimeoutMs: 30_000,
              },
              {
                // a throw, NOT a `{ reached: false }` — the crash-loud branch, not the exit door
                sayToClone: async () => {
                  throw new Error('rhx absent — a genuine non-exit-2 fault');
                },
                sleep: async () => undefined,
              },
            ),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('genuine non-exit-2 fault');

          // a genuine throw is ALREADY crash-loud (it propagates); it is NOT the silent session-dead
          // door, so it writes NO `.malfunctions/` crash log — the crash log is scoped to the
          // first-fail reach exit only. a stray crash log here would mean the scope leaked.
          const crashError = await getError(async () =>
            fs.readFile(
              getRouteReminderCrashLogPath({ route: scene.route, index: 0 }),
              'utf8',
            ),
          );
          expect(asNodeErrnoCode(crashError)).toBe('ENOENT');
        },
      );
    });
  });

  given(
    '[case5] a dead-session route whose crash-log write CANNOT complete',
    () => {
      // the crash log is a SECONDARY observability aid; the PRIMARY is the exit-reason RETURN. a
      // fault in the aux write (here: `.malfunctions/` is blocked by a regular file, so mkdir/write
      // throws) must NOT propagate and turn the clean session-dead self-exit into a raw crash — that
      // would SUPPRESS the very exit-reason the seam exists to surface. this clamp pre-plants a file
      // where the `.malfunctions/` dir must go, drives a real session-dead exit, and proves the
      // daemon STILL self-exits cleanly with `session-dead`. it goes red under the old unguarded
      // `await setRouteReminderCrashLog(...)` (the write throw propagates, getError catches a raw
      // fault, exitReason is never returned) and green under the guarded aux-write catch
      // (rule.require.clamp-edge-cases, rule.prefer.helpful-error-wrap).
      const scene = useBeforeAll(async () => {
        const built = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        });
        // block the crash-log dir: plant a regular FILE where `.malfunctions/` must be created,
        // so setRouteReminderCrashLog's mkdir/writeFile faults
        const crashDir = path.dirname(
          getRouteReminderCrashLogPath({ route: built.route, index: 0 }),
        );
        await fs.writeFile(crashDir, 'i am a file, not a dir');
        return { route: built.route };
      });

      when('[t0] the loop runs and the inject cannot reach the clone', () => {
        const outcome = useBeforeAll(async () =>
          runRouteReminderDaemon(
            {
              route: scene.route,
              cloneAddr: '@:nonexistent-clone-for-test',
              intervalMs: 1,
              sayTimeoutMs: 30_000,
            },
            { sayToClone, sleep: async () => undefined },
          ),
        );

        then(
          'the daemon STILL self-exits cleanly on session-dead — the aux-write fault is not fatal',
          () => {
            expect(outcome.exitReason).toBe('session-dead');
            expect(outcome.ticks).toBe(1);
          },
        );
      });
    },
  );
});

import { spawn } from 'child_process';
import { given, then, useBeforeAll, when } from 'test-fns';

import { isProcessAlive } from './isProcessAlive';
import { stopProcess } from './stopProcess';
import { verifyRouteReminderBootSurvival } from './verifyRouteReminderBootSurvival';

/**
 * .what = clamps the boot-SURVIVAL check that closes the crash-on-arrival spawn-storm — a daemon that
 *         is alive at an instantaneous probe but dies a moment into its boot must read survived:false.
 * .why = an instantaneous `kill -0` right after spawn cannot tell "booted, in its loop" from "still
 *        amid its dynamic import, about to crash". the OLD single probe reported such a doomed child as
 *        alive:true, so a handle was written that went stale in ms and the next hook re-spawned — a
 *        silent, unbounded spawn-storm (i034 r007/r010 blocker). these cases drive a REAL short-lived
 *        child (never a mocked isProcessAlive) so the alive-at-probe-1 / dead-at-probe-2 RACE — the one
 *        the prior test never exercised (it only used a pre-dead pid) — is clamped
 *        (rule.require.clamp-edge-cases). the middle case goes red under the old single-probe check.
 */
describe('verifyRouteReminderBootSurvival.integration', () => {
  given('[case1] a daemon that stays alive across the settle window', () => {
    const scene = useBeforeAll(async () => {
      // a long-lived child: alive at BOTH probes
      const child = spawn('sleep', ['5'], { detached: true, stdio: 'ignore' });
      child.unref();
      const pid = child.pid;
      if (!pid) throw new Error('failed to spawn a long-lived child');
      return { pid };
    });

    afterAll(() => {
      // reap the long-lived child — stopProcess allowlists ESRCH (already gone) internally and
      // rethrows any other errno, so an EPERM leak (a child alive-but-not-ours) surfaces here instead
      // of a silent swallow (rule.forbid.failhide). a bare try/catch would hide exactly that leak.
      stopProcess({ pid: scene.pid, signal: 'SIGKILL' });
    });

    when('[t0] boot survival is verified with a short settle window', () => {
      const result = useBeforeAll(async () =>
        verifyRouteReminderBootSurvival({ pid: scene.pid, settleMs: 100 }),
      );

      then('it survived — alive at both probes', () => {
        expect(result.survived).toBe(true);
      });
    });
  });

  given(
    '[case2] a daemon alive at the first probe but dead a moment later (crash-on-arrival)',
    () => {
      const scene = useBeforeAll(async () => {
        // a child that exits ~50ms in — alive at probe 1 (t0), dead by probe 2 (after the settle)
        const child = spawn('sleep', ['0.05'], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
        const pid = child.pid;
        if (!pid) throw new Error('failed to spawn a short-lived child');
        // sanity: it IS alive right now (so this exercises the RACE, not the pre-dead path)
        return { pid, aliveAtStart: isProcessAlive({ pid }) };
      });

      then(
        'it was genuinely alive at the start — this is the race, not a pre-dead pid',
        () => {
          expect(scene.aliveAtStart).toBe(true);
        },
      );

      when(
        '[t0] boot survival is verified with a settle window past its death',
        () => {
          const result = useBeforeAll(async () =>
            // 250ms settle > the child's 50ms life → the SECOND probe reads it dead
            verifyRouteReminderBootSurvival({ pid: scene.pid, settleMs: 250 }),
          );

          then(
            'it did NOT survive — the second probe caught the crash-on-arrival',
            () => {
              expect(result.survived).toBe(false);
            },
          );
        },
      );
    },
  );

  given('[case3] a pid already dead before the first probe', () => {
    const scene = useBeforeAll(async () => {
      // spawn then SIGKILL, poll until the OS reaps it — dead before verify runs
      const child = spawn('sleep', ['300'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      const pid = child.pid;
      if (!pid) throw new Error('failed to spawn a child to pre-kill');
      stopProcess({ pid, signal: 'SIGKILL' });
      for (let tries = 0; tries < 200 && isProcessAlive({ pid }); tries += 1)
        await new Promise((wake) => setTimeout(wake, 10));
      return { pid };
    });

    when('[t0] boot survival is verified', () => {
      const result = useBeforeAll(async () =>
        verifyRouteReminderBootSurvival({ pid: scene.pid, settleMs: 250 }),
      );

      then(
        'it did NOT survive — a dead pid short-circuits before the settle wait',
        () => {
          expect(result.survived).toBe(false);
        },
      );
    });
  });
});

import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { REMINDER_NUDGE_PROSE } from './REMINDER_NUDGE_PROSE';
import { stepRouteReminderTick } from './stepRouteReminderTick';

/**
 * .what = integration cases for stepRouteReminderTick
 * .why = the tick reads the real passage.jsonl (fs boundary), so it is proven against real
 *        files. the `sayToClone` boundary is a fake here — not a mock of a real service, but a
 *        simple in-memory fake that records the call, so the tick's decision (inject vs exit)
 *        is verified without a real enrolled clone (that lives in the must-validate spike).
 */
describe('stepRouteReminderTick.integration', () => {
  given('[case1] an active drive + a reachable clone', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      const calls: { addr: string; what: string; timeoutMs?: number }[] = [];
      const sayToClone = async (say: {
        addr: string;
        what: string;
        timeoutMs?: number;
      }) => {
        calls.push(say);
        return { reached: true as const };
      };
      return { route, calls, sayToClone };
    });

    when('[t0] the tick runs', () => {
      const outcome = useBeforeAll(async () =>
        stepRouteReminderTick(
          { route: scene.route, cloneAddr: '@:driver-1', sayTimeoutMs: 30_000 },
          { sayToClone: scene.sayToClone },
        ),
      );

      then('the daemon nudges (stays alive)', () => {
        expect(outcome.action).toEqual('nudged');
      });

      then(
        'the nudge carries the prose payload + threaded say-timeout to the clone',
        () => {
          expect(scene.calls).toHaveLength(1);
          expect(scene.calls[0]).toEqual({
            addr: '@:driver-1',
            what: REMINDER_NUDGE_PROSE,
            timeoutMs: 30_000,
          });
        },
      );
    });
  });

  given('[case2] a blocked route (dead drive)', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      });
      const calls: { addr: string; what: string }[] = [];
      const sayToClone = async (say: { addr: string; what: string }) => {
        calls.push(say);
        return { reached: true as const };
      };
      return { route, calls, sayToClone };
    });

    when('[t0] the tick runs', () => {
      const outcome = useBeforeAll(async () =>
        stepRouteReminderTick(
          { route: scene.route, cloneAddr: '@:driver-1', sayTimeoutMs: 30_000 },
          { sayToClone: scene.sayToClone },
        ),
      );

      then('the daemon exits with reason route-not-live', () => {
        expect(outcome).toEqual({
          action: 'exit',
          reason: 'route-not-live',
          status: 'blocked',
        });
      });

      then('no nudge is sent to a dead drive', () => {
        expect(scene.calls).toHaveLength(0);
      });
    });
  });

  // the fail-closed clamp for the OTHER three dead statuses. case2 proves route-not-live self-exit
  // at the daemon-tick layer for `blocked` only; the pure predicate unit-tests all four, but the
  // integration/daemon-loop layer seeded only `blocked`. these cases seed a REAL passage.jsonl tail
  // of `rewound` / `exhausted` / `malfunction` and prove the tick self-exits (route-not-live, no
  // nudge) for each — so a refactor of the shared liveness map that regressed any one dead status
  // is caught at the daemon layer, not only in the pure predicate (rule.require.clamp-edge-cases).
  const DEAD_STATUSES = ['rewound', 'exhausted', 'malfunction'] as const;
  DEAD_STATUSES.forEach((status, index) => {
    given(`[case${5 + index}] a ${status} route (dead drive)`, () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status }],
        });
        const calls: { addr: string; what: string }[] = [];
        const sayToClone = async (say: { addr: string; what: string }) => {
          calls.push(say);
          return { reached: true as const };
        };
        return { route, calls, sayToClone };
      });

      when('[t0] the tick runs', () => {
        const outcome = useBeforeAll(async () =>
          stepRouteReminderTick(
            {
              route: scene.route,
              cloneAddr: '@:driver-1',
              sayTimeoutMs: 30_000,
            },
            { sayToClone: scene.sayToClone },
          ),
        );

        then('the daemon exits with reason route-not-live', () => {
          expect(outcome).toEqual({
            action: 'exit',
            reason: 'route-not-live',
            status,
          });
        });

        then('no nudge is sent to a dead drive', () => {
          expect(scene.calls).toHaveLength(0);
        });
      });
    });
  });

  given('[case4] a COMPLETED drive (tail = passed, every stone passed)', () => {
    // the daemon-layer completion clamp: a completed route writes the SAME `passed` tail as a
    // mid-route pause, so the status predicate alone reads it LIVE and (pre-fix) the tick nudged
    // a finished route forever — the wish's forbidden no-ifniloop. this fixture has a REAL stone
    // whose passage is `passed`, so the stone frontier is empty AND stones exist ⇒ complete ⇒ the
    // tick self-exits at the daemon layer (route-complete), with no nudge sent. RED before the tick
    // consulted getRouteReminderDriveActivity (it would have sent a nudge), GREEN after.
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      });
      // write the stone file so getAllStones enumerates it (frontier = empty ⇒ complete)
      await fs.writeFile(path.join(route, '1.vision.stone'), 'the vision\n');
      const calls: { addr: string; what: string }[] = [];
      const sayToClone = async (say: { addr: string; what: string }) => {
        calls.push(say);
        return { reached: true as const };
      };
      return { route, calls, sayToClone };
    });

    when('[t0] the tick runs', () => {
      const outcome = useBeforeAll(async () =>
        stepRouteReminderTick(
          { route: scene.route, cloneAddr: '@:driver-1', sayTimeoutMs: 30_000 },
          { sayToClone: scene.sayToClone },
        ),
      );

      then('the daemon exits with reason route-complete', () => {
        expect(outcome).toEqual({
          action: 'exit',
          reason: 'route-complete',
          status: 'passed',
        });
      });

      then('no nudge is sent to a completed drive', () => {
        expect(scene.calls).toHaveLength(0);
      });
    });
  });

  given(
    '[case3] an active drive but an unreachable clone (dead session)',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        });
        const sayToClone = async () => ({
          reached: false as const,
          reason: 'clone not LIVE',
        });
        return { route, sayToClone };
      });

      when('[t0] the tick runs', () => {
        const outcome = useBeforeAll(async () =>
          stepRouteReminderTick(
            {
              route: scene.route,
              cloneAddr: '@:driver-1',
              sayTimeoutMs: 30_000,
            },
            { sayToClone: scene.sayToClone },
          ),
        );

        then('the daemon exits with reason session-dead (anti-clog)', () => {
          expect(outcome).toEqual({
            action: 'exit',
            reason: 'session-dead',
            status: 'arrived',
          });
        });
      });
    },
  );
});

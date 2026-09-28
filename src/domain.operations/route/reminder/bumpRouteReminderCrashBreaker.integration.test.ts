import { given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { bumpRouteReminderCrashBreaker } from './bumpRouteReminderCrashBreaker';
import { delRouteReminderCrashBreaker } from './delRouteReminderCrashBreaker';
import { getRouteReminderCrashBreaker } from './getRouteReminderCrashBreaker';

/**
 * .what = integration cases for the RouteReminder auto-respawn crash-breaker leaves (get/bump/del)
 * .why = the breaker persists the consecutive crash-on-arrival count per session on disk; the
 *        auto-wire reads it to trip the spawn-storm cutoff. these leaves cross the fs boundary (real
 *        .route/*.crashes file), so they are proven against real files — the read default, the atomic
 *        append-increment, the idempotent reset, and the no-lost-increment guarantee under concurrency.
 */
describe('bumpRouteReminderCrashBreaker.integration', () => {
  given('[case1] a session with no crash-breaker state yet', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      });
      return { route };
    });

    when('[t0] the breaker is read before any bump', () => {
      const breaker = useBeforeAll(async () =>
        getRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-a',
        }),
      );

      then('it defaults to zero — an absent file is no crashes', () => {
        expect(breaker.count).toEqual(0);
      });
    });
  });

  given('[case2] a session whose breaker is bumped three times', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      });
      return { route };
    });

    when('[t0] three consecutive bumps land', () => {
      const result = useBeforeAll(async () => {
        const counts: number[] = [];
        for (let i = 0; i < 3; i += 1) {
          const { state } = await bumpRouteReminderCrashBreaker({
            route: scene.route,
            cloneAddr: '@:clone-b',
          });
          counts.push(state.count);
        }
        const persisted = await getRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-b',
        });
        return { counts, persistedCount: persisted.count };
      });

      then('each bump increments the returned count', () => {
        expect(result.counts).toEqual([1, 2, 3]);
      });

      then('the persisted count matches the last bump', () => {
        expect(result.persistedCount).toEqual(3);
      });
    });
  });

  given('[case3] a bumped breaker that is then reset', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      });
      return { route };
    });

    when('[t0] the breaker is bumped, then deleted', () => {
      const result = useBeforeAll(async () => {
        await bumpRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-c',
        });
        await bumpRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-c',
        });
        const before = await getRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-c',
        });

        await delRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-c',
        });
        const after = await getRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-c',
        });

        // a second del on an already-absent file is a benign no-op (idempotent)
        await delRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-c',
        });

        return { beforeCount: before.count, afterCount: after.count };
      });

      then('the reset drops the count back to zero', () => {
        expect(result.beforeCount).toEqual(2);
        expect(result.afterCount).toEqual(0);
      });
    });
  });

  given('[case4] two sessions on one route bump independently', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      });
      return { route };
    });

    when('[t0] one session bumps, the other does not', () => {
      const result = useBeforeAll(async () => {
        await bumpRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-x',
        });
        const x = await getRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-x',
        });
        const y = await getRouteReminderCrashBreaker({
          route: scene.route,
          cloneAddr: '@:clone-y',
        });
        return { xCount: x.count, yCount: y.count };
      });

      then(
        'each session keeps its own count — per-session, never shared',
        () => {
          expect(result.xCount).toEqual(1);
          expect(result.yCount).toEqual(0);
        },
      );
    });
  });

  given(
    '[case5] a spawn-storm fires many bumps concurrently on one session',
    () => {
      // the atomicity clamp — the whole reason the breaker is append-only. the OLD read-modify-write
      // (read count → +1 → overwrite) could interleave: two hooks both read N, both write N+1, and one
      // increment is silently LOST — an under-count of the streak at the exact moment a real spawn-storm
      // fires many route.drive hooks near-together, so the cutoff latches late or never. N concurrent
      // O_APPEND appends must EACH land, so the final count is EXACTLY N. this goes RED under the old
      // read-modify-write (lost increments → count < N) and GREEN under the atomic append
      // (rule.require.clamp-edge-cases, rule.forbid.behavior-hazards — no unguarded read-modify-write).
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [{ stone: '1.vision', status: 'passed' }],
        });
        return { route };
      });

      when('[t0] twenty bumps race in parallel', () => {
        const result = useBeforeAll(async () => {
          await Promise.all(
            Array.from({ length: 20 }, () =>
              bumpRouteReminderCrashBreaker({
                route: scene.route,
                cloneAddr: '@:clone-race',
              }),
            ),
          );
          const persisted = await getRouteReminderCrashBreaker({
            route: scene.route,
            cloneAddr: '@:clone-race',
          });
          return { persistedCount: persisted.count };
        });

        then(
          'every increment lands — the count is exactly twenty, none lost to a race',
          () => {
            expect(result.persistedCount).toEqual(20);
          },
        );
      });
    },
  );
});

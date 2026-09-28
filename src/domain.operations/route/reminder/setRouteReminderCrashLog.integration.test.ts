import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '@src/domain.operations/route/.test/genRouteWithPassage';

import { getRouteReminderCrashLogPath } from './getRouteReminderCrashLogPath';
import { setRouteReminderCrashLog } from './setRouteReminderCrashLog';

/**
 * .what = proves the malfunction crash log write end to end against a real fs
 * .why = the wisher accepted the first-fail self-exit ON THE CONDITION it is observable, not silent
 *        (vision, settled 2026-09-06). this proves the record lands, at a monotonic index that never
 *        overwrites a prior crash, with the session + reason a human needs.
 */
describe('setRouteReminderCrashLog.integration', () => {
  given('a fresh route with no prior crash records', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] the first crash is recorded', () => {
      const first = useBeforeAll(async () =>
        setRouteReminderCrashLog({
          route: scene.route,
          cloneAddr: '@:driver-1',
          reason: 'session-dead',
          ticks: 4,
        }),
      );

      then('it claims index 0 at the wisher-named path', () => {
        expect(first.index).toBe(0);
        expect(path.basename(first.path)).toBe('daemon.driveon._.crash.n0.log');
        expect(first.path).toBe(
          getRouteReminderCrashLogPath({ route: scene.route, index: 0 }),
        );
      });

      then('the record names the reason, session, and tick count', async () => {
        const body = await fs.readFile(first.path, 'utf8');
        expect(body).toContain('reason=session-dead');
        expect(body).toContain('clone:  @:driver-1');
        expect(body).toContain('ticks:  4');
        // the recovery note tells a human the reminder self-heals on the next live drive
        expect(body).toContain(
          're-findserts a fresh daemon on the next live drive',
        );
      });

      then(
        'it carries no wall-clock time (rule.forbid.timestamps)',
        async () => {
          const body = await fs.readFile(first.path, 'utf8');
          // an ISO time (T##:##) would be a forbidden timestamp; the mtime carries "when" instead
          expect(body).not.toMatch(/T\d{2}:\d{2}/);
        },
      );
    });

    when('[t1] a second crash is recorded on the same route', () => {
      const second = useBeforeAll(async () =>
        setRouteReminderCrashLog({
          route: scene.route,
          cloneAddr: '@:driver-1',
          reason: 'session-dead',
          ticks: 9,
        }),
      );

      then('it claims the next index — never overwrites the first', () => {
        expect(second.index).toBe(1);
        expect(path.basename(second.path)).toBe(
          'daemon.driveon._.crash.n1.log',
        );
      });

      then('both crash records persist side by side', async () => {
        const dir = path.dirname(second.path);
        const names = await fs.readdir(dir);
        const crashLogs = names
          .filter((name) => name.startsWith('daemon.driveon._.crash.n'))
          .sort();
        expect(crashLogs).toEqual([
          'daemon.driveon._.crash.n0.log',
          'daemon.driveon._.crash.n1.log',
        ]);
      });
    });
  });

  given('many crashes recorded CONCURRENTLY on one route', () => {
    // two daemons on one route can self-exit session-dead within microseconds. the OLD
    // readdir→max+1→writeFile claim was a non-atomic read-modify-write: concurrent callers compute
    // the SAME index and one silently overwrites the other's audit record. the `wx` create-exclusive
    // claim makes the filesystem elect one winner per slot, so every concurrent crash lands at a
    // DISTINCT index and no record is lost. this clamp goes red under the old plain writeFile (fewer
    // than N distinct files survive) and green under the atomic claim (rule.require.clamp-edge-cases).
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    const CRASH_COUNT = 8;

    when('[t0] eight crashes race to record at once', () => {
      const outcome = useBeforeAll(async () => {
        const results = await Promise.all(
          Array.from({ length: CRASH_COUNT }, (_, n) =>
            setRouteReminderCrashLog({
              route: scene.route,
              cloneAddr: `@:driver-${n}`,
              reason: 'session-dead',
              ticks: n,
            }),
          ),
        );
        const indices = results
          .map((result) => result.index)
          .sort((a, b) => a - b);
        const dir = path.dirname(results[0]!.path);
        const names = await fs.readdir(dir);
        const crashLogs = names.filter((name) =>
          name.startsWith('daemon.driveon._.crash.n'),
        );
        return { indices, crashLogCount: crashLogs.length };
      });

      then('every crash claims a DISTINCT index — none overwritten', () => {
        expect(new Set(outcome.indices).size).toBe(CRASH_COUNT);
        expect(outcome.indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      });

      then('all eight crash records persist side by side on disk', () => {
        expect(outcome.crashLogCount).toBe(CRASH_COUNT);
      });
    });
  });
});

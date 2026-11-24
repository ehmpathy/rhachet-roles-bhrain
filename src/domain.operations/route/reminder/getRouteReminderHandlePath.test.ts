import * as path from 'path';

import { getRouteReminderCrashBreakerPath } from './getRouteReminderCrashBreakerPath';
import { getRouteReminderFocusPath } from './getRouteReminderFocusPath';
import {
  DIR_OF_ROUTE_REMINDER_HANDLES,
  getRouteReminderHandlePath,
} from './getRouteReminderHandlePath';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = unit cases for getRouteReminderHandlePath — the one builder every clone handle delegates to
 * .why = the handle is keyed on the clone alone, so the pid, log, crash, and focus must share one
 *        dir and one clone token, and differ only by extension. these cases clamp that symmetry and
 *        the clone home under `.agent/.cache/`
 */
describe('getRouteReminderHandlePath', () => {
  const repoRoot = '/tmp/repo-sym';

  describe('[case1] the handle sits in the clone home, under the repo root', () => {
    test('the dir is .agent/.cache/repo=bhrain/role=driver/skill=route.reminder', () => {
      expect(DIR_OF_ROUTE_REMINDER_HANDLES).toEqual(
        path.join(
          '.agent',
          '.cache',
          'repo=bhrain',
          'role=driver',
          'skill=route.reminder',
        ),
      );
      expect(
        path.dirname(
          getRouteReminderHandlePath({
            repoRoot,
            cloneAddr: 'd1',
            ext: 'pid',
          }),
        ),
      ).toEqual(path.join(repoRoot, DIR_OF_ROUTE_REMINDER_HANDLES));
    });
  });

  // a detached daemon runs from another cwd, so a relative handle path would name another file in
  // each process. the builder resolves the root itself, so every handle is absolute and anchored on
  // the cwd that built it, whatever the caller passed
  describe('[case3] a relative repo root', () => {
    test('every handle is absolute, under the cwd, in one dir', () => {
      const paths = (['pid', 'log', 'crashes', 'focus'] as const).map((ext) =>
        getRouteReminderHandlePath({
          repoRoot: 'repo-rel',
          cloneAddr: 'd1',
          ext,
        }),
      );
      for (const handle of paths) expect(path.isAbsolute(handle)).toEqual(true);
      expect(new Set(paths.map((handle) => path.dirname(handle)))).toEqual(
        new Set([
          path.join(process.cwd(), 'repo-rel', DIR_OF_ROUTE_REMINDER_HANDLES),
        ]),
      );
    });
  });

  describe('[case2] the four extensions are one handle', () => {
    test('they share dir + clone token and differ ONLY by extension', () => {
      const stems = (['pid', 'log', 'crashes', 'focus'] as const).map((ext) =>
        getRouteReminderHandlePath({
          repoRoot,
          cloneAddr: '@feat/auth',
          ext,
        }).replace(new RegExp(`\\.${ext}$`), ''),
      );
      expect(new Set(stems).size).toEqual(1);
      expect(path.basename(stems[0]!)).toEqual(
        'daemon.of=reminder-driveon.session=~40feat~2fauth',
      );
    });

    test('each handle carries its full basename, extension included', () => {
      const names = (['pid', 'log', 'crashes', 'focus'] as const).map((ext) =>
        path.basename(
          getRouteReminderHandlePath({
            repoRoot,
            cloneAddr: '@feat/auth',
            ext,
          }),
        ),
      );
      expect(names).toEqual([
        'daemon.of=reminder-driveon.session=~40feat~2fauth.pid',
        'daemon.of=reminder-driveon.session=~40feat~2fauth.log',
        'daemon.of=reminder-driveon.session=~40feat~2fauth.crashes',
        'daemon.of=reminder-driveon.session=~40feat~2fauth.focus',
      ]);
    });

    test('the public builders delegate to it, one ext each', () => {
      const clone = { repoRoot, cloneAddr: 'd1' };
      expect(getRouteReminderPidPath(clone)).toEqual(
        getRouteReminderHandlePath({ ...clone, ext: 'pid' }),
      );
      expect(getRouteReminderLogPath(clone)).toEqual(
        getRouteReminderHandlePath({ ...clone, ext: 'log' }),
      );
      expect(getRouteReminderCrashBreakerPath(clone)).toEqual(
        getRouteReminderHandlePath({ ...clone, ext: 'crashes' }),
      );
      expect(getRouteReminderFocusPath(clone)).toEqual(
        getRouteReminderHandlePath({ ...clone, ext: 'focus' }),
      );
    });
  });
});

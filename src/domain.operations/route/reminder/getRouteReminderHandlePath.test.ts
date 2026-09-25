import * as path from 'path';

import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = unit cases for getRouteReminderHandlePath — the one builder pid + log delegate to
 * .why = both reviewers (r10 nitpick, r11 finding) flagged the SAME latent drift: the pid path
 *        pinned its route absolute, the log path did NOT, so a relative-route caller (e.g.
 *        surfaceRouteReminderFault with an unresolved `stepRouteDrive` route) could land the
 *        daemon's exit trace and the auto-sync fault line in TWO different files — defeating the
 *        one-log observability the reminder is built around. both flagged it "confirmed untested".
 *        these cases clamp the fix: one shared builder pins BOTH handles absolute, so pid and log
 *        cannot diverge on a relative route.
 */
describe('getRouteReminderHandlePath', () => {
  describe('[case1] a RELATIVE route is pinned absolute (the drift both reviewers flagged)', () => {
    test('pid and log agree on the same absolute .route/ base for a relative route', () => {
      // a relative `.` — the exact shape surfaceRouteReminderFault could hand in unresolved
      const pidPath = getRouteReminderPidPath({ route: '.', cloneAddr: 'd1' });
      const logPath = getRouteReminderLogPath({ route: '.', cloneAddr: 'd1' });
      // both must sit under the SAME absolute dir — never a relative `.route/` for one and an
      // absolute for the other (that split is the drift the fix forecloses)
      expect(path.isAbsolute(pidPath)).toEqual(true);
      expect(path.isAbsolute(logPath)).toEqual(true);
      expect(path.dirname(pidPath)).toEqual(path.dirname(logPath));
      // and that absolute base is the cwd's own .route/ (pinned absolute), not a literal './.route'.
      // process.cwd() names the boundary directly — path.resolve('.') folds the SAME cwd but reads
      // as a filesystem call on a relative path, which the unit-boundary rule lists as a remote
      // boundary a unit test must not lean on implicitly (rule.forbid.unit.remote-boundaries).
      expect(path.dirname(pidPath)).toEqual(path.join(process.cwd(), '.route'));
    });
  });

  describe('[case2] pid and log are symmetric — same handle, two extensions', () => {
    const route = '/tmp/route-sym';
    test('they share dir + session token and differ ONLY by the .pid / .log extension', () => {
      const pidPath = getRouteReminderHandlePath({
        route,
        cloneAddr: '@feat/auth',
        ext: 'pid',
      });
      const logPath = getRouteReminderHandlePath({
        route,
        cloneAddr: '@feat/auth',
        ext: 'log',
      });
      // strip the trailing extension; the remainder (dir + session token) must be identical
      expect(pidPath.replace(/\.pid$/, '')).toEqual(
        logPath.replace(/\.log$/, ''),
      );
      expect(path.basename(pidPath)).toEqual(
        'daemon.of=reminder-driveon.session=~40feat~2fauth.pid',
      );
      expect(path.basename(logPath)).toEqual(
        'daemon.of=reminder-driveon.session=~40feat~2fauth.log',
      );
    });

    test('the two public builders delegate to it — pid matches ext=pid, log matches ext=log', () => {
      expect(getRouteReminderPidPath({ route, cloneAddr: 'd1' })).toEqual(
        getRouteReminderHandlePath({ route, cloneAddr: 'd1', ext: 'pid' }),
      );
      expect(getRouteReminderLogPath({ route, cloneAddr: 'd1' })).toEqual(
        getRouteReminderHandlePath({ route, cloneAddr: 'd1', ext: 'log' }),
      );
    });
  });
});

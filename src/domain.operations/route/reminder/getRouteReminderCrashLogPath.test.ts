import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getRouteReminderCrashLogPath } from './getRouteReminderCrashLogPath';

describe('getRouteReminderCrashLogPath', () => {
  given('a route and a crash index', () => {
    when('the path is built', () => {
      const built = getRouteReminderCrashLogPath({
        route: '.behavior/my-feature',
        index: 3,
      });

      then('it sits under the route .malfunctions dir', () => {
        expect(built).toContain(`${path.sep}.malfunctions${path.sep}`);
      });

      then('the file is the indexed crash log the wisher named', () => {
        expect(path.basename(built)).toBe('daemon.driveon._.crash.n3.log');
      });

      then('the route is pinned absolute (never a relative dot form)', () => {
        expect(path.isAbsolute(built)).toBe(true);
      });
    });
  });

  given('two distinct indices on the same route', () => {
    when('both paths are built', () => {
      const first = getRouteReminderCrashLogPath({
        route: '.behavior/my-feature',
        index: 0,
      });
      const second = getRouteReminderCrashLogPath({
        route: '.behavior/my-feature',
        index: 1,
      });

      then('the index disambiguates them — no overwrite', () => {
        expect(first).not.toBe(second);
        expect(path.basename(first)).toBe('daemon.driveon._.crash.n0.log');
        expect(path.basename(second)).toBe('daemon.driveon._.crash.n1.log');
      });
    });
  });
});

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { isRouteReminderFocusOn } from './isRouteReminderFocusOn';
import { setRouteReminderFocus } from './setRouteReminderFocus';

/**
 * .what = integration cases for isRouteReminderFocusOn
 * .why = the drive's dead-arm reap and the tick's exit door both gate on it, so a concurrent drive
 *        that moved the focus is never reaped or abandoned. it reads the real focus file
 */
describe('isRouteReminderFocusOn.integration', () => {
  given('[case1] a clone whose focus names route B', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-focus-on-'),
      );
      const clone = { repoRoot, cloneAddr: '@:driver-1' };
      const routeA = path.join(repoRoot, '.behavior', 'v1.a');
      const routeB = path.join(repoRoot, '.behavior', 'v1.b');
      await setRouteReminderFocus({ ...clone, route: routeA });
      await setRouteReminderFocus({ ...clone, route: routeB });
      return { clone, routeA, routeB };
    });

    when('[t0] it is asked about each route', () => {
      then('route B, the focus now, reads true', async () => {
        expect(
          await isRouteReminderFocusOn({ ...scene.clone, route: scene.routeB }),
        ).toEqual(true);
      });

      then('route A, the focus before, reads false', async () => {
        expect(
          await isRouteReminderFocusOn({ ...scene.clone, route: scene.routeA }),
        ).toEqual(false);
      });

      then('a relative form of route B reads true', async () => {
        const relative = path.relative(process.cwd(), scene.routeB);
        expect(
          await isRouteReminderFocusOn({ ...scene.clone, route: relative }),
        ).toEqual(true);
      });
    });
  });

  given('[case2] a clone whose focus was never written', () => {
    const scene = useBeforeAll(async () => ({
      repoRoot: await fs.mkdtemp(path.join(os.tmpdir(), 'reminder-focus-on-')),
    }));

    when('[t0] it is asked about a route', () => {
      then('it reads false', async () => {
        expect(
          await isRouteReminderFocusOn({
            repoRoot: scene.repoRoot,
            cloneAddr: '@:driver-1',
            route: path.join(scene.repoRoot, '.behavior', 'v1.a'),
          }),
        ).toEqual(false);
      });
    });
  });
});

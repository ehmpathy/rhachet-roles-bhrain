import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { isRouteReminderRefocusOwed } from './isRouteReminderRefocusOwed';
import { setRouteReminderFocus } from './setRouteReminderFocus';

/**
 * .what = integration cases for isRouteReminderRefocusOwed
 * .why = the tick's decision to judge the focus afresh, rather than exit on a dead read. the tick
 *        reads the focus, then the route's activity; a drive that moves the focus between the two
 *        reads is exactly the state this op sees. it reads the real focus file
 */
describe('isRouteReminderRefocusOwed.integration', () => {
  given(
    '[case1] a tick read route A dead, and a drive has since moved the focus to B',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-refocus-'),
        );
        const clone = { repoRoot, cloneAddr: '@:driver-1' };
        const routeA = path.join(repoRoot, '.behavior', 'v1.a');
        const routeB = path.join(repoRoot, '.behavior', 'v1.b');
        await setRouteReminderFocus({ ...clone, route: routeA });
        await setRouteReminderFocus({ ...clone, route: routeB });
        return { clone, routeA };
      });

      when('[t0] one refocus is left', () => {
        then('a fresh judgment is owed', async () => {
          expect(
            await isRouteReminderRefocusOwed({
              ...scene.clone,
              route: scene.routeA,
              isActive: false,
              refocusesLeft: 1,
            }),
          ).toEqual(true);
        });
      });

      when('[t1] no refocus is left', () => {
        then('none is owed, so a flap cannot spin the tick', async () => {
          expect(
            await isRouteReminderRefocusOwed({
              ...scene.clone,
              route: scene.routeA,
              isActive: false,
              refocusesLeft: 0,
            }),
          ).toEqual(false);
        });
      });

      when('[t2] the route read was live after all', () => {
        then('none is owed; a live focus is nudged as read', async () => {
          expect(
            await isRouteReminderRefocusOwed({
              ...scene.clone,
              route: scene.routeA,
              isActive: true,
              refocusesLeft: 1,
            }),
          ).toEqual(false);
        });
      });
    },
  );

  given('[case2] a tick read route A dead, and the focus still names A', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-refocus-'),
      );
      const clone = { repoRoot, cloneAddr: '@:driver-1' };
      const routeA = path.join(repoRoot, '.behavior', 'v1.a');
      await setRouteReminderFocus({ ...clone, route: routeA });
      return { clone, routeA };
    });

    when('[t0] one refocus is left', () => {
      then('none is owed; the tick exits on the dead focus', async () => {
        expect(
          await isRouteReminderRefocusOwed({
            ...scene.clone,
            route: scene.routeA,
            isActive: false,
            refocusesLeft: 1,
          }),
        ).toEqual(false);
      });
    });
  });
});

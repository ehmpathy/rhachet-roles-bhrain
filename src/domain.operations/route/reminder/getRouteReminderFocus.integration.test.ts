import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRouteReminderFocus } from './getRouteReminderFocus';
import { getRouteReminderFocusPath } from './getRouteReminderFocusPath';

/**
 * .what = integration cases for the focus read: absent and empty read as no focus
 * .why = the tick exits `route-not-live` on no focus. a focus file that is absent, or empty from a
 *        hand edit, must read as none — never as a route named ''
 */
describe('getRouteReminderFocus.integration', () => {
  given('[case1] a repo root with no focus file', () => {
    when('[t0] the focus is read', () => {
      then('it reads null', async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-focus-get-'),
        );
        expect(
          await getRouteReminderFocus({ repoRoot, cloneAddr: '@:driver-1' }),
        ).toEqual(null);
      });
    });
  });

  given('[case2] a focus file that is empty, and one with a route', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-focus-get-'),
      );
      const emptyClone = { repoRoot, cloneAddr: '@:driver-1' };
      const fullClone = { repoRoot, cloneAddr: '@:driver-2' };
      const emptyPath = getRouteReminderFocusPath(emptyClone);
      await fs.mkdir(path.dirname(emptyPath), { recursive: true });
      await fs.writeFile(emptyPath, '  \n');
      await fs.writeFile(
        getRouteReminderFocusPath(fullClone),
        '/repo/.behavior/v1.a\n',
      );
      return { emptyClone, fullClone };
    });

    when('[t0] each focus is read', () => {
      then('the empty one reads null', async () => {
        expect(await getRouteReminderFocus(scene.emptyClone)).toEqual(null);
      });

      then('the full one reads its route, trimmed', async () => {
        expect(await getRouteReminderFocus(scene.fullClone)).toEqual({
          route: '/repo/.behavior/v1.a',
        });
      });
    });
  });
});

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRouteReminderFocusPath } from './getRouteReminderFocusPath';
import { setRouteReminderFocus } from './setRouteReminderFocus';

/**
 * .what = integration cases for the focus write: absolute, atomic, and only on change
 * .why = the focus is the seam from drive to daemon. a relative path would read against the
 *        daemon's cwd, a torn write would hand the tick half a path, and a write per drive would
 *        churn the file on every hook. each is clamped here against the real fs
 */
describe('setRouteReminderFocus.integration', () => {
  given('[case1] a repo root with no focus yet', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-focus-set-'),
      );
      const clone = { repoRoot, cloneAddr: '@:driver-1' };
      return { repoRoot, clone, focusPath: getRouteReminderFocusPath(clone) };
    });

    when('[t0] the focus is set to a route', () => {
      const result = useBeforeAll(async () =>
        setRouteReminderFocus({
          ...scene.clone,
          route: path.join(scene.repoRoot, '.behavior', 'v1.a'),
        }),
      );

      then('it reports a change', () => {
        expect(result).toEqual({ changed: true });
      });

      then('the file holds the absolute route and a newline', async () => {
        expect(await fs.readFile(scene.focusPath, 'utf-8')).toEqual(
          `${path.join(scene.repoRoot, '.behavior', 'v1.a')}\n`,
        );
      });

      then(
        'the handle dir ignores itself, and no temp file is left',
        async () => {
          const names = await fs.readdir(path.dirname(scene.focusPath));
          expect([...names].sort()).toEqual(
            ['.gitignore', path.basename(scene.focusPath)].sort(),
          );
        },
      );
    });

    when('[t1] the focus is set to the same route again', () => {
      then('it reports no change', async () => {
        const again = await setRouteReminderFocus({
          ...scene.clone,
          route: path.join(scene.repoRoot, '.behavior', 'v1.a'),
        });
        expect(again).toEqual({ changed: false });
      });
    });

    when('[t2] the focus is set to another route, given relative', () => {
      then('it reports a change, and stores the absolute form', async () => {
        const relative = path.relative(
          process.cwd(),
          path.join(scene.repoRoot, '.behavior', 'v1.b'),
        );
        const moved = await setRouteReminderFocus({
          ...scene.clone,
          route: relative,
        });
        expect(moved).toEqual({ changed: true });
        expect(await fs.readFile(scene.focusPath, 'utf-8')).toEqual(
          `${path.join(scene.repoRoot, '.behavior', 'v1.b')}\n`,
        );
      });
    });
  });
});

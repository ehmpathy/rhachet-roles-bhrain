import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { delRouteReminderPidHandleIfPid } from './delRouteReminderPidHandleIfPid';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = integration cases for delRouteReminderPidHandleIfPid — the compare-and-delete guard
 * .why = this is the race guard behind delRouteReminder's teardown. the kill-then-rm hazard was:
 *        a concurrent register claims a FRESH handle (new pid) between the read and the rm, and
 *        an unconditional rm deletes THAT handle, left with an orphan of a live daemon. this
 *        clamps the fix — the rm removes the handle ONLY when it still names the pid the caller
 *        stopped, and NEVER when a newer pid holds it. the pid values need not be real processes:
 *        the guard is a pure content compare against the handle bytes.
 */
const CLONE_ADDR = '@:driver-1';

describe('delRouteReminderPidHandleIfPid.integration', () => {
  given('[case1] a handle that names pid 1111', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'reminder-cad-'));
      await fs.mkdir(path.join(route, '.route'), { recursive: true });
      const pidPath = getRouteReminderPidPath({ route, cloneAddr: CLONE_ADDR });
      await fs.writeFile(pidPath, '1111');
      return { route, pidPath };
    });

    when('[t0] a teardown for a DIFFERENT pid (2222) runs', () => {
      const outcome = useBeforeAll(async () =>
        delRouteReminderPidHandleIfPid({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
          pid: 2222,
        }),
      );

      then('it does NOT remove the handle (it names a newer pid)', () => {
        expect(outcome.removed).toBe(false);
      });

      then(
        'the handle is left intact — no orphan of the newer daemon',
        async () => {
          const raw = await fs.readFile(scene.pidPath, 'utf-8');
          // the guarantee that carries the fix: a teardown never deletes a handle that names a
          // different pid than the one it stopped
          expect(raw.trim()).toEqual('1111');
        },
      );
    });

    when('[t1] a teardown for the MATCHING pid (1111) runs', () => {
      const outcome = useBeforeAll(async () =>
        delRouteReminderPidHandleIfPid({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
          pid: 1111,
        }),
      );

      then('it removes the handle (it still names the stopped pid)', () => {
        expect(outcome.removed).toBe(true);
      });

      then('the handle file is gone', async () => {
        const present = await fs
          .stat(scene.pidPath)
          .then(() => true)
          .catch((error: unknown) => {
            if ((error as { code?: string }).code === 'ENOENT') return false;
            throw error;
          });
        expect(present).toBe(false);
      });
    });
  });

  given('[case2] an absent handle', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'reminder-cad-'));
      await fs.mkdir(path.join(route, '.route'), { recursive: true });
      return { route };
    });

    when('[t0] a teardown runs over the absent handle', () => {
      then('it is an idempotent no-op (removed:false)', async () => {
        const outcome = await delRouteReminderPidHandleIfPid({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
          pid: 1111,
        });
        expect(outcome.removed).toBe(false);
      });
    });
  });
});

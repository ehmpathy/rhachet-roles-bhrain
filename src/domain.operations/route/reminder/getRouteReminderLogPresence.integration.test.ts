import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { getRouteReminderLogPresence } from './getRouteReminderLogPresence';

/**
 * .what = integration cases for getRouteReminderLogPresence — the "was a daemon EVER registered?"
 *         discriminator behind `route.reminder.get`'s two distinct not-live messages.
 * .why = a bare "not live" cannot tell "never registered" from "registered then went quiet" — both
 *        leave an absent pid handle. the log file is the tiebreaker: it exists iff a daemon spawned
 *        and PERSISTS past self-exit (only the pid handle is reaped). these cases clamp that the op
 *        reads log-presence, not liveness, so the CLI's discriminated message cannot regress to one
 *        undifferentiated string (rule.require.status-feedback).
 */
const CLONE_ADDR = '@:driver-1';

const genRouteDir = async (): Promise<string> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'reminder-logpres-'));
  await fs.mkdir(path.join(route, '.route'), { recursive: true });
  return route;
};

describe('getRouteReminderLogPresence.integration', () => {
  given(
    '[case1] a session that never registered a daemon (no log file)',
    () => {
      const scene = useBeforeAll(async () => ({ route: await genRouteDir() }));

      when('[t0] log-presence is read', () => {
        then(
          'it reports present:false — no daemon was ever registered',
          async () => {
            const result = await getRouteReminderLogPresence({
              route: scene.route,
              cloneAddr: CLONE_ADDR,
            });
            expect(result).toEqual({ present: false });
          },
        );
      });
    },
  );

  given(
    '[case2] a session whose daemon left a log, then the pid handle was reaped',
    () => {
      const scene = useBeforeAll(async () => {
        const route = await genRouteDir();
        // the daemon opens the log on spawn; simulate a registered-then-exited session with a log file
        // present (as the spawn leaves it) and NO pid handle (as a reap leaves it) — the "went quiet" state
        const logPath = getRouteReminderLogPath({
          route,
          cloneAddr: CLONE_ADDR,
        });
        await fs.writeFile(
          logPath,
          'route.reminder.daemon exited reason=session-dead\n',
        );
        return { route };
      });

      when('[t0] log-presence is read', () => {
        then(
          'it reports present:true — a daemon WAS registered (now gone quiet)',
          async () => {
            const result = await getRouteReminderLogPresence({
              route: scene.route,
              cloneAddr: CLONE_ADDR,
            });
            expect(result).toEqual({ present: true });
          },
        );
      });
    },
  );
});

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { delRouteReminder } from './delRouteReminder';
import { getRouteReminderFocusPath } from './getRouteReminderFocusPath';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';
import { isProcessAlive } from './isProcessAlive';
import { setRouteReminderFocus } from './setRouteReminderFocus';
import { stopProcess } from './stopProcess';

// a REAL live process stands in for a daemon; the teardown signals it, so it is never this worker
const genSleeper = (): number => {
  const child = spawn('sleep', ['300'], { detached: true, stdio: 'ignore' });
  child.unref();
  if (!child.pid) throw new Error('failed to spawn a sleeper');
  return child.pid;
};

// poll until the OS reaps a signalled pid, so a liveness assertion reads a settled state
const awaitDead = async (input: { pid: number }): Promise<void> => {
  for (let tries = 0; tries < 200 && isProcessAlive(input); tries += 1)
    await new Promise((wake) => setTimeout(wake, 10));
};

/**
 * .what = integration cases for the clone teardown with a legacy daemon beside it
 * .why = the teardown is the clone's alone: it clears the clone log when it owns the clone handle,
 *        and it never reads the legacy per-route handles, since a drive reaps through it on every
 *        hook. this clamps that a deliberate teardown leaves no log line for `get` to misread, that
 *        the legacy daemon is left to the sweep, and that the focus survives the teardown
 */
describe('delRouteReminder.integration', () => {
  given(
    '[case1] a live clone daemon, its focus, and a live legacy daemon of the same clone',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-del-'),
        );
        const clone = { repoRoot, cloneAddr: '@:driver-1' };

        // the clone daemon: a live pid in the clone handle, a focus, and a prior log line
        const clonePid = genSleeper();
        const pidPath = getRouteReminderPidPath(clone);
        await fs.mkdir(path.dirname(pidPath), { recursive: true });
        await fs.writeFile(pidPath, String(clonePid));
        await fs.writeFile(getRouteReminderLogPath(clone), 'prior line\n');
        await setRouteReminderFocus({
          ...clone,
          route: path.join(repoRoot, '.behavior', 'v2.now'),
        });

        // the legacy daemon: a live pid in a per-route handle
        const legacyPid = genSleeper();
        const legacyDir = path.join(repoRoot, '.behavior', 'v1.old', '.route');
        await fs.mkdir(legacyDir, { recursive: true });
        const legacyPidPath = path.join(
          legacyDir,
          'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
        );
        await fs.writeFile(legacyPidPath, String(legacyPid));
        return { clone, clonePid, legacyPid, legacyPidPath };
      });
      afterAll(() => {
        for (const pid of [scene.clonePid, scene.legacyPid])
          if (isProcessAlive({ pid })) stopProcess({ pid, signal: 'SIGKILL' });
      });

      when('[t0] the clone reminder is torn down', () => {
        const result = useBeforeAll(async () => delRouteReminder(scene.clone));

        then('it reports the clone daemon stopped', () => {
          expect(result).toEqual({ stopped: true, torn: null });
        });

        then('the clone daemon is gone', async () => {
          await awaitDead({ pid: scene.clonePid });
          expect(isProcessAlive({ pid: scene.clonePid })).toEqual(false);
        });

        then(
          'the legacy daemon and its handle are left to the sweep',
          async () => {
            expect(isProcessAlive({ pid: scene.legacyPid })).toEqual(true);
            expect(await fs.readFile(scene.legacyPidPath, 'utf-8')).toEqual(
              String(scene.legacyPid),
            );
          },
        );

        then(
          'the clone log is gone — no reap line is left for `get` to misread as a quiet daemon',
          async () => {
            const log = await withEnoentAsNull(() =>
              fs.readFile(getRouteReminderLogPath(scene.clone), 'utf-8'),
            );
            expect(log).toEqual(null);
          },
        );

        then('the focus survives the teardown', async () => {
          expect(
            await fs.readFile(getRouteReminderFocusPath(scene.clone), 'utf-8'),
          ).toEqual(
            `${path.join(scene.clone.repoRoot, '.behavior', 'v2.now')}\n`,
          );
        });
      });
    },
  );

  given('[case2] a torn clone handle (its body is not a pid)', () => {
    // a torn handle makes every strict read throw, so the clone gets no reminder until the file
    // goes. the teardown is the verb a human reaches for: it must clear the file, never die on it.
    // red under the strict-read-first teardown (it throws RouteReminderPidMalformedError)
    const scene = useBeforeAll(async () => {
      const repoRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-del-torn-'),
      );
      const clone = { repoRoot, cloneAddr: '@:driver-1' };
      const pidPath = getRouteReminderPidPath(clone);
      await fs.mkdir(path.dirname(pidPath), { recursive: true });
      await fs.writeFile(pidPath, '12x');
      return { clone, pidPath };
    });

    when('[t0] the clone reminder is torn down', () => {
      const result = useBeforeAll(async () => delRouteReminder(scene.clone));

      then(
        'it reports the torn handle it cleared, and no daemon stopped',
        () => {
          expect(result).toEqual({
            stopped: false,
            torn: { pidPath: scene.pidPath, raw: '12x' },
          });
        },
      );

      then('the torn handle is gone', async () => {
        expect(
          await withEnoentAsNull(() => fs.readFile(scene.pidPath, 'utf-8')),
        ).toEqual(null);
      });
    });

    when('[t1] the teardown runs again', () => {
      then('it is a no-op on the empty slot', async () => {
        expect(await delRouteReminder(scene.clone)).toEqual({
          stopped: false,
          torn: null,
        });
      });
    });
  });
});

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { delRouteReminderLegacyHandles } from './delRouteReminderLegacyHandles';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { isProcessAlive } from './isProcessAlive';
import { stopProcess } from './stopProcess';

// a REAL live process stands in for a legacy daemon; the sweep signals it, so it is never this worker
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
 * .what = integration cases for the legacy per-route sweep
 * .why = a daemon spawned before one-per-clone holds a per-route handle under either route root.
 *        the sweep reaps each one and returns its outcome; it writes no log, so the caller picks
 *        the channel
 */
describe('delRouteReminderLegacyHandles.integration', () => {
  given(
    '[case1] a live legacy daemon of the clone on a `.route/` route',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-legacy-sweep-'),
        );
        const clone = { repoRoot, cloneAddr: '@:driver-1' };
        const legacyPid = genSleeper();
        const legacyDir = path.join(repoRoot, '.route', 'v1.bound', '.route');
        await fs.mkdir(legacyDir, { recursive: true });
        const legacyPidPath = path.join(
          legacyDir,
          'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
        );
        await fs.writeFile(legacyPidPath, String(legacyPid));
        return { clone, legacyPid, legacyPidPath };
      });
      afterAll(() => {
        if (isProcessAlive({ pid: scene.legacyPid }))
          stopProcess({ pid: scene.legacyPid, signal: 'SIGKILL' });
      });

      when('[t0] the sweep runs', () => {
        const result = useBeforeAll(async () =>
          delRouteReminderLegacyHandles(scene.clone),
        );

        then('the legacy daemon under `.route/` is reaped', async () => {
          expect(result).toEqual({
            outcomes: [
              {
                kind: 'reaped',
                pid: scene.legacyPid,
                pidPath: scene.legacyPidPath,
                signalled: true,
              },
            ],
          });
          await awaitDead({ pid: scene.legacyPid });
          expect(isProcessAlive({ pid: scene.legacyPid })).toEqual(false);
        });

        then('its handle is removed', async () => {
          const pid = await withEnoentAsNull(() =>
            fs.readFile(scene.legacyPidPath, 'utf-8'),
          );
          expect(pid).toEqual(null);
        });

        then('no clone log is written', async () => {
          const log = await withEnoentAsNull(() =>
            fs.readFile(getRouteReminderLogPath(scene.clone), 'utf-8'),
          );
          expect(log).toEqual(null);
        });
      });

      when('[t1] the sweep runs again', () => {
        const result = useBeforeAll(async () =>
          delRouteReminderLegacyHandles(scene.clone),
        );

        then('it finds naught to reap', () => {
          expect(result).toEqual({ outcomes: [{ kind: 'absent' }] });
        });
      });
    },
  );

  given(
    '[case2] a stale legacy pid file — its daemon already exited (the pre-fix norm)',
    () => {
      // a pre-fix daemon never dropped its own pid file, so a dead-pid file is common on upgrade day.
      // the sweep clears it, and must not report it as a stopped daemon
      const scene = useBeforeAll(async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-legacy-stale-'),
        );
        const clone = { repoRoot, cloneAddr: '@:driver-1' };
        const deadPid = genSleeper();
        stopProcess({ pid: deadPid, signal: 'SIGKILL' });
        await awaitDead({ pid: deadPid });
        const legacyDir = path.join(repoRoot, '.behavior', 'v1.old', '.route');
        await fs.mkdir(legacyDir, { recursive: true });
        const legacyPidPath = path.join(
          legacyDir,
          'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
        );
        await fs.writeFile(legacyPidPath, String(deadPid));
        return { clone, deadPid, legacyPidPath };
      });

      when('[t0] the sweep runs', () => {
        const result = useBeforeAll(async () =>
          delRouteReminderLegacyHandles(scene.clone),
        );

        then('it clears the file and says no daemon was signalled', () => {
          expect(result).toEqual({
            outcomes: [
              {
                kind: 'reaped',
                pid: scene.deadPid,
                pidPath: scene.legacyPidPath,
                signalled: false,
              },
            ],
          });
        });

        then('the stale file is gone', async () => {
          expect(
            await withEnoentAsNull(() =>
              fs.readFile(scene.legacyPidPath, 'utf-8'),
            ),
          ).toEqual(null);
        });
      });
    },
  );
});

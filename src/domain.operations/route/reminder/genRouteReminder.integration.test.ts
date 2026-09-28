import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genRouteReminder } from './genRouteReminder';
import { getRouteReminder } from './getRouteReminder';
import { isProcessAlive } from './isProcessAlive';
import { readRouteReminderRawPid } from './readRouteReminderRawPid';
import { stopProcess } from './stopProcess';

/**
 * .what = integration cases for genRouteReminder's OWN findsert postcondition — it reports `alive`
 *         and reconciles a crash-on-arrival handle ITSELF, so no caller re-derives that check.
 * .why = r011 (i022) escalated a scope leak: the "did the spawn actually converge?" detection +
 *         handle-reconcile lived in BOTH the auto-wire and the CLI. it now lives once, inside the
 *         findsert. these cases clamp that owned postcondition against a REAL dead pid (never a
 *         mocked isProcessAlive), so a regression that dropped the internal probe/reconcile — one
 *         that shoved it back onto callers — is caught here (rule.require.clamp-edge-cases, rule.require.directional-deps).
 *
 * .mock = `spawnDaemon` is injected via genRouteReminder's OWN declared `context` seam
 *         (rule.require.dependency-injection) — never a `jest.mock`/`jest.spyOn` of a global, so
 *         this is not the mock class rule.forbid.integration.mocks forbids. it returns a REAL
 *         pid (`process.pid`, or a genuinely-spawned-then-SIGKILLed pid from `genDeadPid` below),
 *         so every isProcessAlive/`kill -0` probe downstream still reads a true OS process, never
 *         a faked liveness value.
 * .why mock = a real detached-spawn chain (bash → node -e → import → child_process.spawn) is
 *         proven once, exhaustively, in blackbox/driver.route.reminder.acceptance.test.ts (case4)
 *         — this file's job is genRouteReminder's OWN findsert/reconcile logic in isolation,
 *         which needs only a real pid, not a real spawn.
 */

// a REAL but already-dead pid: spawn a sleeper, SIGKILL it, poll until the OS reaps it. handed to a
// fake spawn, it stands in for a daemon that crashed before its first tick (a boot failure).
const genDeadPid = async (): Promise<number> => {
  const child = spawn('sleep', ['300'], { detached: true, stdio: 'ignore' });
  child.unref();
  const pid = child.pid;
  if (!pid) throw new Error('failed to spawn sleeper for a dead pid');
  stopProcess({ pid, signal: 'SIGKILL' });
  for (let tries = 0; tries < 200 && isProcessAlive({ pid }); tries += 1)
    await new Promise((wake) => setTimeout(wake, 10));
  return pid;
};

const genRouteDir = async (): Promise<string> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'gen-reminder-'));
  await fs.mkdir(path.join(route, '.route'), { recursive: true });
  return route;
};

describe('genRouteReminder.integration', () => {
  given('[case1] a fresh spawn that boots and stays alive', () => {
    const scene = useBeforeAll(async () => ({ route: await genRouteDir() }));

    when('[t0] the reminder is findserted', () => {
      then('it reports created + alive, and the handle is live', async () => {
        // the fake host returns THIS jest process's own (live) pid, so the probe reads it alive
        const result = await genRouteReminder(
          {
            route: scene.route,
            cloneAddr: '@:driver-1',
            intervalMs: null,
            sayTimeoutMs: null,
          },
          { spawnDaemon: async () => ({ pid: process.pid }) },
        );
        expect(result).toEqual({
          pid: process.pid,
          created: true,
          alive: true,
        });

        // the claimed handle is present + live
        const found = await getRouteReminder({
          route: scene.route,
          cloneAddr: '@:driver-1',
        });
        expect(found).toEqual({ pid: process.pid });
      });
    });
  });

  given('[case2] a fresh spawn that crashes on arrival (dead pid)', () => {
    const scene = useBeforeAll(async () => ({
      route: await genRouteDir(),
      deadPid: await genDeadPid(),
    }));

    when('[t0] the reminder is findserted', () => {
      then(
        'genRouteReminder OWNS the postcondition — reports created + NOT alive, and reconciles the dead handle itself',
        async () => {
          const result = await genRouteReminder(
            {
              route: scene.route,
              cloneAddr: '@:driver-1',
              intervalMs: null,
              sayTimeoutMs: null,
            },
            { spawnDaemon: async () => ({ pid: scene.deadPid }) },
          );
          // the findsert detects its own crash-on-arrival: created, but not alive
          expect(result).toEqual({
            pid: scene.deadPid,
            created: true,
            alive: false,
          });

          // and it reconciled the dead handle ITSELF — no caller had to. assert the raw handle FILE
          // is gone (readRouteReminderRawPid reads the file, not liveness), which proves the
          // compare-and-delete ran INSIDE the findsert. this is the biting assertion: getRouteReminder
          // would read null for any dead pid regardless of the file, so it cannot prove the reconcile —
          // only the raw-file read goes RED if the internal del is dropped (rule.require.clamp-edge-cases).
          const rawAfter = await readRouteReminderRawPid({
            route: scene.route,
            cloneAddr: '@:driver-1',
          });
          expect(rawAfter).toEqual(null);
        },
      );
    });
  });

  given('[case3] a findsert hit — a live daemon already answers', () => {
    const scene = useBeforeAll(async () => ({ route: await genRouteDir() }));

    when('[t0] the reminder is findserted twice', () => {
      then(
        'the second call returns the extant daemon, created:false + alive, spawns none',
        async () => {
          let spawnCount = 0;
          const spawnDaemon = async (): Promise<{ pid: number }> => {
            spawnCount += 1;
            return { pid: process.pid };
          };

          const first = await genRouteReminder(
            {
              route: scene.route,
              cloneAddr: '@:driver-1',
              intervalMs: null,
              sayTimeoutMs: null,
            },
            { spawnDaemon },
          );
          expect(first).toEqual({
            pid: process.pid,
            created: true,
            alive: true,
          });

          const second = await genRouteReminder(
            {
              route: scene.route,
              cloneAddr: '@:driver-1',
              intervalMs: null,
              sayTimeoutMs: null,
            },
            { spawnDaemon },
          );
          // the findsert hit — the extant live daemon is returned, never duplicated
          expect(second).toEqual({
            pid: process.pid,
            created: false,
            alive: true,
          });
          expect(spawnCount).toEqual(1);
        },
      );
    });
  });
});

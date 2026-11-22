import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genRouteReminder } from './genRouteReminder';
import { getRouteReminder } from './getRouteReminder';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { getRouteReminderRepoRoot } from './getRouteReminderRepoRoot';
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
            repoRoot: scene.route,
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
          legacyOutcomes: [],
        });

        // the claimed handle is present + live
        const found = await getRouteReminder({
          repoRoot: scene.route,
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
              repoRoot: scene.route,
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
            legacyOutcomes: [],
          });

          // and it reconciled the dead handle ITSELF — no caller had to. assert the raw handle FILE
          // is gone (readRouteReminderRawPid reads the file, not liveness), which proves the
          // compare-and-delete ran INSIDE the findsert. this is the biting assertion: getRouteReminder
          // would read null for any dead pid regardless of the file, so it cannot prove the reconcile —
          // only the raw-file read goes RED if the internal del is dropped (rule.require.clamp-edge-cases).
          const rawAfter = await readRouteReminderRawPid({
            repoRoot: scene.route,
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
              repoRoot: scene.route,
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
            legacyOutcomes: [],
          });

          const second = await genRouteReminder(
            {
              repoRoot: scene.route,
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
            legacyOutcomes: [],
          });
          expect(spawnCount).toEqual(1);
        },
      );
    });
  });

  given(
    '[case4] a repo with a legacy per-route daemon of this clone, and one of another clone',
    () => {
      // the legacy home: `<repoRoot>/.behavior/<route>/.route/daemon.of=…session=<token>.pid`
      const legacyStem = (token: string): string =>
        `daemon.of=reminder-driveon.session=${token}`;
      const scene = useBeforeAll(async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'gen-reminder-legacy-'),
        );
        const legacyDir = path.join(repoRoot, '.behavior', 'v1.old', '.route');
        await fs.mkdir(legacyDir, { recursive: true });

        // a REAL live process stands in for the legacy daemon of this clone
        const legacy = spawn('sleep', ['300'], {
          detached: true,
          stdio: 'ignore',
        });
        legacy.unref();
        if (!legacy.pid) throw new Error('failed to spawn a legacy sleeper');
        const ownPidPath = path.join(
          legacyDir,
          `${legacyStem('~40~3adriver-1')}.pid`,
        );
        await fs.writeFile(ownPidPath, String(legacy.pid));
        await fs.writeFile(
          path.join(legacyDir, `${legacyStem('~40~3adriver-1')}.log`),
          'legacy log\n',
        );

        // another clone's legacy handle names a dead pid; the sweep must not touch it
        const otherPidPath = path.join(
          legacyDir,
          `${legacyStem('~40~3adriver-2')}.pid`,
        );
        await fs.writeFile(otherPidPath, String(await genDeadPid()));
        return {
          repoRoot,
          legacyDir,
          legacyPid: legacy.pid,
          ownPidPath,
          otherPidPath,
        };
      });

      when('[t0] the clone findserts its reminder', () => {
        const result = useBeforeAll(async () =>
          genRouteReminder(
            {
              repoRoot: scene.repoRoot,
              cloneAddr: '@:driver-1',
              intervalMs: null,
              sayTimeoutMs: null,
            },
            { spawnDaemon: async () => ({ pid: process.pid }) },
          ),
        );

        then('the clone handle is claimed, with one legacy reap', () => {
          expect(result).toEqual({
            pid: process.pid,
            created: true,
            alive: true,
            legacyOutcomes: [
              {
                kind: 'reaped',
                pid: scene.legacyPid,
                pidPath: scene.ownPidPath,
                signalled: true,
              },
            ],
          });
        });

        then(
          'the legacy daemon of this clone was signalled to stop',
          async () => {
            for (
              let tries = 0;
              tries < 200 && isProcessAlive({ pid: scene.legacyPid });
              tries += 1
            )
              await new Promise((wake) => setTimeout(wake, 10));
            expect(isProcessAlive({ pid: scene.legacyPid })).toEqual(false);
          },
        );

        // read the legacy dir once; the two thens below share it
        const legacy = useThen('the legacy dir is read', async () => ({
          names: await fs.readdir(scene.legacyDir),
        }));

        then('the legacy handle files of this clone are gone', () => {
          expect(
            legacy.names.filter((name) => name.includes('driver-1')),
          ).toEqual([]);
        });

        then('the legacy handle of the other clone is untouched', () => {
          expect(legacy.names).toContain(path.basename(scene.otherPidPath));
        });

        then(
          'the clone log holds one reap line for the legacy pid',
          async () => {
            const logPath = getRouteReminderLogPath({
              repoRoot: scene.repoRoot,
              cloneAddr: '@:driver-1',
            });
            const log = await fs.readFile(logPath, 'utf-8');
            const reapLines = log
              .split('\n')
              .filter((line) => line.includes('legacy daemon reaped'));
            expect(reapLines).toEqual([
              `RouteReminder legacy daemon reaped — pid ${scene.legacyPid}, handle ${scene.ownPidPath}`,
            ]);
          },
        );
      });

      when('[t1] the clone findserts again', () => {
        then(
          'the sweep finds naught and the live daemon is returned',
          async () => {
            const again = await genRouteReminder(
              {
                repoRoot: scene.repoRoot,
                cloneAddr: '@:driver-1',
                intervalMs: null,
                sayTimeoutMs: null,
              },
              { spawnDaemon: async () => ({ pid: process.pid }) },
            );
            expect(again).toEqual({
              pid: process.pid,
              created: false,
              alive: true,
              legacyOutcomes: [],
            });
          },
        );
      });
    },
  );

  given('[case5] two legacy handles of this clone: one torn, one live', () => {
    // the legacy home: `<repoRoot>/.behavior/<route>/.route/daemon.of=…session=<token>.pid`
    const legacyPidName =
      'daemon.of=reminder-driveon.session=~40~3adriver-1.pid';
    const serialBefore = process.env.RHACHET_CLONE_SERIAL;
    const scene = useBeforeAll(async () => {
      // the fault is surfaced to the session's own clone log, so the session is this clone
      process.env.RHACHET_CLONE_SERIAL = 'driver-1';

      const repoRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), 'gen-reminder-legacy-fault-'),
      );
      const tornDir = path.join(repoRoot, '.behavior', 'v1.torn', '.route');
      const liveDir = path.join(repoRoot, '.behavior', 'v1.live', '.route');
      await fs.mkdir(tornDir, { recursive: true });
      await fs.mkdir(liveDir, { recursive: true });

      // a torn pid file: its reap faults at the strict parse
      const tornPidPath = path.join(tornDir, legacyPidName);
      await fs.writeFile(tornPidPath, '123abc');

      // a REAL live process stands in for the other legacy daemon
      const legacy = spawn('sleep', ['300'], {
        detached: true,
        stdio: 'ignore',
      });
      legacy.unref();
      if (!legacy.pid) throw new Error('failed to spawn a legacy sleeper');
      await fs.writeFile(path.join(liveDir, legacyPidName), String(legacy.pid));
      return { repoRoot, tornPidPath, liveDir, legacyPid: legacy.pid };
    });
    afterAll(() => {
      if (serialBefore === undefined) delete process.env.RHACHET_CLONE_SERIAL;
      if (serialBefore !== undefined)
        process.env.RHACHET_CLONE_SERIAL = serialBefore;
    });

    when('[t0] the clone findserts its reminder', () => {
      const result = useBeforeAll(async () =>
        genRouteReminder(
          {
            repoRoot: scene.repoRoot,
            cloneAddr: '@:driver-1',
            intervalMs: null,
            sayTimeoutMs: null,
          },
          { spawnDaemon: async () => ({ pid: process.pid }) },
        ),
      );

      then('the clone handle is still claimed', () => {
        expect(result).toMatchObject({
          pid: process.pid,
          created: true,
          alive: true,
        });
      });

      then('it returns one kept and one reaped legacy outcome', () => {
        expect(
          result.legacyOutcomes.map((outcome) => outcome.kind).sort(),
        ).toEqual(['kept', 'reaped']);
      });

      then('the live legacy daemon was reaped regardless', async () => {
        for (
          let tries = 0;
          tries < 200 && isProcessAlive({ pid: scene.legacyPid });
          tries += 1
        )
          await new Promise((wake) => setTimeout(wake, 10));
        expect(isProcessAlive({ pid: scene.legacyPid })).toEqual(false);
        expect(await fs.readdir(scene.liveDir)).toEqual([]);
      });

      then('the torn legacy handle is kept', async () => {
        expect(await fs.readFile(scene.tornPidPath, 'utf-8')).toEqual('123abc');
      });

      // read the clone log once; the two thens below share it
      const logged = useThen('the clone log is read', async () => {
        const logPath = getRouteReminderLogPath({
          repoRoot: await getRouteReminderRepoRoot({ from: scene.repoRoot }),
          cloneAddr: '@:driver-1',
        });
        return { log: await fs.readFile(logPath, 'utf-8') };
      });

      then('the fault is surfaced to the clone log', () => {
        const log = logged.log;
        expect(log).toContain('legacy handle kept, reap faulted');
        expect(log).toContain(scene.tornPidPath);
        expect(log).toContain(
          `fix: the file names no pid; remove ${scene.tornPidPath}, then run rhx route.reminder.gen`,
        );
        expect(log).toContain(
          `RouteReminder legacy daemon reaped — pid ${scene.legacyPid}`,
        );
      });

      then('the kept line matches the snapshot, its path masked', () => {
        const keptLine = logged.log
          .split('\n')
          .find((line) => line.includes('legacy handle kept'));
        expect(
          keptLine?.split(scene.repoRoot).join('<repo>'),
        ).toMatchSnapshot();
      });
    });
  });
});

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { getRouteReminder } from './getRouteReminder';
import { getRouteReminderCrashBreaker } from './getRouteReminderCrashBreaker';
import { getRouteReminderFocus } from './getRouteReminderFocus';
import { getRouteReminderFocusPath } from './getRouteReminderFocusPath';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';
import { getRouteReminderRepoRoot } from './getRouteReminderRepoRoot';
import { isProcessAlive } from './isProcessAlive';
import { MAX_ROUTE_REMINDER_CRASHES } from './MAX_ROUTE_REMINDER_CRASHES';
import { stepRouteReminderTick } from './stepRouteReminderTick';
import { stopProcess } from './stopProcess';
import { syncRouteReminderForDrive } from './syncRouteReminderForDrive';

// a REAL but already-dead pid: spawn a sleeper, SIGKILL it, poll until the OS reaps it. handed to a
// fake spawn, it stands in for a daemon that crashed before its first tick (a boot failure), so the
// crash-on-arrival detection is exercised against a genuine dead pid — never a mocked isProcessAlive.
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

// a bounded poll until a signalled pid is reaped by the OS: the real condition, never a fixed sleep.
// it returns once the pid is gone, or after its tries; the caller asserts liveness itself
const awaitPidGone = async (input: {
  pid: number;
  triesLeft?: number;
}): Promise<void> => {
  const triesLeft = input.triesLeft ?? 200;
  if (!isProcessAlive({ pid: input.pid }) || triesLeft <= 0) return;
  await new Promise((wake) => setTimeout(wake, 10));
  return awaitPidGone({ pid: input.pid, triesLeft: triesLeft - 1 });
};

/**
 * .what = integration cases for the drive-time RouteReminder auto-sync
 * .why = this is the wish's headline auto-wire — route.drive findserts the reminder while the
 *        route is a live drive and reaps it when dead. it crosses the fs boundary (real
 *        passage.jsonl, real pid handle) and reads the enroller-injected env, so it must be
 *        proven against real files + a real env, with the daemon SPAWN faked (no detached child).
 *
 * .note = mutates + restores process.env.RHACHET_CLONE_SERIAL around each case (serial by jest
 *         default). the faked spawn returns THIS jest process's own pid so getRouteReminder reads
 *         the claimed handle as live — the happy path never signals it, so the jest worker is safe.
 *
 * .mock = `spawnDaemon` is injected via syncRouteReminderForDrive's OWN declared `context` seam
 *         (rule.require.dependency-injection) — never a `jest.mock` or a stubbed global, so
 *         this is not the mock class rule.forbid.integration.mocks forbids. case10 and case15
 *         read the stderr floor through the op's own `stderr` seam, never a spy on a global. it returns a REAL pid
 *         (this jest worker's own live pid, or a genuinely-spawned-then-SIGKILLed dead pid from
 *         `genDeadPid` above), so every isProcessAlive/`kill -0` probe still reads a true OS
 *         process.
 * .why mock = a real detached-spawn chain is proven once, exhaustively, in
 *         blackbox/driver.route.reminder.acceptance.test.ts (case4/case5) — this file's job is the
 *         drive-time register/deregister/circuit-breaker WIRING, which needs only a real pid.
 */
describe('syncRouteReminderForDrive.integration', () => {
  const priorSerial = process.env.RHACHET_CLONE_SERIAL;
  afterEach(() => {
    if (priorSerial === undefined) delete process.env.RHACHET_CLONE_SERIAL;
    else process.env.RHACHET_CLONE_SERIAL = priorSerial;
  });

  // a fake host boundary: records each spawn, returns this process's own (live) pid
  const genFakeSpawn = (): {
    spawnDaemon: (input: {
      repoRoot: string;
      cloneAddr: string;
      intervalMs: number;
      sayTimeoutMs: number;
    }) => Promise<{ pid: number }>;
    getCount: () => number;
  } => {
    let count = 0;
    return {
      spawnDaemon: async () => {
        count += 1;
        return { pid: process.pid };
      },
      getCount: () => count,
    };
  };

  given('[case1] an enrolled session on a live drive (tail = passed)', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '1.vision', status: 'blocked' },
          { stone: '1.vision', status: 'approved' },
          { stone: '1.vision', status: 'passed' },
        ],
        // a still-open stone keeps this a MID-ROUTE pause, not a completed route: the `passed` tail
        // reads LIVE by status, and the frontier stays non-empty so the drive has more to go
        stonesOpen: ['5.1.execution'],
      }),
    );

    when('[t0] the drive syncs the reminder', () => {
      then(
        'it registers the reminder and spawns exactly one daemon',
        async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-live-1';
          const fake = genFakeSpawn();

          const first = await syncRouteReminderForDrive(
            { route: scene.route },
            { spawnDaemon: fake.spawnDaemon },
          );
          expect(first).toEqual({ synced: 'registered' });
          expect(fake.getCount()).toEqual(1);

          // the handle now names the spawned (live) pid. syncRouteReminderForDrive derives its
          // cloneAddr from the env's bare serial via getRouteDriverCloneAddr, which prepends the
          // canonical `@:` sigil — so the assertion reads back that SAME `@:`-prefixed form.
          const found = await getRouteReminder({
            repoRoot: scene.route,
            cloneAddr: '@:clone-live-1',
          });
          expect(found).toEqual({ pid: process.pid });

          // idempotent: a second drive finds the live daemon, spawns NO duplicate
          const second = await syncRouteReminderForDrive(
            { route: scene.route },
            { spawnDaemon: fake.spawnDaemon },
          );
          expect(second).toEqual({ synced: 'registered' });
          expect(fake.getCount()).toEqual(1);
        },
      );
    });
  });

  // 🔴 one daemon per clone: two routes live on one clone yield ONE daemon and ONE
  // nudge, about the route the clone drives now. the handle is keyed on the clone, so the second
  // drive finds the live daemon and only moves its focus. RED when the handle is keyed per route
  // (two spawns, two handles, a nudge per route); GREEN when it is keyed per clone.
  given(
    '[case9] one clone that drives route A, then route B, both live, in one repo',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-one-per-clone',
          git: true,
        });
        const behaviorDir = path.join(repoRoot, '.behavior');
        await fs.mkdir(behaviorDir, { recursive: true });
        const live = {
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
          parent: behaviorDir,
        };
        const { route: routeA } = await genRouteWithPassage(live);
        const { route: routeB } = await genRouteWithPassage(live);
        return { repoRoot, routeA, routeB };
      });

      when('[t0] the clone drives A, then drives B', () => {
        const result = useBeforeAll(async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-stack-1';
          const fake = genFakeSpawn();
          const syncedA = await syncRouteReminderForDrive(
            { route: scene.routeA },
            { spawnDaemon: fake.spawnDaemon },
          );
          const syncedB = await syncRouteReminderForDrive(
            { route: scene.routeB },
            { spawnDaemon: fake.spawnDaemon },
          );
          const clone = {
            repoRoot: await getRouteReminderRepoRoot({ from: scene.routeB }),
            cloneAddr: '@:clone-stack-1',
          };
          const handleDir = path.dirname(getRouteReminderPidPath(clone));
          const handles = (await fs.readdir(handleDir)).filter((name) =>
            name.endsWith('.pid'),
          );
          const focus = await getRouteReminderFocus(clone);
          return {
            syncedA,
            syncedB,
            spawns: fake.getCount(),
            handles,
            focus,
            clone,
          };
        });

        then('both drives register', () => {
          expect(result.syncedA).toEqual({ synced: 'registered' });
          expect(result.syncedB).toEqual({ synced: 'registered' });
        });

        then('exactly one daemon was spawned for the clone', () => {
          expect(result.spawns).toEqual(1);
        });

        then('exactly one pid handle exists for the clone', () => {
          expect(result.handles).toHaveLength(1);
        });

        then('the focus names route B, the route driven now', () => {
          expect(result.focus).toEqual({ route: scene.routeB });
        });

        then('the one daemon tick sends one nudge, about route B', async () => {
          const calls: { addr: string; what: string }[] = [];
          const outcome = await stepRouteReminderTick(
            { ...result.clone, sayTimeoutMs: 30_000 },
            {
              sayToClone: async (say) => {
                calls.push(say);
                return { reached: true as const };
              },
            },
          );
          expect(outcome).toEqual({
            action: 'nudged',
            route: scene.routeB,
            status: 'arrived',
          });
          expect(calls).toHaveLength(1);
        });
      });
    },
  );

  // the key is the clone, never the route: two clones on one route each own a daemon, so each
  // clone gets its own nudge. guards against a fix that keys the handle per route alone
  given('[case14] two clones that drive one live route, in one repo', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = genTempDir({ slug: 'reminder-two-clones', git: true });
      const behaviorDir = path.join(repoRoot, '.behavior');
      await fs.mkdir(behaviorDir, { recursive: true });
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
        parent: behaviorDir,
      });
      return { route };
    });

    when('[t0] clone one drives the route, then clone two drives it', () => {
      const result = useBeforeAll(async () => {
        const fake = genFakeSpawn();
        process.env.RHACHET_CLONE_SERIAL = 'clone-pair-1';
        const syncedOne = await syncRouteReminderForDrive(
          { route: scene.route },
          { spawnDaemon: fake.spawnDaemon },
        );
        process.env.RHACHET_CLONE_SERIAL = 'clone-pair-2';
        const syncedTwo = await syncRouteReminderForDrive(
          { route: scene.route },
          { spawnDaemon: fake.spawnDaemon },
        );
        const repoRoot = await getRouteReminderRepoRoot({ from: scene.route });
        const cloneOne = { repoRoot, cloneAddr: '@:clone-pair-1' };
        const cloneTwo = { repoRoot, cloneAddr: '@:clone-pair-2' };
        const handleDir = path.dirname(getRouteReminderPidPath(cloneOne));
        const handles = (await fs.readdir(handleDir))
          .filter((name) => name.endsWith('.pid'))
          .sort();
        return {
          syncedOne,
          syncedTwo,
          spawns: fake.getCount(),
          handles,
          focusOne: await getRouteReminderFocus(cloneOne),
          focusTwo: await getRouteReminderFocus(cloneTwo),
        };
      });

      then('both drives register', () => {
        expect(result.syncedOne).toEqual({ synced: 'registered' });
        expect(result.syncedTwo).toEqual({ synced: 'registered' });
      });

      then('one daemon is spawned per clone', () => {
        expect(result.spawns).toEqual(2);
      });

      then('each clone holds its own pid handle', () => {
        expect(result.handles).toHaveLength(2);
        expect(result.handles[0]).toContain('clone-pair-1');
        expect(result.handles[1]).toContain('clone-pair-2');
      });

      then('each clone focus names the route', () => {
        expect(result.focusOne).toEqual({ route: scene.route });
        expect(result.focusTwo).toEqual({ route: scene.route });
      });
    });
  });

  // the focus is the seam from drive to daemon. if it cannot be written, a live daemon would keep
  // its old focus and nudge about a route the clone left — so the sync spawns none and reports
  // deregistered. a FILE where `.agent/` must go makes the focus write fault (ENOTDIR, tolerated)
  given(
    '[case10] a live drive with no daemon, whose focus write faults',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        });
        await fs.writeFile(
          path.join(route, '.agent'),
          'i am a file, not a dir',
        );
        return { route };
      });

      when('[t0] the drive syncs the reminder', () => {
        const result = useBeforeAll(async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-focus-fault-1';
          const fake = genFakeSpawn();

          // the clone home sits under the same blocked `.agent`, so the fault lands on the stderr
          // floor; a real collector rides the op's own stderr seam to read the line a human is shown
          const lines: string[] = [];
          const synced = await syncRouteReminderForDrive(
            { route: scene.route },
            {
              spawnDaemon: fake.spawnDaemon,
              stderr: (line) => lines.push(line),
            },
          );
          return { synced, spawns: fake.getCount(), lines };
        });

        then('it deregisters and spawns no daemon', () => {
          expect(result.synced).toEqual({ synced: 'deregistered' });
          expect(result.spawns).toEqual(0);
        });

        then(
          'the focus fault line is surfaced, with why the daemon was reaped',
          () => {
            const focusLine = result.lines.find((line) =>
              line.includes('RouteReminder focus write faulted'),
            );
            expect(focusLine).toContain(
              'the daemon is reaped so it cannot nudge about a route this clone left',
            );
            expect(
              (focusLine ?? '').split(scene.route).join('<route>'),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  // the fail-safe of the focus seam, with a daemon to reap: the clone drove live route A (a live
  // daemon, focus A), then drives route B and the focus write faults. the daemon that still holds
  // focus A is stopped, so no tick can nudge about the route the clone left. a read-only clone home
  // makes the write fault (EACCES, tolerated); the signal needs no write, so the reap still lands
  given(
    '[case15] a live daemon on route A, then a focus write fault on route B',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-focus-fault-live',
          git: true,
        });
        const behaviorDir = path.join(repoRoot, '.behavior');
        await fs.mkdir(behaviorDir, { recursive: true });
        const live = {
          lines: [{ stone: '5.1.execution', status: 'arrived' as const }],
          parent: behaviorDir,
        };
        const { route: routeA } = await genRouteWithPassage(live);
        const { route: routeB } = await genRouteWithPassage(live);
        return { routeA, routeB };
      });

      when(
        '[t0] the clone drives A, then B with its clone home read-only',
        () => {
          const result = useBeforeAll(async () => {
            process.env.RHACHET_CLONE_SERIAL = 'clone-focus-fault-live-1';
            const sleeper = spawn('sleep', ['300'], {
              detached: true,
              stdio: 'ignore',
            });
            sleeper.unref();
            const sleeperPid = sleeper.pid;
            if (!sleeperPid) throw new Error('failed to spawn sleeper');
            const syncedA = await syncRouteReminderForDrive(
              { route: scene.routeA },
              { spawnDaemon: async () => ({ pid: sleeperPid }) },
            );
            const clone = {
              repoRoot: await getRouteReminderRepoRoot({ from: scene.routeA }),
              cloneAddr: '@:clone-focus-fault-live-1',
            };
            const handleDir = path.dirname(getRouteReminderPidPath(clone));
            const focusBefore = await getRouteReminderFocus(clone);

            // the focus write to B faults: the clone home is read-only
            await fs.chmod(handleDir, 0o555);
            const lines: string[] = [];
            const fake = genFakeSpawn();
            try {
              const syncedB = await syncRouteReminderForDrive(
                { route: scene.routeB },
                {
                  spawnDaemon: fake.spawnDaemon,
                  stderr: (line) => lines.push(line),
                },
              );
              await awaitPidGone({ pid: sleeperPid });
              return {
                syncedA,
                syncedB,
                focusBefore,
                spawnsOnB: fake.getCount(),
                lines,
                sleeperPid,
                sleeperAlive: isProcessAlive({ pid: sleeperPid }),
                handleDir,
              };
            } finally {
              await fs.chmod(handleDir, 0o755);
            }
          });

          // reap the sleeper if the sync did not, so none outlives the suite
          afterAll(() => {
            if (isProcessAlive({ pid: result.sleeperPid }))
              stopProcess({ pid: result.sleeperPid, signal: 'SIGKILL' });
          });

          then('the drive of A registers the daemon, focused on A', () => {
            expect(result.syncedA).toEqual({ synced: 'registered' });
            expect(result.focusBefore).toEqual({ route: scene.routeA });
          });

          then('the drive of B deregisters and spawns none', () => {
            expect(result.syncedB).toEqual({ synced: 'deregistered' });
            expect(result.spawnsOnB).toEqual(0);
          });

          then('the daemon that held focus A is stopped', () => {
            expect(result.sleeperAlive).toBe(false);
          });

          then(
            'the focus fault is surfaced, with why the daemon was reaped',
            () => {
              const focusLine = result.lines.find((line) =>
                line.includes('RouteReminder focus write faulted'),
              );
              expect(focusLine).toContain(
                'the daemon is reaped so it cannot nudge about a route this clone left',
              );
              expect(focusLine).toContain('EACCES');
            },
          );
        },
      );
    },
  );

  // the focus route halts: the clone drove live route A, then drives route B, which is
  // blocked. the daemon is reaped, the left route A gets no nudge though it is live, and the focus
  // stays on B so `get` can name why the reminder is down. the spawn hands back a REAL sleeper,
  // since the dead arm signals the pid the handle names — never this jest worker's own pid
  given(
    '[case11] one clone that drives live route A, then blocked route B, in one repo',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-focus-halts',
          git: true,
        });
        const behaviorDir = path.join(repoRoot, '.behavior');
        await fs.mkdir(behaviorDir, { recursive: true });
        const { route: routeA } = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
          parent: behaviorDir,
        });
        const { route: routeB } = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
          ],
          parent: behaviorDir,
        });
        return { repoRoot, routeA, routeB };
      });

      when('[t0] the clone drives A, then drives B', () => {
        const result = useBeforeAll(async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-halt-1';
          const sleepers: number[] = [];
          const spawnDaemon = async () => {
            const child = spawn('sleep', ['300'], {
              detached: true,
              stdio: 'ignore',
            });
            child.unref();
            if (!child.pid) throw new Error('failed to spawn sleeper');
            sleepers.push(child.pid);
            return { pid: child.pid };
          };
          const syncedA = await syncRouteReminderForDrive(
            { route: scene.routeA },
            { spawnDaemon },
          );
          const syncedB = await syncRouteReminderForDrive(
            { route: scene.routeB },
            { spawnDaemon },
          );
          const clone = {
            repoRoot: await getRouteReminderRepoRoot({ from: scene.routeB }),
            cloneAddr: '@:clone-halt-1',
          };
          return {
            syncedA,
            syncedB,
            sleepers,
            clone,
            found: await getRouteReminder(clone),
            focus: await getRouteReminderFocus(clone),
          };
        });

        // reap any sleeper the sync did not stop, so none outlives the suite
        afterAll(() => {
          for (const pid of result.sleepers)
            if (isProcessAlive({ pid }))
              stopProcess({ pid, signal: 'SIGKILL' });
        });

        then('the drive of A registers; the drive of B deregisters', () => {
          expect(result.syncedA).toEqual({ synced: 'registered' });
          expect(result.syncedB).toEqual({ synced: 'deregistered' });
          expect(result.sleepers).toHaveLength(1);
        });

        then('no daemon is live for the clone', () => {
          expect(result.found).toEqual(null);
        });

        then('the focus stays on route B, the route that halted', () => {
          expect(result.focus).toEqual({ route: scene.routeB });
        });

        then(
          'a tick exits on the halt, and never nudges about route A',
          async () => {
            const calls: { addr: string; what: string }[] = [];
            const outcome = await stepRouteReminderTick(
              { ...result.clone, sayTimeoutMs: 30_000 },
              {
                sayToClone: async (say) => {
                  calls.push(say);
                  return { reached: true as const };
                },
              },
            );
            expect(outcome).toMatchObject({
              action: 'exit',
              route: scene.routeB,
            });
            expect(calls).toHaveLength(0);
          },
        );
      });
    },
  );

  // no sweep on the dead arm: a legacy per-route daemon of this clone still runs, and the route the
  // clone drives now is blocked. a blocked route fires a hook every turn, so its reap arm must not
  // walk every route dir each time; the legacy daemon is left to its own doors, to the next spawn's
  // sweep, and to an explicit `route.reminder.del`
  given(
    '[case12] a live legacy daemon of this clone, and a blocked focus route',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-legacy-dead-arm',
          git: true,
        });
        const behaviorDir = path.join(repoRoot, '.behavior');
        await fs.mkdir(behaviorDir, { recursive: true });
        const { route } = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
          ],
          parent: behaviorDir,
        });

        // a REAL live process stands in for the legacy daemon, with its per-route handle
        const legacyDir = path.join(behaviorDir, 'v1.old', '.route');
        await fs.mkdir(legacyDir, { recursive: true });
        const legacy = spawn('sleep', ['300'], {
          detached: true,
          stdio: 'ignore',
        });
        legacy.unref();
        if (!legacy.pid) throw new Error('failed to spawn a legacy sleeper');
        await fs.writeFile(
          path.join(
            legacyDir,
            'daemon.of=reminder-driveon.session=~40~3aclone-legacy-1.pid',
          ),
          String(legacy.pid),
        );
        return { route, legacyDir, legacyPid: legacy.pid };
      });
      afterAll(() => {
        if (isProcessAlive({ pid: scene.legacyPid }))
          stopProcess({ pid: scene.legacyPid, signal: 'SIGKILL' });
      });

      when('[t0] the clone drives the blocked route', () => {
        const result = useBeforeAll(async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-legacy-1';
          const fake = genFakeSpawn();
          const synced = await syncRouteReminderForDrive(
            { route: scene.route },
            { spawnDaemon: fake.spawnDaemon },
          );
          return { synced, spawns: fake.getCount() };
        });

        then('it deregisters and spawns no clone daemon', () => {
          expect(result.synced).toEqual({ synced: 'deregistered' });
          expect(result.spawns).toEqual(0);
        });

        then('the legacy daemon is not signalled by the dead arm', () => {
          expect(isProcessAlive({ pid: scene.legacyPid })).toEqual(true);
        });

        then('the legacy handle is left for the sweep', async () => {
          expect(await fs.readdir(scene.legacyDir)).toEqual([
            'daemon.of=reminder-driveon.session=~40~3aclone-legacy-1.pid',
          ]);
        });
      });
    },
  );

  // the upgrade through the drive: the first drive of a live route that must spawn sweeps this
  // clone's legacy per-route daemon, then spawns the one clone daemon. a broken drive-to-sweep seam
  // would leave the old daemon to nudge beside the new one
  given(
    '[case12b] a live legacy daemon of this clone, and a live focus route',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-legacy-spawn-arm',
          git: true,
        });
        const behaviorDir = path.join(repoRoot, '.behavior');
        await fs.mkdir(behaviorDir, { recursive: true });
        const { route } = await genRouteWithPassage({
          lines: [{ stone: '1.vision', status: 'passed' }],
          stonesOpen: ['5.1.execution'],
          parent: behaviorDir,
        });

        // a REAL live process stands in for the legacy daemon, with its per-route handle
        const legacyDir = path.join(behaviorDir, 'v1.old', '.route');
        await fs.mkdir(legacyDir, { recursive: true });
        const legacy = spawn('sleep', ['300'], {
          detached: true,
          stdio: 'ignore',
        });
        legacy.unref();
        if (!legacy.pid) throw new Error('failed to spawn a legacy sleeper');
        await fs.writeFile(
          path.join(
            legacyDir,
            'daemon.of=reminder-driveon.session=~40~3aclone-legacy-2.pid',
          ),
          String(legacy.pid),
        );
        return {
          route,
          legacyDir,
          legacyPid: legacy.pid,
          repoRootReal: await fs.realpath(repoRoot),
        };
      });
      afterAll(() => {
        if (isProcessAlive({ pid: scene.legacyPid }))
          stopProcess({ pid: scene.legacyPid, signal: 'SIGKILL' });
      });

      when('[t0] the clone drives the live route', () => {
        const result = useBeforeAll(async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-legacy-2';
          const fake = genFakeSpawn();
          const synced = await syncRouteReminderForDrive(
            { route: scene.route },
            { spawnDaemon: fake.spawnDaemon },
          );
          await awaitPidGone({ pid: scene.legacyPid });
          const log = await fs.readFile(
            getRouteReminderLogPath({
              repoRoot: scene.repoRootReal,
              cloneAddr: '@:clone-legacy-2',
            }),
            'utf8',
          );
          return { synced, spawns: fake.getCount(), log };
        });

        then('it registers and spawns exactly one clone daemon', () => {
          expect(result.synced).toEqual({ synced: 'registered' });
          expect(result.spawns).toEqual(1);
        });

        then('the legacy daemon is reaped', () => {
          expect(isProcessAlive({ pid: scene.legacyPid })).toEqual(false);
        });

        then('the legacy handle is gone', async () => {
          expect(await fs.readdir(scene.legacyDir)).toEqual([]);
        });

        then('the clone log names the legacy reap', () => {
          expect(result.log).toContain(
            `RouteReminder legacy daemon reaped — pid ${scene.legacyPid}`,
          );
        });
      });
    },
  );

  given('[case2] an enrolled session on a dead drive (tail = blocked)', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      });
      return { route };
    });

    when('[t0] the drive syncs the reminder', () => {
      then('it deregisters and spawns no daemon', async () => {
        process.env.RHACHET_CLONE_SERIAL = 'clone-dead-1';
        const fake = genFakeSpawn();

        const result = await syncRouteReminderForDrive(
          { route: scene.route },
          { spawnDaemon: fake.spawnDaemon },
        );
        expect(result).toEqual({ synced: 'deregistered' });
        expect(fake.getCount()).toEqual(0);

        // no reminder is live for a dead drive (cloneAddr = the @:-prefixed derived form)
        const found = await getRouteReminder({
          repoRoot: scene.route,
          cloneAddr: '@:clone-dead-1',
        });
        expect(found).toEqual(null);
      });
    });
  });

  given(
    '[case4] an enrolled session on a COMPLETED drive (tail = passed, every stone passed)',
    () => {
      // the completion clamp: a completed route writes the SAME `passed` tail as a mid-route pause,
      // so the status predicate alone reads it LIVE and (pre-fix) re-registered forever — the wish's
      // forbidden infiniloop. this fixture has a REAL stone whose passage is `passed`, so the stone
      // frontier is empty AND stones exist → getRouteDriveComplete confirms completion → reap.
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [{ stone: '1.vision', status: 'passed' }],
        });
        // write the stone file so getAllStones enumerates it (frontier = empty ⇒ complete)
        await fs.writeFile(path.join(route, '1.vision.stone'), 'the vision\n');
        return { route };
      });

      when('[t0] the drive syncs the reminder', () => {
        then(
          'it deregisters (not registers) — a completed drive is a halted drive',
          async () => {
            process.env.RHACHET_CLONE_SERIAL = 'clone-complete-1';
            const fake = genFakeSpawn();

            const result = await syncRouteReminderForDrive(
              { route: scene.route },
              { spawnDaemon: fake.spawnDaemon },
            );
            expect(result).toEqual({ synced: 'deregistered' });
            expect(fake.getCount()).toEqual(0);

            // no reminder is live for a completed drive (@:-prefixed derived form)
            const found = await getRouteReminder({
              repoRoot: scene.route,
              cloneAddr: '@:clone-complete-1',
            });
            expect(found).toEqual(null);
          },
        );
      });
    },
  );

  // the clamp for the auto-wire crash-on-arrival failhide (the review's "sharpest" open item): the
  // manual CLI path probes a fresh spawn's liveness before it reports success; the auto-wire must too.
  // a SYSTEMATIC boot failure (a broken host that returns a dead pid every time) would otherwise spawn
  // a fresh doomed process on EVERY drive hook with NO human-visible signal — a silent spawn-storm.
  // this drives the auto-wire TWICE against a dead-pid spawn and asserts each call surfaces the crash
  // to the WATCHED per-session log + reconciles the dead handle. RED under the old no-probe auto-wire
  // (the log stays empty, the storm is silent), GREEN under the crash-on-arrival detection.
  given(
    '[case5] a live drive whose spawn returns a DEAD pid (a systematic boot failure)',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'passed' },
          ],
          // a still-open stone keeps this a MID-ROUTE pause, not a completed route: the `passed`
          // tail reads LIVE by status, and the frontier stays non-empty so the drive has more to go
          stonesOpen: ['5.3.verification'],
        });
        return { route };
      });

      when('[t0] the drive syncs twice against the dead-pid spawn', () => {
        then(
          'each drive surfaces the crash to the log and leaves no live handle',
          async () => {
            process.env.RHACHET_CLONE_SERIAL = 'clone-crash-1';
            const deadPid = await genDeadPid();
            const spawnDaemon = async (): Promise<{ pid: number }> => ({
              pid: deadPid,
            });

            // two consecutive drives — the systematic-failure case the review named
            const first = await syncRouteReminderForDrive(
              { route: scene.route },
              { spawnDaemon },
            );
            const second = await syncRouteReminderForDrive(
              { route: scene.route },
              { spawnDaemon },
            );
            // the auto-wire still returns registered (the drive proceeds; reminder is auxiliary)
            expect(first).toEqual({ synced: 'registered' });
            expect(second).toEqual({ synced: 'registered' });

            // the dead-on-arrival crash was SURFACED to the watched per-session log, not swallowed —
            // twice, once per drive (the storm is now legible instead of silent)
            const logPath = getRouteReminderLogPath({
              repoRoot: scene.route,
              cloneAddr: '@:clone-crash-1',
            });
            const log = await fs.readFile(logPath, 'utf-8');
            const crashLines = log
              .split('\n')
              .filter((line) => line.includes('died on arrival'));
            expect(crashLines.length).toBeGreaterThanOrEqual(2);
            expect(
              crashLines[0]
                ?.replace(/pid \d+/g, 'pid <pid>')
                .split(scene.route)
                .join('<route>'),
            ).toMatchSnapshot();

            // the dead handle was reconciled — no phantom "live" reminder survives the crash
            const found = await getRouteReminder({
              repoRoot: scene.route,
              cloneAddr: '@:clone-crash-1',
            });
            expect(found).toEqual(null);
          },
        );
      });
    },
  );

  // a daemon that finds no focus exits at its first tick by design. its dead boot must never count
  // toward the crash breaker, or an absent focus would latch the breaker with no real fault to fix
  given(
    '[case13] a live drive whose focus is gone by the time the fresh daemon boots',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'passed' },
          ],
          stonesOpen: ['5.3.verification'],
        });
        return { route };
      });

      when('[t0] the drive syncs and the spawn clears the focus first', () => {
        const res = useThen('the drive syncs', async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-nofocus-1';
          const clone = {
            repoRoot: await getRouteReminderRepoRoot({ from: scene.route }),
            cloneAddr: '@:clone-nofocus-1',
          };
          const deadPid = await genDeadPid();

          // the fake host drops the focus, then returns a pid that died at boot — the shape of a
          // daemon that read no focus and exited route-not-live
          const spawnDaemon = async (): Promise<{ pid: number }> => {
            await fs.rm(getRouteReminderFocusPath(clone), { force: true });
            return { pid: deadPid };
          };
          const result = await syncRouteReminderForDrive(
            { route: scene.route },
            { spawnDaemon },
          );
          const breaker = await getRouteReminderCrashBreaker(clone);
          const log = await fs.readFile(
            getRouteReminderLogPath(clone),
            'utf-8',
          );
          return { result, breaker, log };
        });

        then('the clone is deregistered, not registered', () => {
          expect(res.result).toEqual({ synced: 'deregistered' });
        });

        then('the breaker counts no crash', () => {
          expect(res.breaker.count).toEqual(0);
        });

        then('the clone log names the absent focus, not a crash', () => {
          expect(res.log).toContain(
            'exited at boot — the clone focus was absent',
          );
          expect(res.log).not.toContain('died on arrival');
          const bootLine = res.log
            .split('\n')
            .find((line) => line.includes('exited at boot'));
          expect(
            bootLine
              ?.replace(/pid \d+/g, 'pid <pid>')
              .split(scene.route)
              .join('<route>'),
          ).toMatchSnapshot();
        });
      });
    },
  );

  // the revival clamp: the "self-heals on the next drive hook" claim (in the howto +
  // stepRouteReminderTick's .tradeoff note) holds for every hook that fires: a live drive whose
  // prior daemon SELF-EXITED (its handle names a now-dead pid) → the next sync findserts a FRESH
  // live daemon, so the reminder revives. a true idle-stall where NO hook fires is out of scope (a
  // daemon-liveness watchdog). RED if a dead-pid handle were read as live (no fresh spawn).
  given(
    '[case6] a live drive whose prior daemon self-exited (handle names a dead pid)',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'passed' },
          ],
          // a still-open stone keeps this a MID-ROUTE pause, not a completed route: the `passed`
          // tail reads LIVE by status, and the frontier stays non-empty so the drive has more to go
          stonesOpen: ['5.3.verification'],
        });
        return { route };
      });

      when('[t0] the drive syncs after the prior daemon died', () => {
        then(
          'it findserts a FRESH live daemon — the reminder revives',
          async () => {
            process.env.RHACHET_CLONE_SERIAL = 'clone-revive-1';

            // seed the handle to name a genuinely dead pid — a daemon that already self-exited
            const deadPid = await genDeadPid();
            const pidPath = getRouteReminderPidPath({
              repoRoot: scene.route,
              cloneAddr: '@:clone-revive-1',
            });
            await fs.mkdir(path.dirname(pidPath), { recursive: true });
            await fs.writeFile(pidPath, String(deadPid), 'utf-8');

            // this drive's hook fires on the still-live route → findsert must spawn anew
            const fake = genFakeSpawn();
            const result = await syncRouteReminderForDrive(
              { route: scene.route },
              { spawnDaemon: fake.spawnDaemon },
            );
            expect(result).toEqual({ synced: 'registered' });
            expect(fake.getCount()).toEqual(1); // a FRESH daemon spawned — the revival

            // the handle now names the fresh live daemon, not the dead pid
            const found = await getRouteReminder({
              repoRoot: scene.route,
              cloneAddr: '@:clone-revive-1',
            });
            expect(found).toEqual({ pid: process.pid });
          },
        );
      });
    },
  );

  // the spawn-storm circuit-breaker clamp (r11 i035 blocker): the auto-wire runs on EVERY route.drive
  // hook, so a SYSTEMATICALLY-broken spawn (a dead pid every time) would re-spawn a doomed process on
  // every turn boundary — unbounded, precisely across the host outage the feature exists to survive.
  // this drives the auto-wire past the cutoff and asserts the breaker LATCHES: once the consecutive
  // crash count exceeds MAX_ROUTE_REMINDER_CRASHES, the auto-wire halts the spawn (circuit-broken) and
  // the real spawn count freezes. RED under a no-breaker auto-wire (spawns forever); GREEN once it latches.
  given(
    '[case7] a live drive whose spawn SYSTEMATICALLY crashes on arrival (a broken host)',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'passed' },
          ],
          // a still-open stone keeps this a MID-ROUTE pause, not a completed route: the `passed`
          // tail reads LIVE by status, and the frontier stays non-empty so the drive has more to go
          stonesOpen: ['5.3.verification'],
        });
        return { route };
      });

      when('[t0] the drive syncs repeatedly against the crash spawn', () => {
        // drive the auto-wire MAX+3 times, record each outcome + the real spawn count. a fresh dead
        // pid per spawn keeps every attempt a genuine crash-on-arrival (never a mocked probe).
        const result = useBeforeAll(async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-storm-1';
          let spawnCount = 0;
          const spawnDaemon = async (): Promise<{ pid: number }> => {
            spawnCount += 1;
            return { pid: await genDeadPid() };
          };

          const outcomes: string[] = [];
          for (let i = 0; i < MAX_ROUTE_REMINDER_CRASHES + 3; i += 1) {
            const { synced } = await syncRouteReminderForDrive(
              { route: scene.route },
              { spawnDaemon },
            );
            outcomes.push(synced);
          }
          return { outcomes, spawnCount };
        });

        then(
          'the first MAX+1 drives spawn a doomed daemon (registered)',
          () => {
            const registered = result.outcomes.filter(
              (o) => o === 'registered',
            );
            expect(registered.length).toEqual(MAX_ROUTE_REMINDER_CRASHES + 1);
          },
        );

        then('every drive past the cutoff trips (circuit-broken)', () => {
          const broken = result.outcomes.filter((o) => o === 'circuit-broken');
          expect(broken.length).toEqual(2);
          // the trips are the TAIL — the breaker latches and never un-trips on its own
          expect(result.outcomes.slice(-2)).toEqual([
            'circuit-broken',
            'circuit-broken',
          ]);
        });

        then(
          'the real spawn count froze at the cutoff — no unbounded spawn-storm',
          () => {
            expect(result.spawnCount).toEqual(MAX_ROUTE_REMINDER_CRASHES + 1);
          },
        );

        then(
          'the clone log names the trip, the cutoff, and the re-arm',
          async () => {
            const clone = {
              repoRoot: await getRouteReminderRepoRoot({ from: scene.route }),
              cloneAddr: '@:clone-storm-1',
            };
            const log = await fs.readFile(
              getRouteReminderLogPath(clone),
              'utf-8',
            );
            const tripLines = log
              .split('\n')
              .filter((line) => line.includes('auto-respawn tripped'));
            expect(tripLines).toHaveLength(2);
            expect(tripLines[0]).toContain(
              'until a manual route.reminder.gen re-arms it',
            );
            expect(tripLines[0]).toMatchSnapshot();
          },
        );
      });
    },
  );

  // the reset clamp: the breaker must reset on any HEALTHY daemon, so a TRANSIENT crash streak that
  // recovers before the cutoff never latches. drive a crash spawn a few times (count climbs), then
  // once with a healthy (live-pid) spawn → the breaker resets to 0. RED if a healthy drive left the
  // streak intact (a transient blip would eventually latch a healthy spawn).
  given(
    '[case8] a partial crash streak that then recovers with a healthy spawn',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'passed' },
          ],
          // a still-open stone keeps this a MID-ROUTE pause, not a completed route: the `passed`
          // tail reads LIVE by status, and the frontier stays non-empty so the drive has more to go
          stonesOpen: ['5.3.verification'],
        });
        return { route };
      });

      when('[t0] a few crashes, then a healthy spawn', () => {
        const result = useBeforeAll(async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-recover-1';

          // three consecutive crash-on-arrivals (count climbs to 3, below the cutoff)
          const crashSpawn = async (): Promise<{ pid: number }> => ({
            pid: await genDeadPid(),
          });
          for (let i = 0; i < 3; i += 1)
            await syncRouteReminderForDrive(
              { route: scene.route },
              { spawnDaemon: crashSpawn },
            );
          const streak = await getRouteReminderCrashBreaker({
            repoRoot: scene.route,
            cloneAddr: '@:clone-recover-1',
          });

          // one healthy spawn (this live process's own pid) → the streak resets
          const healthySpawn = async (): Promise<{ pid: number }> => ({
            pid: process.pid,
          });
          await syncRouteReminderForDrive(
            { route: scene.route },
            { spawnDaemon: healthySpawn },
          );
          const recovered = await getRouteReminderCrashBreaker({
            repoRoot: scene.route,
            cloneAddr: '@:clone-recover-1',
          });

          return { streakCount: streak.count, recoveredCount: recovered.count };
        });

        then('the crash streak climbed to 3 before recovery', () => {
          expect(result.streakCount).toEqual(3);
        });

        then('a healthy daemon reset the breaker to 0', () => {
          expect(result.recoveredCount).toEqual(0);
        });
      });
    },
  );

  given('[case3] a plain session — RHACHET_CLONE_SERIAL unset', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      });
      return { route };
    });

    when('[t0] the drive syncs the reminder', () => {
      then('it skips — no clone to nudge, no spawn', async () => {
        delete process.env.RHACHET_CLONE_SERIAL;
        const fake = genFakeSpawn();

        const result = await syncRouteReminderForDrive(
          { route: scene.route },
          { spawnDaemon: fake.spawnDaemon },
        );
        expect(result).toEqual({ synced: 'skipped' });
        expect(fake.getCount()).toEqual(0);
      });
    });
  });
});

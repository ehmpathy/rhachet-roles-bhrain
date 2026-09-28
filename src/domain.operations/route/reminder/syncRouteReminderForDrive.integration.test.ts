import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { getRouteReminder } from './getRouteReminder';
import { getRouteReminderCrashBreaker } from './getRouteReminderCrashBreaker';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';
import { isProcessAlive } from './isProcessAlive';
import { MAX_ROUTE_REMINDER_CRASHES } from './MAX_ROUTE_REMINDER_CRASHES';
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
 *         (rule.require.dependency-injection) — never a `jest.mock`/`jest.spyOn` of a global, so
 *         this is not the mock class rule.forbid.integration.mocks forbids. it returns a REAL pid
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
      route: string;
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
            route: scene.route,
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
          route: scene.route,
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
              route: scene.route,
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
              route: scene.route,
              cloneAddr: '@:clone-crash-1',
            });
            const log = await fs.readFile(logPath, 'utf-8');
            const crashLines = log
              .split('\n')
              .filter((line) => line.includes('died on arrival'));
            expect(crashLines.length).toBeGreaterThanOrEqual(2);

            // the dead handle was reconciled — no phantom "live" reminder survives the crash
            const found = await getRouteReminder({
              route: scene.route,
              cloneAddr: '@:clone-crash-1',
            });
            expect(found).toEqual(null);
          },
        );
      });
    },
  );

  // the revival clamp: r10 flagged that the "self-heals on the next drive hook" claim (in the
  // howto + stepRouteReminderTick's .tradeoff note) had NO test for the hook-firing cases. this
  // proves it: a live drive whose prior daemon SELF-EXITED (its handle names a now-dead pid) →
  // the next sync findserts a FRESH live daemon, reviving the reminder. the residual the reviewer
  // names — a true idle-stall where NO hook fires, so no hook drives this revival — is the
  // disclosed wisher-scope gap (a daemon-liveness watchdog is out of this behavior's scope); this
  // clamp closes the testable half. RED if a dead-pid handle were read as live (no fresh spawn).
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
              route: scene.route,
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
              route: scene.route,
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
            route: scene.route,
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
            route: scene.route,
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

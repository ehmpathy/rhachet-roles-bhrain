import { spawn as spawnChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

// scrub the run-variant bytes (a spawned pid, a tmp route path, an iso timestamp) so a snapshot
// pins only the STABLE shell text a human reads at the real `.sh` boundary. a snapshot lets a
// reviewer follow the operator's exact journey (r9 friction rule) instead of a re-read of loose
// `toContain` fragments; the scrub keeps it deterministic across runs (rule.require.snapshots).
const TMPDIR_PATTERN = new RegExp(
  `${os.tmpdir().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\s"']*`,
  'g',
);
const scrubReminderStdout = (stdout: string): string =>
  stdout
    .replace(/pid \d+/g, 'pid <pid>')
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, '<timestamp>')
    .replace(TMPDIR_PATTERN, '<tmpdir>')
    // trim trailing whitespace per line — a tree-render bar over a blank markdown line (e.g. the
    // real route.drive stone guide, case5) prints a bar with only whitespace after it; that
    // trailing whitespace is an invisible blemish in a snapshot a human reads, so it never
    // belongs in the pinned shell text (rule.forbid.snapshot-visual-blemishes). leading
    // whitespace (the tree indent itself) is untouched.
    .replace(/[ \t]+$/gm, '');

// a real liveness probe on a pid: process.kill(pid, 0) delivers NO signal, it only asks "does this
// process exist?" — it throws ESRCH when the process is gone (dead), EPERM when it is alive but not
// ours. so a false return means truly reaped.
const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // ESRCH = no such process (dead); any other errno (EPERM = alive-but-not-ours) reads as alive
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
};

// poll until a pid is truly reaped, bounded — a probe of the REAL condition, not a fixed sleep
// (rule.forbid.time-assumptions). this is the r10-i030 §2 clamp: the acceptance cases spawn a REAL
// detached daemon, so "no process outlives the test" must be an ASSERTION on the OS process, not a
// code comment plus an exit-0 check. a blocked / bogus-addr route makes the daemon self-exit on tick
// 1, so this converges fast; the bound fails loud if a daemon ever lingers (rule.require.failfast).
const awaitPidDead = async (pid: number, triesLeft = 200): Promise<void> => {
  if (!isPidAlive(pid)) return;
  if (triesLeft <= 0)
    throw new Error(
      `RouteReminder daemon pid ${pid} still alive after wait — it outlived the test`,
    );
  await new Promise((wake) => setTimeout(wake, 25));
  return awaitPidDead(pid, triesLeft - 1);
};

// pull the daemon pid a `gen` register printed ("spawned … (pid N)") — the handle case4 asserts dead
const asPidFromStdout = (stdout: string): number => {
  const match = stdout.match(/pid (\d+)/);
  if (!match)
    throw new Error(`no "pid N" found in stdout to probe liveness: ${stdout}`);
  return Number(match[1]);
};

// pull the daemon pid from the on-disk handle content — the auto-wire (case5) writes no pid to
// stdout, so its pid is read from the per-session handle file the findsert wrote.
const asPidFromHandle = (handleContent: string): number => {
  const match = handleContent.match(/\d+/);
  if (!match)
    throw new Error(`no pid found in the reminder handle file: ${handleContent}`);
  return Number(match[0]);
};

// a real, harmless background process (a long sleep) that stands in for a live daemon — get / del
// / gen's findsert-hit branch each probe a pid handle's REAL liveness (kill -0), so the pid a
// case claims for its handle must genuinely be alive or dead, not a mock. mirrors the
// injected-layer genSleeperProcess (src/contract/cli/route.reminder.integration.test.ts), tracked
// here so an afterAll sweep reaps any sleeper a case did not itself stop.
const spawnedSleeperPids: number[] = [];
const spawnRealSleeper = (): number => {
  const child = spawnChildProcess('sleep', ['300'], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
  });
  child.unref();
  if (!child.pid) throw new Error('failed to spawn sleeper');
  spawnedSleeperPids.push(child.pid);
  return child.pid;
};

/**
 * .what = drives the RouteReminder shell surface through the REAL `.sh` skill wrappers, invoked
 *         exactly as rhachet invokes them (bash → `node -e "import('rhachet-roles-bhrain/cli/
 *         route.reminder')"` → the cli fn), against the built + self-linked package.
 * .why = the wish's headline ask is "manage whether the reminder is live via shell". this proves
 *        that contract end to end: `rhx route.reminder.{get,del,daemon}` load, parse argv, reach
 *        the cli, and behave — NOT just the TS export the integration tests import directly. it also
 *        clamps the spawn→dynamic-import→argv seam: if the `rhachet-roles-bhrain/cli/route.reminder`
 *        subpath ever failed to load from a spawned child, the daemon would die silently at
 *        `import()`; the daemon case below runs that exact chain in the foreground and asserts it
 *        reaches its self-exit, so an import that cannot load fails loud here instead of in prod.
 *
 * .note = all THREE daemon self-exit doors are proven through the real `.sh` boundary here:
 *         route-not-live (case3, a blocked tail), route-complete (case6, every stone passed), and
 *         session-dead (case7, a live drive whose bogus clone-addr fails reach-state). ONE coverage
 *         limit is known + deliberate: the `sayToClone` `{ reached: true }` path — a nudge that
 *         LANDS in a real LIVE enrolled clone — is exercised nowhere here, because `clone say`
 *         refuses a non-LIVE clone and no sandbox can enroll one. it is the vision's nudge-efficacy
 *         must-validate, confirmed once by hand on a real driver (see the howto.route-reminder
 *         guide, "validate nudge efficacy"). every OTHER path — get, del, gen, all three daemon
 *         self-exit reasons, and the auto-wire — is proven here through the real `.sh` boundary.
 */
describe('driver.route.reminder.acceptance', () => {
  // reap every real sleeper this file spawned to stand in for a live daemon, so no test process
  // outlives the suite. a case that already stopped its own sleeper (case9's del, case11's
  // manual kill) leaves it already-dead here — a harmless ESRCH no-op, never a swallowed fault.
  afterAll(() => {
    for (const pid of spawnedSleeperPids) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
      }
    }
  });

  given('[case1] a fresh route with no reminder set', () => {
    when('[t0] route.reminder.get runs via the real skill wrapper', () => {
      const res = useThen('invoke the get skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'reminder-get',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        const cli = await invokeRouteSkill({
          skill: 'route.reminder.get',
          args: { route: '.', 'clone-addr': '@:driver-1' },
          cwd: tempDir,
        });
        return { cli };
      });

      then('the skill loads and exits clean', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('it reports the reminder is not live', () => {
        expect(res.cli.stdout).toContain('reminder is not live');
      });

      then('the get stdout matches the shell snapshot a human reads', () => {
        expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] route.reminder.del runs via the real skill wrapper', () => {
      const res = useThen('invoke the del skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'reminder-del',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        const cli = await invokeRouteSkill({
          skill: 'route.reminder.del',
          args: { route: '.', 'clone-addr': '@:driver-1' },
          cwd: tempDir,
        });
        return { cli };
      });

      then('the skill loads and exits clean (idempotent no-op)', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('it reports the reminder was not live', () => {
        expect(res.cli.stdout).toContain('reminder was not live');
      });

      then('the del stdout matches the shell snapshot a human reads', () => {
        expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] a human asks the gen skill for help', () => {
    when('[t0] route.reminder.gen --help runs via the real skill wrapper', () => {
      const res = useThen('invoke the gen skill with --help', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'reminder-gen-help',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        const cli = await invokeRouteSkill({
          skill: 'route.reminder.gen',
          args: { help: true },
          cwd: tempDir,
        });
        return { cli };
      });

      then('the skill loads and exits clean', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('it prints the usage block (help on demand)', () => {
        expect(res.cli.stdout).toContain('route.reminder');
        expect(res.cli.stdout).toContain('--route');
        expect(res.cli.stdout).toContain('--clone-addr');
      });

      then('the full --help usage block matches its snapshot', () => {
        expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] a blocked route (the daemon must self-exit at once, no live clone)',
    () => {
      when(
        '[t0] route.reminder.daemon runs the real loop against the blocked route',
        () => {
          const res = useThen('invoke the daemon skill', async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-daemon',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            // seed a BLOCKED passage tail so the daemon exits on tick 1 BEFORE it reaches a clone —
            // the whole arc is deterministic in-sandbox (a real LIVE-clone nudge is out of a
            // sandbox's reach, the vision's must-validate).
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"5.1.execution","status":"blocked","blocker":"approval"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.daemon',
              args: {
                route: '.',
                'clone-addr': '@:driver-1',
                // a valid cadence at/above the 1000ms sane floor; the daemon exits on tick 1 for a
                // BLOCKED route (tick precedes any sleep), so the value never delays this test
                'interval-ms': '1000',
              },
              cwd: tempDir,
            });
            return { cli };
          });

          then(
            'the full bash → node -e → import() → cli chain loads and runs',
            () => {
              // exit 0 proves the daemon reached its own self-exit — not a silent import() death
              expect(res.cli.code).toEqual(0);
            },
          );

          then(
            'the daemon self-exits route-not-live and logs its exit reason',
            () => {
              expect(res.cli.stdout).toContain('route.reminder.daemon exited');
              expect(res.cli.stdout).toContain('reason=route-not-live');
            },
          );

          then('the daemon self-exit stdout matches its shell snapshot', () => {
            expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case4] a fresh blocked route — gen drives the REAL detached-spawn path',
    () => {
      when('[t0] route.reminder.gen runs the real register path', () => {
        const res = useThen(
          'invoke gen (real spawn), then del to reap',
          async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-gen-spawn',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            // a BLOCKED tail makes the spawned daemon self-exit on tick 1, so the real detached
            // child never lingers past this test (deterministic in-sandbox).
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"5.1.execution","status":"blocked","blocker":"approval"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            // gen spawns a REAL detached daemon through the full bash → node -e → import chain
            const gen = await invokeRouteSkill({
              skill: 'route.reminder.gen',
              args: {
                route: '.',
                'clone-addr': '@:driver-1',
                // a valid cadence at/above the 1000ms sane floor; the daemon exits on tick 1 for a
                // BLOCKED route (tick precedes any sleep), so the value never delays this test
                'interval-ms': '1000',
              },
              cwd: tempDir,
            });
            // reap: stop any live daemon + clear the handle, so no process outlives the test
            const del = await invokeRouteSkill({
              skill: 'route.reminder.del',
              args: { route: '.', 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            return { gen, del };
          },
        );

        then('gen drives the real spawn path and exits clean', () => {
          // exit 0 proves the full bash → node -e → import() → spawn path ran for real, end to
          // end — the one path never driven before (only a fake recorder or `--help` smoke)
          expect(res.gen.code).toEqual(0);
        });

        then('gen reports a real spawned pid', () => {
          // both honest branches name the pid: "spawned and live (pid N)" on a probe-alive daemon,
          // or "spawned (pid N) but exited on arrival" when the blocked route self-exits it first
          expect(res.gen.stdout).toMatch(/pid \d+/);
          expect(res.gen.stdout).toContain('spawned');
        });

        then('the real gen-spawn stdout matches its shell snapshot', () => {
          // the route is set BLOCKED before gen runs (line 270 above), so
          // getRouteReminderDriveActivity reads it inactive deterministically — the "not a live
          // drive (route-not-live)" branch is the one honest outcome here, not a race between the
          // two branches. mask the pid (and tmpdir/timestamp) so the LIVE, real-spawn shell text is
          // proven under snapshot, not only loose-asserted (rule.require.contract-snapshot-exhaustiveness).
          expect(scrubReminderStdout(res.gen.stdout)).toMatchSnapshot();
        });

        then('a follow-up del reaps cleanly', () => {
          expect(res.del.code).toEqual(0);
        });

        then(
          'the REAL detached daemon process is actually dead after del (liveness asserted, not just exit 0)',
          async () => {
            // the r10-i030 §2 clamp: prior to this, "no process outlives the test" rested on a code
            // comment + gen/del exit-0, never an assertion on the OS process. probe the pid gen
            // spawned — a blocked route self-exits it on tick 1, and del reaps the handle — so it MUST
            // be reaped. RED if a spawned daemon ever lingered; GREEN once it is truly gone.
            const pid = asPidFromStdout(res.gen.stdout);
            await awaitPidDead(pid);
            expect(isPidAlive(pid)).toBe(false);
          },
        );
      });
    },
  );

  given(
    '[case5] the AUTO-WIRE — route.drive findserts the reminder on a live drive',
    () => {
      when(
        '[t0] route.drive runs in an enrolled env against a live route',
        () => {
          const res = useThen(
            'run route.drive (enrolled), assert the handle, then reap',
            async () => {
              const tempDir = genTempDirForRhachet({
                slug: 'reminder-autowire',
                clone: ASSETS_DIR,
              });
              await execAsync('npx rhachet roles link --role driver', {
                cwd: tempDir,
              });
              // a LIVE passage tail (1.vision passed, more stones remain) → the route is a live,
              // unfinished drive, so the auto-wire findserts the reminder. a real detached daemon
              // spawns, fires tick 1 against the bogus clone addr, fails reach-state, and self-exits
              // — so it never lingers past this test (deterministic in-sandbox).
              await execAsync('mkdir -p .route', { cwd: tempDir });
              await execAsync(
                `printf '%s\\n' '{"stone":"1.vision","status":"passed"}' > .route/passage.jsonl`,
                { cwd: tempDir },
              );
              // route.drive runs with the enroller-injected serial in its env — the exact way the
              // real hook runs inside a driver clone. no manual route.reminder.gen is invoked.
              const drive = await invokeRouteSkill({
                skill: 'route.drive',
                args: { route: '.' },
                cwd: tempDir,
                env: { RHACHET_CLONE_SERIAL: 'driver-auto-1' },
              });
              // the pid handle is written synchronously as the findsert runs, BEFORE route.drive
              // returns — so it persists even after the daemon self-exits (only del removes it).
              const ls = await execAsync('ls .route', { cwd: tempDir });
              // read the pid the auto-wire wrote to its per-session handle BEFORE del clears it — the
              // auto-wire prints no pid to stdout, so the handle file is the only source of the pid to
              // probe for the liveness assertion below.
              const pidHandle = await execAsync(
                'cat .route/daemon.of=reminder-driveon.session=*.pid',
                { cwd: tempDir },
              );
              // reap any remnant daemon + clear the handle, so no process/handle outlives the test
              const del = await invokeRouteSkill({
                skill: 'route.reminder.del',
                // getRouteDriverCloneAddr auto-prefixes the raw env serial with '@:'
                args: { route: '.', 'clone-addr': '@:driver-auto-1' },
                cwd: tempDir,
              });
              return { drive, ls, pidHandle, del };
            },
          );

          then('route.drive exits clean (the auto-sync never breaks the drive)', () => {
            expect(res.drive.code).toEqual(0);
          });

          then('route.drive still surfaces its stone guidance', () => {
            // the reminder sync is auxiliary — the drive's core output is unaffected
            expect(res.drive.stdout).toContain('route.drive');
            // snapshot the auto-wire drive output too (the file's stated policy for every case).
            // .why deterministic = route renders as '.', and the drive guidance carries no pid /
            //      timestamp / tempdir — unlike res.del, whose message races the real daemon's
            //      self-exit, so only res.del.code (not its text) is asserted below.
            expect(scrubReminderStdout(res.drive.stdout)).toMatchSnapshot();
          });

          then('the auto-wire wrote the per-session reminder pid handle', () => {
            // the handle file proves route.drive findserted + spawned the daemon with no manual step
            expect(res.ls.stdout).toContain('daemon.of=reminder-driveon');
          });

          then('a follow-up del reaps the auto-wired reminder cleanly', () => {
            expect(res.del.code).toEqual(0);
          });

          then(
            'the auto-wired detached daemon process is actually dead after del (liveness asserted, not just exit 0)',
            async () => {
              // the r10-i030 §2 clamp, for the AUTO-WIRE path: the daemon route.drive findserted must
              // be a truly reaped OS process afterward, not merely a handle plus an exit-0. probe the
              // pid the findsert wrote to the handle — a bogus clone addr self-exits it session-dead
              // on tick 1, and del reaps the handle — so it MUST be gone.
              const pid = asPidFromHandle(res.pidHandle.stdout);
              await awaitPidDead(pid);
              expect(isPidAlive(pid)).toBe(false);
            },
          );
        },
      );
    },
  );

  given(
    '[case6] a COMPLETED route (every stone passed — the daemon self-exits route-complete)',
    () => {
      when(
        '[t0] route.reminder.daemon runs the real loop against the completed route',
        () => {
          const res = useThen('invoke the daemon skill', async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-daemon-complete',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            // seed a passage where ALL THREE fixture stones are passed → the stone frontier is
            // empty AND stones exist ⇒ route-complete. the tail is `passed`, which the status
            // predicate alone reads LIVE (indistinct from a mid-route pause), so this proves the
            // stone-frontier discriminator fires through the REAL shell — not just at the TS layer.
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"1.vision","status":"passed"}' '{"stone":"2.criteria","status":"passed"}' '{"stone":"3.plan","status":"passed"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.daemon',
              args: {
                route: '.',
                'clone-addr': '@:driver-1',
                // the daemon exits on tick 1 for a completed route (tick precedes any sleep), so
                // this cadence never delays the test
                'interval-ms': '1000',
              },
              cwd: tempDir,
            });
            return { cli };
          });

          then('the daemon self-exits route-complete and logs its reason', () => {
            // exit 0 proves the full shell chain reached the completion self-exit
            expect(res.cli.code).toEqual(0);
            expect(res.cli.stdout).toContain('route.reminder.daemon exited');
            expect(res.cli.stdout).toContain('reason=route-complete');
          });

          then('the completed-route self-exit stdout matches its snapshot', () => {
            expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case7] a live drive but an unreachable clone (dead session — the daemon self-exits session-dead)',
    () => {
      when(
        '[t0] route.reminder.daemon runs the real loop, reaches the bogus clone, and fails reach-state',
        () => {
          const res = useThen('invoke the daemon skill', async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-daemon-deadsession',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            // seed a LIVE, unfinished drive (1.vision passed, 2 stones remain) → the route is
            // active, so the daemon does NOT exit on the route door — it proceeds to the inject,
            // runs the REAL `rhx clone say @:driver-1` against a bogus addr in a non-enrolled env,
            // which exits 2 (no LIVE clone) → reach-state fails → the session-dead door. proves
            // that door through the actual shell, not only the TS layer.
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"1.vision","status":"passed"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.daemon',
              args: {
                route: '.',
                'clone-addr': '@:driver-1',
                // the daemon exits on tick 1 (reach-state fails before any sleep), so this cadence
                // never delays the test
                'interval-ms': '1000',
              },
              cwd: tempDir,
            });
            return { cli, tempDir };
          });

          then('the daemon self-exits session-dead and logs its reason', () => {
            // exit 0 proves the shell chain reached the dead-session self-exit — the daemon tore
            // itself down rather than a nudge at a corpse (U3 anti-clog, through the real shell)
            expect(res.cli.code).toEqual(0);
            expect(res.cli.stdout).toContain('route.reminder.daemon exited');
            expect(res.cli.stdout).toContain('reason=session-dead');
          });

          // the wisher's most recent ask (2026-09-06): a session-dead self-exit is NOT silent — it
          // writes a durable, discoverable crash record. r10 (i035) flagged that this headline fix had
          // NO proof at the human layer — case7 asserted only the stdout reason line, never the
          // on-disk `.malfunctions/` record a human would actually look for. this reads that file
          // through the REAL shell boundary (not the TS leaf) and asserts its content: the reason, the
          // dead session's cloneAddr, and the tick count. RED if the daemon exited without the durable
          // record; GREEN once the crash log lands where the wisher required it.
          then(
            'it writes a durable crash record under .malfunctions/ with reason + session + ticks',
            async () => {
              const crashLogPath = path.join(
                res.tempDir,
                '.malfunctions',
                'daemon.driveon._.crash.n0.log',
              );
              const crashLog = await fs.readFile(crashLogPath, 'utf-8');
              expect(crashLog).toContain('reason=session-dead');
              expect(crashLog).toContain('clone:  @:driver-1');
              expect(crashLog).toContain('ticks:  1');
            },
          );

          then('the dead-session self-exit stdout matches its snapshot', () => {
            expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
          });
        },
      );
    },
  );

  // the findsert-hit steady-state message — "already live, no duplicate" — is a message a human
  // sees on every re-register of an active session. this proves it through the REAL shell boundary
  // (only the injected CLI-integration layer had it before), with a genuinely live pid claimed for
  // the handle, so gen's fast path (getRouteReminder, real kill -0) finds it and returns with no
  // spawn (rule.require.contract-snapshot-exhaustiveness).
  given(
    '[case8] a session whose handle already names a live daemon (findsert hit)',
    () => {
      when(
        '[t0] route.reminder.gen runs against the already-live session',
        () => {
          const res = useThen(
            'claim a real live pid for the handle, then invoke gen',
            async () => {
              const tempDir = genTempDirForRhachet({
                slug: 'reminder-gen-already-live',
                clone: ASSETS_DIR,
              });
              await execAsync('npx rhachet roles link --role driver', {
                cwd: tempDir,
              });
              await execAsync('mkdir -p .route', { cwd: tempDir });
              await execAsync(
                `printf '%s\\n' '{"stone":"5.1.execution","status":"arrived"}' > .route/passage.jsonl`,
                { cwd: tempDir },
              );
              // stand up a real live pid and claim the handle for it — the findsert precondition
              const pid = spawnRealSleeper();
              await execAsync(
                `printf '%s' '${pid}' > '.route/daemon.of=reminder-driveon.session=~40~3adriver-1.pid'`,
                { cwd: tempDir },
              );
              const cli = await invokeRouteSkill({
                skill: 'route.reminder.gen',
                args: { route: '.', 'clone-addr': '@:driver-1' },
                cwd: tempDir,
              });
              return { cli };
            },
          );

          then('it reports the daemon already live, no duplicate spawned', () => {
            expect(res.cli.code).toEqual(0);
            expect(res.cli.stdout).toContain('already live');
            expect(res.cli.stdout).toContain('no duplicate spawned');
          });

          then('the findsert-hit stdout matches its shell snapshot', () => {
            expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
          });
        },
      );
    },
  );

  // the deregister-success message — "live daemon stopped, handle cleared" — is the other message a
  // human sees most. a real live sleeper is claimed for the handle, del stops it for real, and the
  // reap is proven by a deterministic poll (never a fixed sleep — rule.forbid.time-assumptions).
  given(
    '[case9] a session whose handle names a genuinely live daemon (deregister)',
    () => {
      when('[t0] route.reminder.del runs against the live daemon', () => {
        const res = useThen(
          'claim a real live pid for the handle, then invoke del',
          async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-del-live',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"5.1.execution","status":"arrived"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            const pid = spawnRealSleeper();
            await execAsync(
              `printf '%s' '${pid}' > '.route/daemon.of=reminder-driveon.session=~40~3adriver-1.pid'`,
              { cwd: tempDir },
            );
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.del',
              args: { route: '.', 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            return { cli, pid };
          },
        );

        then('it stops the live daemon and clears the handle', () => {
          expect(res.cli.code).toEqual(0);
          expect(res.cli.stdout).toContain('deregistered');
          expect(res.cli.stdout).toContain('handle cleared');
        });

        // the deregister-success line names no pid, so it snaps clean with no scrub needed for it —
        // scrubReminderStdout still runs, harmlessly, to stay consistent with every other case.
        then('the deregister-success stdout matches its shell snapshot', () => {
          expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
        });

        then(
          'the REAL sleeper process is actually dead after del (liveness asserted, not just exit 0)',
          async () => {
            await awaitPidDead(res.pid);
            expect(isPidAlive(res.pid)).toBe(false);
          },
        );
      });
    },
  );

  // the DETECT live-branch — "reminder is live — daemon pid N" — is the everyday "is it on?" read
  // the runbook points a human at. a real live sleeper claimed for the handle proves this through
  // the real shell boundary, not only the injected CLI-integration layer.
  given(
    '[case10] a session whose handle names a genuinely live daemon (detect)',
    () => {
      when('[t0] route.reminder.get runs against the live session', () => {
        const res = useThen(
          'claim a real live pid for the handle, then invoke get',
          async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-get-live',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"5.1.execution","status":"arrived"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            const pid = spawnRealSleeper();
            await execAsync(
              `printf '%s' '${pid}' > '.route/daemon.of=reminder-driveon.session=~40~3adriver-1.pid'`,
              { cwd: tempDir },
            );
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.get',
              args: { route: '.', 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            return { cli };
          },
        );

        then('it reports the reminder is live, with the pid', () => {
          expect(res.cli.code).toEqual(0);
          expect(res.cli.stdout).toContain('reminder is live');
          expect(res.cli.stdout).toMatch(/daemon pid \d+/);
        });

        then('the live-detect stdout matches its shell snapshot', () => {
          expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
        });
      });
    },
  );

  // the DETECT circuit-broken branch: when the auto-respawn breaker has TRIPPED, `get` must NOT
  // collapse the trip into the generic "gone quiet" message — it names the distinct state and the
  // actual fix (repair the spawn, re-arm with gen). trips the breaker via the SAME single-byte
  // marker file production writes (CRASH_MARKER_BYTE, one 'x' per crash), through the real shell.
  given(
    '[case13] a session whose auto-respawn breaker has tripped (circuit-broken)',
    () => {
      when(
        '[t0] route.reminder.get runs against the circuit-broken session',
        () => {
          const res = useThen('trip the breaker, then invoke get', async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-get-circuit-broken',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"5.1.execution","status":"arrived"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            // 6 crash markers exceeds MAX_ROUTE_REMINDER_CRASHES (5) — one 'x' byte per
            // crash-on-arrival, the same append production's bump writes.
            await execAsync(
              `printf 'xxxxxx' > '.route/daemon.of=reminder-driveon.session=~40~3adriver-1.crashes'`,
              { cwd: tempDir },
            );
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.get',
              args: { route: '.', 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            return { cli };
          });

          then(
            'it reports the circuit-broken state and names the re-arm fix',
            () => {
              expect(res.cli.code).toEqual(0);
              expect(res.cli.stdout).toContain('reminder is not live');
              expect(res.cli.stdout).toContain('CIRCUIT-BROKEN');
              expect(res.cli.stdout).toContain('route.reminder.gen');
            },
          );

          then('the circuit-broken stdout matches its shell snapshot', () => {
            expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
          });
        },
      );
    },
  );
});

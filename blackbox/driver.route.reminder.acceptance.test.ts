import { spawn as spawnChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

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
// the scrub masks only the temp root: the segments up to the first in-repo anchor (`.agent`,
// `.behavior`, `.route`), so a snapshot still shows which file the human is told to act on. a
// path with no anchor masks whole, and never swallows a close paren or a quote that follows it
const asTempRootPattern = (root: string): RegExp =>
  new RegExp(
    `${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:(?:/[^\\s"';/()]+)*?(?=/\\.(?:agent|behavior|route)\\b)|[^\\s"';()]*)`,
    'g',
  );
const TMPDIR_PATTERN = asTempRootPattern(os.tmpdir());
// the repo-local temp home (genTempDir's symlink form) — a path a refusal or a log line names
const REPO_TEMP_PATTERN = asTempRootPattern(path.join(process.cwd(), '.temp'));
const scrubReminderStdout = (stdout: string): string =>
  stdout
    .replace(REPO_TEMP_PATTERN, '<tmpdir>')
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

// the clone home of every reminder handle, under the repo root (the temp dir is a git repo). the
// handle names one clone and no route: one daemon per clone, whatever routes it drives
const HANDLE_DIR = '.agent/.cache/repo=bhrain/role=driver/skill=route.reminder';
const HANDLE_STEM = 'daemon.of=reminder-driveon.session=~40~3adriver-1';

// writes one clone handle file (pid, crashes, focus) under the clone home, with its dir
const writeCloneHandle = async (input: {
  tempDir: string;
  ext: 'pid' | 'crashes' | 'focus';
  content: string;
}): Promise<void> => {
  const dir = path.join(input.tempDir, HANDLE_DIR);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${HANDLE_STEM}.${input.ext}`), input.content);
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
          args: { 'clone-addr': '@:driver-1' },
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
          args: { 'clone-addr': '@:driver-1' },
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
            // the daemon reads the route from the clone focus, which a drive or gen writes
            await writeCloneHandle({ tempDir, ext: 'focus', content: `${tempDir}\n` });
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.daemon',
              args: {
                'repo-root': tempDir,
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

  // the orphan clamp, through the real skill: a daemon spawned on a route that is not a live drive
  // would exit on its first tick, and until then hold the clone's one slot unowned, so a drive of a
  // live route in that window could spawn a second beside it. gen spawns none there. the REAL
  // detached-spawn path is driven by case5 (route.drive on a live route) and case18 (gen on one)
  given(
    '[case4] a fresh blocked route — gen through the real skill spawns none',
    () => {
      when('[t0] route.reminder.gen runs the real register path', () => {
        const res = useThen(
          'invoke gen, then get, then del',
          async () => {
            const tempDir = genTempDirForRhachet({
              slug: 'reminder-gen-spawn',
              clone: ASSETS_DIR,
            });
            await execAsync('npx rhachet roles link --role driver', {
              cwd: tempDir,
            });
            await execAsync('mkdir -p .route', { cwd: tempDir });
            await execAsync(
              `printf '%s\\n' '{"stone":"5.1.execution","status":"blocked","blocker":"approval"}' > .route/passage.jsonl`,
              { cwd: tempDir },
            );
            // gen through the full bash → node -e → import chain, on the blocked route
            const gen = await invokeRouteSkill({
              skill: 'route.reminder.gen',
              args: {
                route: '.',
                'clone-addr': '@:driver-1',
                'interval-ms': '1000',
              },
              cwd: tempDir,
            });
            // get reads the clone's slot as the shell sees it
            const get = await invokeRouteSkill({
              skill: 'route.reminder.get',
              args: { 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            // del stays idempotent: naught to stop
            const del = await invokeRouteSkill({
              skill: 'route.reminder.del',
              args: { 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            return { gen, get, del };
          },
        );

        then('gen exits clean', () => {
          expect(res.gen.code).toEqual(0);
        });

        then('gen names the halt, with its status, and spawns none', () => {
          expect(res.gen.stdout).toContain('reminder not spawned');
          expect(res.gen.stdout).toContain('route-not-live, status blocked');
          expect(res.gen.stdout).not.toMatch(/pid \d+/);
        });

        then('the gen stdout matches its shell snapshot', () => {
          expect(scrubReminderStdout(res.gen.stdout)).toMatchSnapshot();
        });

        then('get finds no daemon live, and names the focus halt', () => {
          expect(res.get.code).toEqual(0);
          expect(res.get.stdout).toContain('reminder is not live');
          expect(res.get.stdout).toContain('route-not-live, status blocked');
        });

        then('del finds no live daemon to stop', () => {
          expect(res.del.code).toEqual(0);
          expect(res.del.stdout).toContain('reminder was not live');
        });
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
              // a `rhx` shim, first on the PATH the daemon inherits: it holds each `clone say` until
              // a release file appears (bounded, 30s), and hands every other call to the real rhx.
              // the daemon cannot pass tick 1 before the release, so the reads below never race
              // its self-exit
              const shimDir = path.join(tempDir, '.shim');
              const releasePath = path.join(shimDir, 'release');
              await fs.mkdir(shimDir, { recursive: true });
              const rhxReal = (await execAsync('which rhx')).stdout.trim();
              await fs.writeFile(
                path.join(shimDir, 'rhx'),
                [
                  '#!/usr/bin/env bash',
                  'if [[ "$1" == "clone" && "$2" == "say" ]]; then',
                  `  for _ in $(seq 600); do [[ -f '${releasePath}' ]] && break; sleep 0.05; done`,
                  'fi',
                  `exec '${rhxReal}' "$@"`,
                  '',
                ].join('\n'),
                { mode: 0o755 },
              );
              // route.drive runs with the enroller-injected serial in its env — the exact way the
              // real hook runs inside a driver clone. no manual route.reminder.gen is invoked.
              const drive = await invokeRouteSkill({
                skill: 'route.drive',
                args: { route: '.' },
                cwd: tempDir,
                env: {
                  RHACHET_CLONE_SERIAL: 'driver-auto-1',
                  PATH: `${shimDir}:${process.env.PATH ?? ''}`,
                },
              });
              // the pid handle is claimed as the findsert runs, BEFORE route.drive returns, and the
              // shim holds the daemon at tick 1, so these reads find the handle in place
              const ls = await execAsync(`ls '${HANDLE_DIR}'`, { cwd: tempDir });
              // read the pid the auto-wire wrote to its per-clone handle BEFORE del clears it — the
              // auto-wire prints no pid to stdout, so the handle file is the only source of the pid to
              // probe for the liveness assertion below.
              const pidHandle = await execAsync(
                `cat '${HANDLE_DIR}'/daemon.of=reminder-driveon.session=*.pid`,
                { cwd: tempDir },
              );
              // the focus the drive wrote: the route this clone drives now
              const focus = await execAsync(
                `cat '${HANDLE_DIR}'/daemon.of=reminder-driveon.session=*.focus`,
                { cwd: tempDir },
              );
              // the daemon is still held at tick 1: it is live now, deterministically
              const pidHeld = asPidFromHandle(pidHandle.stdout);
              const aliveWhileHeld = isPidAlive(pidHeld);
              // release the shim, then reap the daemon + clear the handle, so no process outlives
              // the test
              await fs.writeFile(releasePath, '');
              const del = await invokeRouteSkill({
                skill: 'route.reminder.del',
                // getRouteDriverCloneAddr auto-prefixes the raw env serial with '@:'
                args: { 'clone-addr': '@:driver-auto-1' },
                cwd: tempDir,
              });
              // the drive anchors on the git root, which reads the temp dir through its symlink;
              // compare real paths so one dir is never read as two
              const tempDirReal = await fs.realpath(tempDir);
              return {
                drive,
                ls,
                pidHandle,
                focus,
                aliveWhileHeld,
                del,
                tempDirReal,
              };
            },
          );

          then('the auto-wired daemon is live while the shim holds its tick', () => {
            expect(res.aliveWhileHeld).toBe(true);
          });

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

          then('the auto-wire wrote the per-clone reminder pid handle', () => {
            // the handle file proves route.drive findserted + spawned the daemon with no manual step
            expect(res.ls.stdout).toContain('daemon.of=reminder-driveon');
          });

          then('the auto-wire focused the clone reminder on the driven route', async () => {
            expect(await fs.realpath(res.focus.stdout.trim())).toEqual(
              res.tempDirReal,
            );
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
            // the daemon reads the route from the clone focus, which a drive or gen writes
            await writeCloneHandle({ tempDir, ext: 'focus', content: `${tempDir}\n` });
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.daemon',
              args: {
                'repo-root': tempDir,
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
            // the daemon reads the route from the clone focus, which a drive or gen writes
            await writeCloneHandle({ tempDir, ext: 'focus', content: `${tempDir}\n` });
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.daemon',
              args: {
                'repo-root': tempDir,
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
    '[case8] a clone whose handle already names a live daemon (findsert hit)',
    () => {
      when(
        '[t0] route.reminder.gen runs against the already-live clone',
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
              await writeCloneHandle({ tempDir, ext: 'pid', content: String(pid) });
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
    '[case9] a clone whose handle names a genuinely live daemon (deregister)',
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
            await writeCloneHandle({ tempDir, ext: 'pid', content: String(pid) });
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.del',
              args: { 'clone-addr': '@:driver-1' },
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
    '[case10] a clone whose handle names a genuinely live daemon (detect)',
    () => {
      when('[t0] route.reminder.get runs against the live clone', () => {
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
            await writeCloneHandle({ tempDir, ext: 'pid', content: String(pid) });
            // the live daemon nudges about its focus, the live route here — by its real path, the
            // form a drive writes, so get reads it inside the repo root
            await writeCloneHandle({
              tempDir,
              ext: 'focus',
              content: `${await fs.realpath(tempDir)}\n`,
            });
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.get',
              args: { 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            return { cli };
          },
        );

        then('it reports the reminder is live, with the pid and focus', () => {
          expect(res.cli.code).toEqual(0);
          expect(res.cli.stdout).toContain('reminder is live — daemon pid');
          // the focus is the repo root itself, so its label is `.`
          expect(res.cli.stdout).toMatch(/daemon pid \d+, focus \.$/m);
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
    '[case13] a clone whose auto-respawn breaker has tripped (circuit-broken)',
    () => {
      when(
        '[t0] route.reminder.get runs against the circuit-broken clone',
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
            await writeCloneHandle({ tempDir, ext: 'crashes', content: 'xxxxxx' });
            const cli = await invokeRouteSkill({
              skill: 'route.reminder.get',
              args: { 'clone-addr': '@:driver-1' },
              cwd: tempDir,
            });
            return { cli };
          });

          then(
            'it reports the circuit-broken state and names the re-arm fix',
            () => {
              expect(res.cli.code).toEqual(0);
              expect(res.cli.stdout).toContain('reminder is not live');
              expect(res.cli.stdout).toContain('circuit-broken');
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

  // the reminder is one per clone, so get reads no route. a --route accepted and ignored would let
  // a human believe they read one route's own reminder; the real skill refuses it, exit 2
  given('[case14] get and del calls that pass --route', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-route-refused',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] route.reminder.get --route runs via the real skill wrapper', () => {
      const res = useThen('invoke get with --route', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.get',
          args: { route: '.', 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it exits 2 behind a ConstraintError header, and names the fix', () => {
        expect(res.cli.code).toEqual(2);
        expect(res.cli.stderr).toContain(
          '✋ ConstraintError: route.reminder.get takes no --route',
        );
        expect(res.cli.stderr).toContain('└─ fix: drop --route');
        expect(res.cli.stderr).not.toContain('    at ');
        expect(scrubReminderStdout(res.cli.stderr)).toMatchSnapshot();
      });
    });

    when('[t1] route.reminder.del --route runs via the real skill wrapper', () => {
      const res = useThen('invoke del with --route', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.del',
          args: { route: '.', 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it exits 2 with the same refusal, named for del', () => {
        expect(res.cli.code).toEqual(2);
        expect(res.cli.stderr).toContain(
          '✋ ConstraintError: route.reminder.del takes no --route',
        );
        expect(res.cli.stdout).not.toContain('reminder deregistered');
        expect(scrubReminderStdout(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  // each other caller slip a human can hit renders the same frame through the real skill: a
  // `✋ ConstraintError:` header and a fix, exit 2 — never a raw BadRequestError or a stack
  given('[case15] the other caller slips, through the real skill wrappers', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-slips',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    const SLIPS: {
      title: string;
      skill: Parameters<typeof invokeRouteSkill>[0]['skill'];
      args: Record<string, string>;
      header: string;
    }[] = [
      {
        title: '[t0] route.reminder.get --repo-root',
        skill: 'route.reminder.get',
        args: { 'repo-root': '.', 'clone-addr': '@:driver-1' },
        header: '✋ ConstraintError: route.reminder.get takes no --repo-root',
      },
      {
        title: '[t1] route.reminder.del --repo-root',
        skill: 'route.reminder.del',
        args: { 'repo-root': '.', 'clone-addr': '@:driver-1' },
        header: '✋ ConstraintError: route.reminder.del takes no --repo-root',
      },
      {
        title: '[t2] route.reminder.get with a bare serial for --clone-addr',
        skill: 'route.reminder.get',
        args: { 'clone-addr': 'driver-1' },
        header: "✋ ConstraintError: 'driver-1' is not a clone address",
      },
      {
        title: '[t3] route.reminder.gen with a --route that is not a dir',
        skill: 'route.reminder.gen',
        args: { route: 'v9.typo', 'clone-addr': '@:driver-1' },
        header: '✋ ConstraintError: the route "v9.typo" is not a dir',
      },
      {
        title: '[t4] route.reminder.daemon with no --repo-root',
        skill: 'route.reminder.daemon',
        args: { 'clone-addr': '@:driver-1' },
        header: '✋ ConstraintError: --repo-root is required',
      },
    ];

    SLIPS.forEach((slip) => {
      when(`${slip.title} runs via the real skill wrapper`, () => {
        const res = useThen(`invoke ${slip.skill}`, async () => ({
          cli: await invokeRouteSkill({
            skill: slip.skill,
            args: slip.args,
            cwd: scene.tempDir,
          }),
        }));

        then('it exits 2 behind a ConstraintError header, with a fix and no stack', () => {
          expect(res.cli.code).toEqual(2);
          expect(res.cli.stderr).toContain(slip.header);
          expect(res.cli.stderr).toContain('fix:');
          expect(res.cli.stderr).not.toContain('    at ');
          expect(scrubReminderStdout(res.cli.stderr)).toMatchSnapshot();
        });
      });
    });
  });

  // the wish's headline, through the real route.drive: one clone drives route A, then route B,
  // both live, and holds ONE reminder whose focus moves to B. a real sleeper stands in the clone's
  // slot as its live daemon, so each drive's findsert hits it and no detached spawn races the reads
  given('[case17] one clone drives two live routes in one repo, through route.drive', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-two-routes',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      // two live routes under .behavior/, each with the fixture stones and a live passage tail
      for (const slug of ['route-a', 'route-b']) {
        await execAsync(
          `mkdir -p .behavior/${slug}/.route && cp ./*.stone .behavior/${slug}/ && printf '%s\\n' '{"stone":"1.vision","status":"passed"}' > .behavior/${slug}/.route/passage.jsonl`,
          { cwd: tempDir },
        );
      }
      const sleeperPid = spawnRealSleeper();
      await writeCloneHandle({
        tempDir,
        ext: 'pid',
        content: String(sleeperPid),
      });
      return { tempDir, sleeperPid };
    });

    when('[t0] the clone drives route A, then route B', () => {
      const res = useThen('drive A, drive B, then read the slot', async () => {
        const env = { RHACHET_CLONE_SERIAL: 'driver-1' };
        const driveA = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.behavior/route-a' },
          cwd: scene.tempDir,
          env,
        });
        const driveB = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.behavior/route-b' },
          cwd: scene.tempDir,
          env,
        });
        const handles = (
          await fs.readdir(path.join(scene.tempDir, HANDLE_DIR))
        ).filter((name) => name.endsWith('.pid'));
        const pid = await fs.readFile(
          path.join(scene.tempDir, HANDLE_DIR, `${HANDLE_STEM}.pid`),
          'utf8',
        );
        const get = await invokeRouteSkill({
          skill: 'route.reminder.get',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        });
        return { driveA, driveB, handles, pid, get };
      });

      then('both drives exit clean', () => {
        expect(res.driveA.code).toEqual(0);
        expect(res.driveB.code).toEqual(0);
      });

      then('the clone holds one pid handle, still the one live daemon', () => {
        expect(res.handles).toEqual([`${HANDLE_STEM}.pid`]);
        expect(Number(res.pid.trim())).toEqual(scene.sleeperPid);
      });

      then('get names the one live daemon, with its focus on route B', () => {
        expect(res.get.code).toEqual(0);
        expect(res.get.stdout).toContain('reminder is live — daemon pid');
        expect(res.get.stdout).toContain('focus .behavior/route-b');
        expect(scrubReminderStdout(res.get.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] del stops the clone reminder', () => {
      const res = useThen('invoke del', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.del',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('del stops the one daemon, and it is dead', async () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).toContain('reminder deregistered');
        expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
        await awaitPidDead(scene.sleeperPid);
        expect(isPidAlive(scene.sleeperPid)).toBe(false);
      });
    });
  });

  // the halt-and-reap journey, through the real route.drive: a clone drives a live route, the route
  // then halts (a blocked passage), and the next drive reaps the clone's daemon. the focus stays, so
  // get names the route and why it halted. a real sleeper stands in the slot as the live daemon
  given('[case20] one clone drives a route that then halts, through route.drive', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-halt-reap',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      await execAsync(
        `mkdir -p .behavior/route-a/.route && cp ./*.stone .behavior/route-a/ && printf '%s\\n' '{"stone":"1.vision","status":"passed"}' > .behavior/route-a/.route/passage.jsonl`,
        { cwd: tempDir },
      );
      const sleeperPid = spawnRealSleeper();
      await writeCloneHandle({
        tempDir,
        ext: 'pid',
        content: String(sleeperPid),
      });
      return { tempDir, sleeperPid };
    });
    const env = { RHACHET_CLONE_SERIAL: 'driver-1' };

    when('[t0] the clone drives the live route', () => {
      const res = useThen('drive, then get', async () => {
        const drive = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.behavior/route-a' },
          cwd: scene.tempDir,
          env,
        });
        // the bare get a human types inside the clone: the clone comes from the env serial
        const get = await invokeRouteSkill({
          skill: 'route.reminder.get',
          args: {},
          cwd: scene.tempDir,
          env,
        });
        return { drive, get };
      });

      then('the drive exits clean and the daemon stays live on the route', () => {
        expect(res.drive.code).toEqual(0);
        expect(isPidAlive(scene.sleeperPid)).toBe(true);
        expect(res.get.stdout).toContain('reminder is live — daemon pid');
        expect(res.get.stdout).toContain('focus .behavior/route-a');
      });
    });

    when('[t1] the route halts, and the clone drives it again', () => {
      const res = useThen('block the passage, drive, then get', async () => {
        await execAsync(
          `printf '%s\\n' '{"stone":"1.vision","status":"blocked"}' >> .behavior/route-a/.route/passage.jsonl`,
          { cwd: scene.tempDir },
        );
        const drive = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.behavior/route-a' },
          cwd: scene.tempDir,
          env,
        });
        await awaitPidDead(scene.sleeperPid);
        const get = await invokeRouteSkill({
          skill: 'route.reminder.get',
          args: {},
          cwd: scene.tempDir,
          env,
        });
        return { drive, get };
      });

      then('the drive reaps the daemon', () => {
        expect(isPidAlive(scene.sleeperPid)).toBe(false);
      });

      then('get names the focus route and its halt', () => {
        expect(res.get.code).toEqual(0);
        expect(res.get.stdout).toContain('reminder is not live');
        expect(res.get.stdout).toContain('.behavior/route-a is not a live drive');
        expect(res.get.stdout).toContain('status blocked');
        expect(scrubReminderStdout(res.get.stdout)).toMatchSnapshot();
      });
    });
  });

  // the upgrade journey, through the real skill: a clone still holds a handle from the old
  // per-route layout. del reaps the live legacy daemon and keeps the torn one, and says which
  given('[case21] a clone that holds legacy per-route handles', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-legacy',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      const legacyName = `${HANDLE_STEM}.pid`;
      const legacyLive = path.join('.behavior', 'v1.old', '.route', legacyName);
      const legacyTorn = path.join('.behavior', 'v1.torn', '.route', legacyName);
      for (const legacy of [legacyLive, legacyTorn])
        await fs.mkdir(path.join(tempDir, path.dirname(legacy)), {
          recursive: true,
        });
      const sleeperPid = spawnRealSleeper();
      await fs.writeFile(path.join(tempDir, legacyLive), String(sleeperPid));
      await fs.writeFile(path.join(tempDir, legacyTorn), '123abc');
      return { tempDir, sleeperPid, legacyLive, legacyTorn };
    });

    when('[t0] route.reminder.del runs via the real skill wrapper', () => {
      const res = useThen('invoke del over the legacy handles', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.del',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it exits clean', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('it reaps the live legacy daemon, and the daemon is dead', async () => {
        expect(res.cli.stdout).toContain('RouteReminder legacy daemon reaped');
        await awaitPidDead(scene.sleeperPid);
        expect(isPidAlive(scene.sleeperPid)).toBe(false);
      });

      then('it keeps the torn legacy handle and names the fix', async () => {
        expect(res.cli.stdout).toContain('RouteReminder legacy handle kept');
        expect(res.cli.stdout).toContain('the pid file is torn');
        expect(
          await fs.readFile(path.join(scene.tempDir, scene.legacyTorn), 'utf8'),
        ).toEqual('123abc');
      });

      then('the del stdout matches its shell snapshot', () => {
        expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  // gen with no --route, through the real skill: with no bind it refuses and names both fixes; once
  // a route is bound to the branch, gen falls back to it. the bogus clone addr makes the spawned
  // daemon exit session-dead on its first tick, and del reaps whatever remains
  given('[case22] gen with no --route', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-gen-bound',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      // bind rejects protected branches like main
      await execAsync('git checkout -b vlad/test-reminder-bound', {
        cwd: tempDir,
      });
      await execAsync(
        `mkdir -p .behavior/route-a/.route && cp ./*.stone .behavior/route-a/ && printf '%s\\n' '{"stone":"1.vision","status":"passed"}' > .behavior/route-a/.route/passage.jsonl`,
        { cwd: tempDir },
      );
      return { tempDir };
    });

    when('[t0] no route is bound to the branch', () => {
      const res = useThen('invoke gen with no --route', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.gen',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it exits 2 and names --route and the bind as fixes', () => {
        expect(res.cli.code).toEqual(2);
        expect(res.cli.stderr).toContain('✋ ConstraintError:');
        expect(res.cli.stderr).toContain('--route');
        expect(res.cli.stderr).toContain('rhx route.bind.set');
        expect(scrubReminderStdout(res.cli.stderr)).toMatchSnapshot();
      });
    });

    when('[t1] a route is bound to the branch', () => {
      const res = useThen('bind, invoke gen with no --route, then del', async () => {
        await invokeRouteSkill({
          skill: 'route.bind.set',
          args: { route: '.behavior/route-a' },
          cwd: scene.tempDir,
        });
        const gen = await invokeRouteSkill({
          skill: 'route.reminder.gen',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        });
        const focus = await fs.readFile(
          path.join(scene.tempDir, HANDLE_DIR, `${HANDLE_STEM}.focus`),
          'utf8',
        );
        const del = await invokeRouteSkill({
          skill: 'route.reminder.del',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        });
        return { gen, focus, del };
      });

      then('gen spawns a daemon focused on the bound route', () => {
        expect(res.gen.code).toEqual(0);
        expect(res.gen.stdout).toMatch(/pid \d+/);
        expect(res.focus).toContain('route-a');
        expect(scrubReminderStdout(res.gen.stdout)).toMatchSnapshot();
      });

      then('the spawned daemon is dead after del', async () => {
        expect(res.del.code).toEqual(0);
        const pid = asPidFromStdout(res.gen.stdout);
        await awaitPidDead(pid);
        expect(isPidAlive(pid)).toBe(false);
      });
    });
  });

  // gen on a live route, through the real skill and the real detached spawn: the positive gen
  // path a human runs by hand. the bogus clone addr makes the daemon exit session-dead on its first
  // tick, and del reaps whatever remains, so no process outlives the case
  given('[case18] a fresh live route — gen through the real skill spawns one', () => {
    when('[t0] route.reminder.gen runs the real register path', () => {
      const res = useThen('invoke gen, then del', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'reminder-gen-live',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync(
          `mkdir -p .route && printf '%s\\n' '{"stone":"1.vision","status":"passed"}' > .route/passage.jsonl`,
          { cwd: tempDir },
        );
        const gen = await invokeRouteSkill({
          skill: 'route.reminder.gen',
          args: { route: '.', 'clone-addr': '@:driver-1' },
          cwd: tempDir,
        });
        const del = await invokeRouteSkill({
          skill: 'route.reminder.del',
          args: { 'clone-addr': '@:driver-1' },
          cwd: tempDir,
        });
        return { gen, del };
      });

      then('gen exits clean and reports a real spawned pid', () => {
        expect(res.gen.code).toEqual(0);
        expect(res.gen.stdout).toMatch(/pid \d+/);
      });

      then('the gen stdout matches its shell snapshot', () => {
        expect(scrubReminderStdout(res.gen.stdout)).toMatchSnapshot();
      });

      then('the spawned daemon is dead after del', async () => {
        expect(res.del.code).toEqual(0);
        const pid = asPidFromStdout(res.gen.stdout);
        await awaitPidDead(pid);
        expect(isPidAlive(pid)).toBe(false);
      });
    });
  });

  // a torn clone handle (a body that is not a pid), through the real skills: get refuses and names
  // del as the fix; del clears it and says so; get then reads a clean not-live state
  given('[case19] a clone whose pid handle is torn', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-torn',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      await writeCloneHandle({ tempDir, ext: 'pid', content: '12x' });
      return { tempDir };
    });

    when('[t0] route.reminder.get runs via the real skill wrapper', () => {
      const res = useThen('invoke get over the torn handle', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.get',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it exits 2 and names del as the fix', () => {
        expect(res.cli.code).toEqual(2);
        expect(res.cli.stderr).toContain(
          '✋ ConstraintError: the reminder handle is torn',
        );
        expect(res.cli.stderr).toContain('rhx route.reminder.del');
        expect(scrubReminderStdout(res.cli.stderr)).toMatchSnapshot();
      });
    });

    when('[t1] route.reminder.del runs via the real skill wrapper', () => {
      const res = useThen('invoke del over the torn handle', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.del',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it clears the torn handle and says so', () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).toContain('reminder handle was torn');
        expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] route.reminder.get runs after the del', () => {
      const res = useThen('invoke get after the clear', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.get',
          args: { 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it reads a clean not-live state', () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).toContain('reminder is not live');
        expect(scrubReminderStdout(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  // a fault the system must fix renders through the real skill as a malfunction: a
  // `💥 MalfunctionError:` header, exit 1. a FILE where the clone home must go makes the focus
  // write fault (ENOTDIR) — a gen on a live route then fails loud and spawns none
  given('[case16] a live route whose clone home cannot be made', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'reminder-malfunction',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      // `.agent/.cache` holds other caches after the link; block only this package's branch of it
      const blocker = path.join(tempDir, '.agent', '.cache', 'repo=bhrain');
      await fs.rm(blocker, { recursive: true, force: true });
      await fs.mkdir(path.dirname(blocker), { recursive: true });
      await fs.writeFile(blocker, 'not a dir');
      return { tempDir };
    });

    when('[t0] route.reminder.gen runs via the real skill wrapper', () => {
      const res = useThen('invoke gen over the blocked clone home', async () => ({
        cli: await invokeRouteSkill({
          skill: 'route.reminder.gen',
          args: { route: '.', 'clone-addr': '@:driver-1' },
          cwd: scene.tempDir,
        }),
      }));

      then('it exits 1 behind a MalfunctionError header', () => {
        expect(res.cli.code).toEqual(1);
        expect(res.cli.stderr).toContain('💥 MalfunctionError:');
        expect(res.cli.stdout).not.toContain('reminder registered');
      });

      then('the malfunction frame matches the shell snapshot a human reads', () => {
        // the stack frames carry host paths and line numbers; pin the frame's shape, not its frames
        const stderr = scrubReminderStdout(res.cli.stderr);
        expect(stderr).toContain('└─ stack');
        expect(
          stderr.replace(/└─ stack[\s\S]*$/, '└─ stack <frames>\n'),
        ).toMatchSnapshot();
      });
    });
  });
});

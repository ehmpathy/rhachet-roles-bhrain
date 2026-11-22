import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { genRouteWithPassage } from '@src/domain.operations/route/.test/genRouteWithPassage';
import { bumpRouteReminderCrashBreaker } from '@src/domain.operations/route/reminder/bumpRouteReminderCrashBreaker';
import { getRouteReminderFocus } from '@src/domain.operations/route/reminder/getRouteReminderFocus';
import { getRouteReminderLogPath } from '@src/domain.operations/route/reminder/getRouteReminderLogPath';
import { getRouteReminderPidPath } from '@src/domain.operations/route/reminder/getRouteReminderPidPath';
import { isProcessAlive } from '@src/domain.operations/route/reminder/isProcessAlive';
import { MAX_ROUTE_REMINDER_CRASHES } from '@src/domain.operations/route/reminder/MAX_ROUTE_REMINDER_CRASHES';
import { readRouteReminderRawPid } from '@src/domain.operations/route/reminder/readRouteReminderRawPid';
import { setRouteReminderFocus } from '@src/domain.operations/route/reminder/setRouteReminderFocus';
import { stopProcess } from '@src/domain.operations/route/reminder/stopProcess';

import {
  routeReminderDaemon,
  routeReminderDel,
  routeReminderGen,
  routeReminderGet,
} from './route.reminder';

/**
 * .what = drives the route.reminder cli surface end to end, deterministically (no live clone)
 * .why = the wish's headline ask is "manage the reminder via shell". this proves the shell surface
 *        works: the daemon entrypoint self-exits + logs its exit reason (observability), and detect
 *        reports liveness. a BLOCKED route lets the daemon exit on tick 1 BEFORE it reaches a clone,
 *        so the whole arc is deterministic in-sandbox — the reached:true nudge remains the vision's
 *        must-validate (a real LIVE clone), honestly out of a sandbox's reach.
 */

// runs an entrypoint against a fake argv, then returns the lines it `say`s — a REAL
// array-collector function injected through each command's own declared `say` context seam,
// never a reassignment of the console.log global (rule.forbid.integration.mocks). `run` accepts
// that collector so the caller can hand it straight to routeReminder{Daemon,Gen,Get,Del}({ say }).
const withCapturedStdout = async (
  argv: string[],
  run: (say: (line: string) => void) => Promise<void>,
): Promise<string[]> => {
  const lines: string[] = [];
  const argvBefore = process.argv;
  // jest argv[1] is a .js path, so getInvocationArgs slices from index 2 — put flags there
  process.argv = [
    process.argv[0] ?? 'node',
    process.argv[1] ?? 'jest',
    ...argv,
  ];
  try {
    await run((line) => lines.push(line));
  } finally {
    process.argv = argvBefore;
  }
  return lines;
};

// runs an entrypoint with process.argv set to EXACTLY the given array — used to simulate the raw
// argv node hands the spawned daemon for `node -e "code" -- <flags>`, so the getInvocationArgs
// slice + parseArgs recovery is proven against the real end-of-options shapes (not a jest-shaped
// argv). returns the `say`d lines the same real-collector way as withCapturedStdout.
const withRawArgv = async (
  rawArgv: string[],
  run: (say: (line: string) => void) => Promise<void>,
): Promise<string[]> => {
  const lines: string[] = [];
  const argvBefore = process.argv;
  process.argv = rawArgv;
  try {
    await run((line) => lines.push(line));
  } finally {
    process.argv = argvBefore;
  }
  return lines;
};

// writes a clone handle file, with its dir. a temp route sits in no git repo, so it is its own
// anchor: the clone home sits under the route dir itself (getRouteReminderRepoRoot)
const writeCloneHandleFile = async (filePath: string, content: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
};

// a real, harmless background process (a long sleep) that stands in for a live daemon. the two
// steady-state CLI messages a human sees most — the findsert-hit ("already live") and the
// deregister-success ("stopped, handle cleared") — need a genuinely live pid to exercise, since
// getRouteReminder / delRouteReminder probe real liveness (kill -0), never a mock.
const spawnedPids: number[] = [];
const genSleeperProcess = (): { pid: number } => {
  // cwd = repo root (jest runs from there) — a subprocess must not inherit a cwd outside the git
  // root (rule.forbid.cwd-outside-gitroot); harmless for `sleep`, kept for rule conformance.
  const child = spawn('sleep', ['300'], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
  });
  child.unref();
  if (!child.pid) throw new Error('failed to spawn sleeper');
  spawnedPids.push(child.pid);
  return { pid: child.pid };
};

// deterministic poll until a pid is truly reaped — NOT a fixed-duration guess
// (rule.forbid.time-assumptions). bounded + const-only so it cannot loop forever. isProcessAlive
// allowlists ONLY ESRCH as "dead" and surfaces any other errno, so a not-actually-dead pid can
// never end the wait early (rule.forbid.failhide).
const awaitPidDead = async (pid: number, triesLeft = 100): Promise<void> => {
  if (!isProcessAlive({ pid })) return;
  if (triesLeft <= 0) throw new Error(`pid ${pid} still alive after wait`);
  await new Promise((done) => setTimeout(done, 10));
  return awaitPidDead(pid, triesLeft - 1);
};

describe('route.reminder.cli.integration', () => {
  // reap every sleeper we spawned, so no test process lingers. stopProcess allowlists ONLY ESRCH
  // (already gone) and surfaces any other errno — a leaked-but-unkillable sleeper is a real fault,
  // never swallowed (rule.forbid.failhide).
  afterAll(() => {
    for (const pid of spawnedPids) stopProcess({ pid, signal: 'SIGKILL' });
  });

  // getRouteArg/getCloneAddrArg auto-derive --route/--clone-addr from the ambient bind + env; guard
  // RHACHET_CLONE_SERIAL so one case's set/clear never leaks into another case.
  const priorSerial = process.env.RHACHET_CLONE_SERIAL;
  afterEach(() => {
    if (priorSerial === undefined) delete process.env.RHACHET_CLONE_SERIAL;
    else process.env.RHACHET_CLONE_SERIAL = priorSerial;
  });

  given(
    '[case1] a clone focused on a blocked route (the daemon must self-exit at once)',
    () => {
      const scene = useBeforeAll(async () => {
        const built = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
          ],
        });
        await setRouteReminderFocus({
          repoRoot: built.route,
          cloneAddr: '@:driver-1',
          route: built.route,
        });
        return built;
      });

      when('[t0] the daemon entrypoint runs for the clone', () => {
        then(
          'it logs its exit reason and focus — route-not-live, tick 1 (observability)',
          async () => {
            const lines = await withCapturedStdout(
              [
                '--repo-root',
                scene.route,
                '--clone-addr',
                '@:driver-1',
                // 1000 = the min sane floor; the daemon self-exits on tick 1 for a
                // not-live route, so the cadence never fires — the value is moot here
                '--interval-ms',
                '1000',
              ],
              (say) => routeReminderDaemon({ say }),
            );
            const line = lines.find((l) =>
              l.includes('route.reminder.daemon exited'),
            );
            expect(line).toBeDefined();
            expect(line).toContain('reason=route-not-live');
            expect(line).toContain('ticks=1');
            // the route is the repo root, so its focus label is `.` — the form get prints
            expect(line).toContain('focus=. ');
            // snapshot the exact observability format (the one place a human learns WHY a reminder
            // went quiet), with the dynamic tmp route scrubbed so the shape pins deterministically
            // (rule.require.snapshots).
            expect(
              (line ?? '').split(scene.route).join('<route>'),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case2] a route with no reminder set', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] detect runs for an unset session', () => {
      then(
        'it reports NOT live AND names the never-registered case',
        async () => {
          const lines = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.route }),
          );
          const out = lines.join('\n');
          expect(out).toContain('reminder is not live');
          // this session left NO daemon log, so get must discriminate to the NEVER-registered message
          // (start one), NOT the went-quiet message (read the log). the distinct phrase makes a
          // regression to one undifferentiated string go red (rule.require.status-feedback).
          expect(out).toContain('no daemon is registered');
          // the line names the anchor it read, so a human in the wrong worktree sees where it looked
          expect(out).toContain(`under ${scene.route}`);
          // snapshot the exact human-read bytes so a reviewer sees the shell experience and any drift
          // in the message surfaces (rule.require.snapshots). the anchor is a tmp path, so it is masked
          expect(out.split(scene.route).join('<route>')).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[case3] a detect call that lacks --clone-addr, outside an enrolled session',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        }),
      );

      when('[t0] detect runs with no --clone-addr', () => {
        then('it fails loud with an error that names the fix', async () => {
          // no RHACHET_CLONE_SERIAL to auto-derive from — the required-arg floor still holds
          delete process.env.RHACHET_CLONE_SERIAL;
          const error = await getError(
            withCapturedStdout([], (say) =>
              routeReminderGet({ say, cwd: scene.route }),
            ),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('--clone-addr is required');
          // snapshot the exact constraint-error bytes (message + the fix it names), so any drift in
          // the human's error surfaces in review, not just the matched fragment (rule.require.snapshots).
          expect(error.message).toMatchSnapshot();
        });
      });
    },
  );

  given('[case15] a detect call whose --clone-addr drops the @: sigil', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] detect runs with a bare serial, no @: prefix', () => {
      then(
        'it fails loud and names the @: fix — never a silent accept',
        async () => {
          const error = await getError(
            withCapturedStdout(['--clone-addr', 'driver-1'], (say) =>
              routeReminderGet({ say, cwd: scene.route }),
            ),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain("did you mean '@:driver-1'?");
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  // the spawned daemon parses the raw argv node hands `node -e "code" -- <flags>`. node's treatment
  // of the `--` end-of-options marker has two possible shapes, and the getInvocationArgs slice must
  // recover --repo-root from BOTH — else the daemon dies at startup with "--repo-root is required"
  // while route.reminder.gen reported "spawned" (the r8 silent-feature-killer). this clamps that seam
  // deterministically, without a built dist: it drives the real daemon entrypoint through the exact
  // argv shapes and asserts it recovers the flags (self-exits route-not-live, never "required").
  given(
    '[case4] the two argv shapes node produces for `node -e ... -- <flags>`',
    () => {
      const scene = useBeforeAll(async () => {
        const built = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
          ],
        });
        await setRouteReminderFocus({
          repoRoot: built.route,
          cloneAddr: '@:driver-1',
          route: built.route,
        });
        return built;
      });

      when(
        '[t0] node CONSUMES the -- marker (argv[1] is the first flag)',
        () => {
          then(
            'the daemon recovers --repo-root and self-exits route-not-live',
            async () => {
              const lines = await withRawArgv(
                [
                  '/usr/bin/node',
                  '--repo-root',
                  scene.route,
                  '--clone-addr',
                  '@:driver-1',
                  // 1000 = the min sane floor; the daemon self-exits on tick 1 for a
                  // not-live route, so the cadence never fires — the value is moot here
                  '--interval-ms',
                  '1000',
                ],
                (say) => routeReminderDaemon({ say }),
              );
              const line = lines.find((l) =>
                l.includes('route.reminder.daemon exited'),
              );
              expect(line).toBeDefined();
              expect(line).toContain('reason=route-not-live');
            },
          );
        },
      );

      when('[t1] node KEEPS the -- marker (argv[1] is `--`)', () => {
        then(
          'the daemon still recovers --repo-root and self-exits route-not-live',
          async () => {
            const lines = await withRawArgv(
              [
                '/usr/bin/node',
                '--',
                '--repo-root',
                scene.route,
                '--clone-addr',
                '@:driver-1',
                // 1000 = the min sane floor; the daemon self-exits on tick 1 for a
                // not-live route, so the cadence never fires — the value is moot here
                '--interval-ms',
                '1000',
              ],
              (say) => routeReminderDaemon({ say }),
            );
            const line = lines.find((l) =>
              l.includes('route.reminder.daemon exited'),
            );
            expect(line).toBeDefined();
            expect(line).toContain('reason=route-not-live');
          },
        );
      });
    },
  );

  // the wish's headline on/off commands — gen (register) and del (deregister) — driven through the
  // real CLI wrapper, so their arg parse + the stdout a human reads are proven at the shell boundary.
  // gen injects a FAKE spawn (the one genuinely external OS boundary) whose returned pid is a REAL
  // live sleeper, so the real kill -0 probe (isProcessAlive, imported not injected —
  // rule.forbid.inject-same-repo-domain-ops) reads it as alive without a mocked leaf. the pid is
  // dynamic, so the snapshot scrubs it to pin the message shape (rule.require.snapshots).
  given(
    '[case5] a fresh route + a fake spawn whose daemon is a REAL live pid',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        }),
      );

      when('[t0] gen registers the reminder', () => {
        then(
          'it reports the daemon spawned and live, with the pid and the focus',
          async () => {
            const lines = await withCapturedStdout(
              ['--route', scene.route, '--clone-addr', '@:driver-1'],
              (say) =>
                routeReminderGen({
                  say,
                  // a REAL live sleeper pid → the direct kill -0 probe reads it alive, no mock
                  spawnDaemon: async () => genSleeperProcess(),
                }),
            );
            const out = lines.join('\n');
            expect(out).toContain('spawned and live');
            expect(out).toMatch(/pid \d+/);
            expect(out).toMatch(/, focus \S+$/);
            expect(out.replace(/pid \d+/g, 'pid <pid>')).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case6] a fresh route + a fake spawn whose daemon is DEAD on arrival',
    () => {
      const scene = useBeforeAll(async () => {
        const built = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        });
        // the fake spawnDaemon below returns a pid but never opens a log (only the REAL
        // spawnRouteReminderDaemon does). write a log here to represent the trace a real dead-on-arrival
        // daemon leaves behind, so the t1 get reads the went-quiet (registered-then-died) branch, not
        // the never-registered one — the state this case is ABOUT.
        await writeCloneHandleFile(
          getRouteReminderLogPath({
            repoRoot: built.route,
            cloneAddr: '@:driver-1',
          }),
          'route.reminder.daemon exited reason=route-not-live\n',
        );
        return built;
      });

      when('[t0] gen registers onto a daemon that exited at once', () => {
        then(
          'it reports the dead-on-arrival truth, never a phantom "spawned" success',
          async () => {
            // a REAL but already-dead pid: spawn a sleeper, kill it, await its reap, then hand gen
            // that pid — the direct kill -0 probe reads it dead (no mocked leaf). this is the
            // reviewer's "controlled fake pid, real kill -0" for the dead-on-arrival branch.
            const dead = genSleeperProcess();
            stopProcess({ pid: dead.pid, signal: 'SIGKILL' });
            await awaitPidDead(dead.pid);
            const lines = await withCapturedStdout(
              ['--route', scene.route, '--clone-addr', '@:driver-1'],
              (say) =>
                routeReminderGen({
                  say,
                  spawnDaemon: async () => ({ pid: dead.pid }),
                }),
            );
            const out = lines.join('\n');
            expect(out).toContain('exited on arrival');
            // scrub the pid AND the dynamic tmp route (the daemon-log path names it) so the
            // message shape a human reads pins deterministically (rule.require.snapshots)
            expect(
              out
                .replace(/pid \d+/g, 'pid <pid>')
                .split(scene.route)
                .join('<route>'),
            ).toMatchSnapshot();
          },
        );
      });

      when('[t1] the dead-on-arrival handle was reconciled', () => {
        then(
          'a later get reports NOT live AND the went-quiet case',
          async () => {
            const lines = await withCapturedStdout(
              ['--clone-addr', '@:driver-1'],
              (say) => routeReminderGet({ say, cwd: scene.route }),
            );
            const out = lines.join('\n');
            expect(out).toContain('reminder is not live');
            // a daemon WAS registered (the log persists past the reconcile that reaped the pid handle),
            // so get must discriminate to the went-quiet message with its log-path hint — NOT the
            // never-registered message. the distinct phrase makes a regression to one message go red.
            expect(out).toContain('a daemon was registered but has gone quiet');
            // snapshot-pin the EXACT went-quiet text (incl. its log-path hint), so a future edit that
            // drops the diagnostic hint on THIS path goes red (rule.require.snapshots). scrub the
            // dynamic tmp route the log path names.
            expect(out.split(scene.route).join('<route>')).toMatchSnapshot();
          },
        );
      });
    },
  );

  // the orphan clamp at gen: a daemon spawned on a route that is not a live drive would exit on its
  // first tick, and until then it would hold the clone's one slot. the old gen spawned it, then
  // dropped its handle at once, so a drive of a live route in that window saw no handle and
  // spawned a second daemon beside it. gen now spawns none on a dead route. RED under the
  // spawn-then-drop gen (the spawn is called), GREEN under the activity gate.
  given('[case11] gen on a blocked (not-active) route, no daemon live', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      }),
    );

    when('[t0] gen registers onto the blocked route', () => {
      const result = useBeforeAll(async () => {
        const spawns: number[] = [];
        const lines = await withCapturedStdout(
          ['--route', scene.route, '--clone-addr', '@:driver-1'],
          (say) =>
            routeReminderGen({
              say,
              spawnDaemon: async () => {
                spawns.push(1);
                return genSleeperProcess();
              },
            }),
        );
        return { out: lines.join('\n'), spawns };
      });

      then('it spawns no daemon', () => {
        expect(result.spawns).toHaveLength(0);
      });

      then('it leaves no handle in the clone slot', async () => {
        const found = await readRouteReminderRawPid({
          repoRoot: scene.route,
          cloneAddr: '@:driver-1',
        });
        expect(found).toBeNull();
      });

      then('it moves the focus to the route', async () => {
        const focus = await getRouteReminderFocus({
          repoRoot: scene.route,
          cloneAddr: '@:driver-1',
        });
        expect(focus?.route).toEqual(scene.route);
      });

      then('it names the halt with its status, and the way back', () => {
        expect(result.out).toContain('reminder not spawned');
        expect(result.out).toContain('route-not-live, status blocked');
        expect(result.out).toContain(
          'the next route.drive of a live route registers it',
        );
        expect(result.out).toMatchSnapshot();
      });
    });
  });

  // the clamp for the `--flag=value` failhide: `--interval-ms=5000` MUST parse to 5000, never
  // silently fall to the 20m default (the exact silent-degrade a reviewer flagged). the injected
  // spawnDaemon records the intervalMs it was handed, so the assertion proves the `=` idiom reached
  // genRouteReminder intact. RED under the old `--flag value`-only parser (records the default),
  // GREEN under the `--key=value` split. the route is live, so gen reaches the spawn; the injected
  // spawn hands back a sleeper, so no real daemon runs.
  given('[case12] gen with the --interval-ms=<value> (equals) idiom', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] gen runs with --interval-ms=5000', () => {
      then(
        'the parsed 5000 reaches spawn — never the silent 20m default',
        async () => {
          const seen: { intervalMs: number | null } = { intervalMs: null };
          await withCapturedStdout(
            [
              '--route',
              scene.route,
              '--clone-addr',
              '@:driver-1',
              '--interval-ms=5000',
            ],
            (say) =>
              routeReminderGen({
                say,
                spawnDaemon: async (i) => {
                  seen.intervalMs = i.intervalMs;
                  return genSleeperProcess();
                },
              }),
          );
          // the `=` idiom parsed to 5000 — not the 20m (1200000) default a silent misparse would yield
          expect(seen.intervalMs).toBe(5000);
        },
      );
    });
  });

  given('[case7] a fresh route with no reminder set', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] del runs for an unset session (idempotent no-op)', () => {
      then('it reports the reminder was not live', async () => {
        const lines = await withCapturedStdout(
          ['--clone-addr', '@:driver-1'],
          (say) => routeReminderDel({ say, cwd: scene.route }),
        );
        expect(lines.join('\n')).toContain('reminder was not live');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  // the findsert-hit steady-state message — "already live, no duplicate" — is the one a human sees
  // on every re-register of an active session. a real live pid is claimed for the handle first, so
  // gen's fast path (getRouteReminder, real kill -0) finds it and returns WITHOUT a spawn.
  given('[case8] a session whose handle already names a live daemon', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      // stand up a real live pid and claim the handle for it — the findsert precondition
      const { pid } = genSleeperProcess();
      await writeCloneHandleFile(
        getRouteReminderPidPath({ repoRoot: route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      return { route, pid };
    });

    when(
      '[t0] gen runs against the already-live session (findsert hit)',
      () => {
        then(
          'it reports the daemon already live and spawns no duplicate',
          async () => {
            const lines = await withCapturedStdout(
              ['--route', scene.route, '--clone-addr', '@:driver-1'],
              (say) =>
                routeReminderGen({
                  say,
                  spawnDaemon: async () => {
                    throw new Error(
                      'findsert must not spawn when a daemon is live',
                    );
                  },
                }),
            );
            expect(lines.join('\n')).toContain('already live');
            expect(lines.join('\n')).toContain('no duplicate spawned');
            // scrub the real sleeper pid so the findsert-hit line a human reads snaps
            // deterministically (rule.require.snapshots).
            expect(
              lines.join('\n').replace(String(scene.pid), '<pid>'),
            ).toMatchSnapshot();
          },
        );
      },
    );
  });

  // the deregister-success steady-state message — "live daemon stopped, handle cleared" — is the
  // other message a human sees most. a real live daemon (a sleeper) is claimed for the handle, then
  // del stops it for real; the pid's reap is proven by a deterministic poll, not a fixed sleep.
  given('[case9] a session whose handle names a genuinely live daemon', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      const { pid } = genSleeperProcess();
      await writeCloneHandleFile(
        getRouteReminderPidPath({ repoRoot: route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      return { route, pid };
    });

    when('[t0] del runs against the live daemon', () => {
      then(
        'it stops the live daemon, clears the handle, and reaps the pid',
        async () => {
          const lines = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderDel({ say, cwd: scene.route }),
          );
          expect(lines.join('\n')).toContain('deregistered');
          expect(lines.join('\n')).toContain('handle cleared');
          // the deregister-success line carries no dynamic pid, so it snaps clean.
          expect(lines.join('\n')).toMatchSnapshot();
          // and the real daemon was truly reaped — a deterministic poll of the real condition,
          // never a fixed-duration guess (rule.forbid.time-assumptions).
          await awaitPidDead(scene.pid);
          expect(isProcessAlive({ pid: scene.pid })).toBe(false);
        },
      );
    });
  });

  // the DETECT live-branch — "reminder is live — daemon pid N" — is the everyday "is it on?" read
  // the runbook points a human at (`## when to check it`). prior get cases only drove the "not
  // live" path; this closes the happy-path gap with a real live sleeper pid claimed for the handle,
  // so getRouteReminder's real kill -0 sees a genuinely live daemon (rule.require.status-feedback).
  given('[case10] a session whose handle names a genuinely live daemon', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      const { pid } = genSleeperProcess();
      await writeCloneHandleFile(
        getRouteReminderPidPath({ repoRoot: route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      await setRouteReminderFocus({
        repoRoot: route,
        cloneAddr: '@:driver-1',
        route,
      });
      return { route, pid };
    });

    when('[t0] get runs against the live session', () => {
      then(
        'it reports the reminder is live, with the pid and focus',
        async () => {
          const lines = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.route }),
          );
          expect(lines.join('\n')).toContain('reminder is live — daemon pid');
          expect(lines.join('\n')).toContain(`daemon pid ${scene.pid}`);
          expect(lines.join('\n')).toContain('focus .');
          // scrub the real sleeper pid so the live-branch line a human reads snaps deterministically
          // (rule.require.snapshots).
          expect(
            lines.join('\n').replace(String(scene.pid), '<pid>'),
          ).toMatchSnapshot();
        },
      );
    });
  });

  // a live daemon with no focus has no route to nudge about: its next tick exits. get must say so,
  // never print a plain "live" with a `(none)` focus (rule.forbid.surprises)
  given('[case27] a live daemon whose clone has no focus', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      const { pid } = genSleeperProcess();
      await writeCloneHandleFile(
        getRouteReminderPidPath({ repoRoot: route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      return { route, pid };
    });

    when('[t0] get runs for the clone', () => {
      then(
        'it reads live for now, and names the exit and the fix',
        async () => {
          const lines = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.route }),
          );
          const out = lines.join('\n');
          expect(out).toContain('reminder is live for now');
          expect(out).toContain('has no focus route');
          expect(out).toContain('route.reminder.gen --route');
          expect(out.replace(String(scene.pid), '<pid>')).toMatchSnapshot();
        },
      );
    });
  });

  // the DETECT circuit-broken branch (r10 i036): when the auto-respawn breaker has TRIPPED (a
  // systematically-broken spawn), `get` must NOT collapse the trip into the generic "gone quiet"
  // message — a wait-it-out will not revive it. it must name the DISTINCT state and the actual fix
  // (repair the spawn, re-arm with gen). this seeds a tripped breaker (no live daemon, count past the
  // cutoff) via the real bump writer and asserts get reports the circuit-broken state + the re-arm
  // command. RED if get read only live-pid + log presence (the pre-fix behavior).
  given('[case13] a session whose auto-respawn breaker has tripped', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      // trip the breaker: bump past the cutoff (no pid handle → get reads NOT live first)
      for (let i = 0; i < MAX_ROUTE_REMINDER_CRASHES + 1; i += 1)
        await bumpRouteReminderCrashBreaker({
          repoRoot: route,
          cloneAddr: '@:driver-1',
        });
      return { route };
    });

    when('[t0] get runs against the circuit-broken session', () => {
      then(
        'it reports the circuit-broken state and names the re-arm fix',
        async () => {
          const lines = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.route }),
          );
          const out = lines.join('\n');
          expect(out).toContain('reminder is not live');
          expect(out).toContain('circuit-broken');
          // it names the actual next move — re-arm with gen — NOT the generic went-quiet hint
          expect(out).toContain('route.reminder.gen');
          expect(out).not.toContain(
            'a daemon was registered but has gone quiet',
          );
          // snapshot the exact human-read bytes; scrub the dynamic tmp route the crash-history path names
          expect(out.split(scene.route).join('<route>')).toMatchSnapshot();
        },
      );
    });
  });

  // the DELIBERATE-teardown misattribution clamp (r10 i037): a human who turns the reminder OFF on
  // purpose (del of a live daemon) must NOT be told on the next `get` that it crashed. the daemon's
  // per-session log persists past a self-exit by design, so before the fix a deliberate del left the
  // log behind and `get` read "gone quiet (self-exited or crashed)" — a false crash report. del now
  // clears the log + breaker on a deliberate teardown, so `get` reads the accurate "not registered".
  // RED before the del-clears-log fix (get says "gone quiet"), GREEN after.
  given('[case14] a live daemon with a log, then a deliberate del', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      const { pid } = genSleeperProcess();
      await writeCloneHandleFile(
        getRouteReminderPidPath({ repoRoot: route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      // the trace a registered daemon leaves — the very log that, left behind, would make a later
      // get misreport the deliberate stop as a crash
      await writeCloneHandleFile(
        getRouteReminderLogPath({ repoRoot: route, cloneAddr: '@:driver-1' }),
        'route.reminder.daemon tick=1\n',
      );
      // the focus the register wrote; del keeps it, so get can name the route the clone drove
      await setRouteReminderFocus({
        repoRoot: route,
        cloneAddr: '@:driver-1',
        route,
      });
      return { route, pid };
    });

    when('[t0] del deregisters the live daemon on purpose', () => {
      then('it reports the deliberate deregister', async () => {
        const lines = await withCapturedStdout(
          ['--clone-addr', '@:driver-1'],
          (say) => routeReminderDel({ say, cwd: scene.route }),
        );
        const out = lines.join('\n');
        expect(out).toContain('deregistered');
        expect(
          out
            .replace(/pid \d+/g, 'pid <pid>')
            .split(scene.route)
            .join('<route>'),
        ).toMatchSnapshot();
        await awaitPidDead(scene.pid);
      });

      when('[t1] a later get reads the deliberately-stopped session', () => {
        then(
          'it reports NOT registered — never a misattributed crash',
          async () => {
            const lines = await withCapturedStdout(
              ['--clone-addr', '@:driver-1'],
              (say) => routeReminderGet({ say, cwd: scene.route }),
            );
            const out = lines.join('\n');
            expect(out).toContain('reminder is not live');
            // a deliberate del cleared the log, so get reads the accurate never/not-registered
            // message — NOT the went-quiet crash misattribution.
            expect(out).toContain('no daemon is registered');
            expect(out).not.toContain(
              'a daemon was registered but has gone quiet',
            );
            // the kept focus proves a prior register: get names it and how it re-arms, never
            // the false "never registered"
            expect(out).not.toContain('ever registered');
            expect(out).toContain('its focus . is a live drive');
            expect(out).toMatchSnapshot();
          },
        );
      });
    });
  });

  // the auto-derive gap the wisher flagged live: --clone-addr should not need to be re-typed by a
  // session that already knows its own address. this proves getCloneAddrArg's fallback — the SAME
  // env getRouteDriverCloneAddr reads, the auto-wire's own source of truth.
  given(
    '[case16] a detect call that omits --clone-addr, inside an enrolled session',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        }),
      );

      when('[t0] detect runs with no flags, RHACHET_CLONE_SERIAL set', () => {
        then(
          'it derives the clone addr from the env — no --clone-addr needed',
          async () => {
            process.env.RHACHET_CLONE_SERIAL = 'auto-derive-1';
            const lines = await withCapturedStdout([], (say) =>
              routeReminderGet({ say, cwd: scene.route }),
            );
            const out = lines.join('\n');
            // the SAME message an explicit --clone-addr @:auto-derive-1 would produce — proof the
            // derived address reached the real getRouteReminder call, not a placeholder
            expect(out).toContain('reminder is not live');
            expect(out).toContain('no daemon is registered');
          },
        );
      });

      when(
        '[t1] an explicit --clone-addr is given alongside the same env',
        () => {
          then(
            'the explicit flag overrides the derived env value',
            async () => {
              process.env.RHACHET_CLONE_SERIAL = 'auto-derive-1';
              // register a daemon under the EXPLICIT address only
              const { pid } = genSleeperProcess();
              await writeCloneHandleFile(
                getRouteReminderPidPath({
                  repoRoot: scene.route,
                  cloneAddr: '@:explicit-2',
                }),
                String(pid),
              );
              const lines = await withCapturedStdout(
                ['--clone-addr', '@:explicit-2'],
                (say) => routeReminderGet({ say, cwd: scene.route }),
              );
              const out = lines.join('\n');
              // the explicit address's daemon is found live — proof the flag, not the env, was read
              expect(out).toContain('reminder is live');
              expect(out).toContain(String(pid));
            },
          );
        },
      );
    },
  );

  // the reminder is one per clone, so get and del read no route. a --route that was accepted and
  // ignored would let a human believe they read or stopped one route's own reminder; each verb
  // refuses it with a constraint error that names the fix
  given('[case17] a get or del call that passes --route or --repo-root', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] get runs with --route', () => {
      then('it refuses, and names the fix', async () => {
        const error = await getError(
          withCapturedStdout(
            ['--route', scene.route, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.route }),
          ),
        );
        expect(error.message).toContain('route.reminder.get takes no --route');
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] del runs with --route', () => {
      then('it refuses, and names the fix', async () => {
        const error = await getError(
          withCapturedStdout(
            ['--route', scene.route, '--clone-addr', '@:driver-1'],
            (say) => routeReminderDel({ say, cwd: scene.route }),
          ),
        );
        expect(error.message).toContain('route.reminder.del takes no --route');
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t2] get runs with --repo-root', () => {
      then('it refuses, and names the fix', async () => {
        const error = await getError(
          withCapturedStdout(
            ['--repo-root', scene.route, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.route }),
          ),
        );
        expect(error.message).toContain(
          'route.reminder.get takes no --repo-root',
        );
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t3] del runs with --repo-root', () => {
      then('it refuses, and names the fix', async () => {
        const error = await getError(
          withCapturedStdout(
            ['--repo-root', scene.route, '--clone-addr', '@:driver-1'],
            (say) => routeReminderDel({ say, cwd: scene.route }),
          ),
        );
        expect(error.message).toContain(
          'route.reminder.del takes no --repo-root',
        );
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case30] gen with a --route that is not a dir', () => {
    // a focus on an absent route reads "not live" forever; gen must refuse the typo, not accept it
    const scene = useBeforeAll(async () => {
      const built = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      return { ...built, absent: path.join(built.route, 'v9.typo') };
    });

    when('[t0] gen runs on the absent route', () => {
      const result = useBeforeAll(async () => {
        const spawns: number[] = [];
        const error = await getError(
          withCapturedStdout(
            ['--route', scene.absent, '--clone-addr', '@:driver-1'],
            (say) =>
              routeReminderGen({
                say,
                spawnDaemon: async () => {
                  spawns.push(1);
                  return genSleeperProcess();
                },
              }),
          ),
        );
        return { error, spawns };
      });

      then('it refuses with a constraint that names the path', () => {
        expect(result.error).toBeInstanceOf(BadRequestError);
        expect(result.error.message).toContain('is not a dir');
        expect(result.error.message).toContain(scene.absent);
        expect(
          result.error.message.split(scene.route).join('<route>'),
        ).toMatchSnapshot();
      });

      then('it spawns no daemon and writes no focus', async () => {
        expect(result.spawns).toHaveLength(0);
        expect(
          await getRouteReminderFocus({
            repoRoot: scene.route,
            cloneAddr: '@:driver-1',
          }),
        ).toBeNull();
      });
    });
  });

  // the daemon entrypoint's two edge faces: a clone with no focus (it exits at tick 1 and says so),
  // and a spawn that lacks its anchor (it refuses and names the flag)
  given('[case20] a daemon run with no focus, then with no --repo-root', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] the daemon runs for a clone that never had a focus', () => {
      then('it exits route-not-live and names the absent focus', async () => {
        const lines = await withCapturedStdout(
          [
            '--repo-root',
            scene.route,
            '--clone-addr',
            '@:driver-nofocus',
            '--interval-ms',
            '1000',
          ],
          (say) => routeReminderDaemon({ say }),
        );
        const line = lines.find((l) =>
          l.includes('route.reminder.daemon exited'),
        );
        expect(line).toContain('reason=route-not-live');
        expect(line).toContain('focus=(no focus)');
        expect(line).toMatchSnapshot();
      });
    });

    when('[t1] the daemon runs with no --repo-root', () => {
      then('it refuses, and names the flag', async () => {
        const error = await getError(
          withCapturedStdout(
            ['--clone-addr', '@:driver-nofocus', '--interval-ms', '1000'],
            (say) => routeReminderDaemon({ say }),
          ),
        );
        expect(error.message).toContain('--repo-root');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  // the shell face of one-per-clone: two gen calls on two live routes of one repo spawn ONE daemon,
  // and the second only moves its focus. get, run from the repo, names the focus route
  given(
    '[case18] one clone that gens route A, then route B, in one repo',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-cli-one-per-clone',
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

      when('[t0] gen runs for A, then for B', () => {
        const result = useBeforeAll(async () => {
          const spawns: number[] = [];
          const spawnDaemon = async () => {
            const sleeper = genSleeperProcess();
            spawns.push(sleeper.pid);
            return sleeper;
          };
          const linesA = await withCapturedStdout(
            ['--route', scene.routeA, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGen({ say, spawnDaemon }),
          );
          const linesB = await withCapturedStdout(
            ['--route', scene.routeB, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGen({ say, spawnDaemon }),
          );
          const linesGet = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.repoRoot }),
          );
          return { spawns, linesA, linesB, linesGet };
        });

        then('one daemon spawns, for the first gen only', () => {
          expect(result.spawns).toHaveLength(1);
          expect(result.linesA.join('\n')).toContain('spawned and live');
          expect(result.linesB.join('\n')).toContain('no duplicate spawned');
        });

        then('the second gen moves the focus to B', () => {
          expect(result.linesB.join('\n')).toContain(
            `focus ${path.relative(scene.repoRoot, scene.routeB)}`,
          );
          expect(
            result.linesB
              .join('\n')
              .replace(/pid \d+/g, 'pid <pid>')
              .split(path.basename(scene.routeB))
              .join('<route-b>'),
          ).toMatchSnapshot();
        });

        then('get names the one live daemon and its focus B', () => {
          const out = result.linesGet.join('\n');
          expect(out).toContain(`daemon pid ${result.spawns[0]}`);
          expect(out).toContain(
            `focus ${path.relative(scene.repoRoot, scene.routeB)}`,
          );
          expect(
            out
              .replace(/pid \d+/g, 'pid <pid>')
              .split(path.basename(scene.routeB))
              .join('<route-b>'),
          ).toMatchSnapshot();
        });
      });
    },
  );

  // the focus route halted and the drive reaped the daemon. the reap keeps the
  // focus, so get names that route and why it is down — never the false "never registered"
  given(
    '[case19] a clone whose focus route is blocked, its daemon reaped',
    () => {
      const scene = useBeforeAll(async () => {
        const built = await genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
          ],
        });
        await setRouteReminderFocus({
          repoRoot: built.route,
          cloneAddr: '@:driver-1',
          route: built.route,
        });
        return built;
      });

      when('[t0] get runs for the clone', () => {
        then(
          'it names the focus route and its halt, never "never registered"',
          async () => {
            const lines = await withCapturedStdout(
              ['--clone-addr', '@:driver-1'],
              (say) => routeReminderGet({ say, cwd: scene.route }),
            );
            const out = lines.join('\n');
            expect(out).toContain('reminder is not live');
            expect(out).toContain(
              'is not a live drive (route-not-live, status blocked)',
            );
            expect(out).toContain(
              'the next route.drive of a live route registers it',
            );
            expect(out).not.toContain('no daemon is registered');
            expect(out).toMatchSnapshot();
          },
        );
      });
    },
  );

  // a manual gen on a dead route must not pull a live daemon off the route the clone drives: the
  // daemon would exit on its next tick, and the live route would lose its nudges
  given(
    '[case21] one clone with a live daemon on route A, then gen on blocked route B',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-cli-gen-dead-route',
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
            { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
          ],
          parent: behaviorDir,
        });
        return { repoRoot, routeA, routeB };
      });

      when('[t0] gen runs for A, then for B', () => {
        const result = useBeforeAll(async () => {
          const spawns: number[] = [];
          const spawnDaemon = async () => {
            const sleeper = genSleeperProcess();
            spawns.push(sleeper.pid);
            return sleeper;
          };
          await withCapturedStdout(
            ['--route', scene.routeA, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGen({ say, spawnDaemon }),
          );
          const linesB = await withCapturedStdout(
            ['--route', scene.routeB, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGen({ say, spawnDaemon }),
          );
          const linesGet = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.repoRoot }),
          );
          return { spawns, linesB, linesGet };
        });

        then('the second gen spawns none and keeps the focus on A', () => {
          const out = result.linesB.join('\n');
          expect(result.spawns).toHaveLength(1);
          expect(out).toContain(
            `keeps its focus ${path.relative(scene.repoRoot, scene.routeA)}`,
          );
          expect(out).toContain('so the focus was not moved');
          expect(
            out
              .replace(/pid \d+/g, 'pid <pid>')
              .split(path.basename(scene.routeA))
              .join('<route-a>')
              .split(path.basename(scene.routeB))
              .join('<route-b>'),
          ).toMatchSnapshot();
        });

        then('get still names the live daemon on A', () => {
          const out = result.linesGet.join('\n');
          expect(out).toContain(`daemon pid ${result.spawns[0]}`);
          expect(out).toContain(
            `focus ${path.relative(scene.repoRoot, scene.routeA)}`,
          );
        });
      });
    },
  );

  // del hands the legacy reap to the human on stdout, so no reap line lands in the clone log for
  // a later get to misread as a daemon that went quiet
  given(
    '[case22] a clone with no live daemon and a live legacy daemon of the clone',
    () => {
      const scene = useBeforeAll(async () => {
        const repoRoot = genTempDir({
          slug: 'reminder-cli-del-legacy',
          git: true,
        });
        const legacyDir = path.join(repoRoot, '.behavior', 'v1.old', '.route');
        await fs.mkdir(legacyDir, { recursive: true });
        const legacy = genSleeperProcess();
        const legacyPidPath = path.join(
          legacyDir,
          'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
        );
        await fs.writeFile(legacyPidPath, String(legacy.pid));
        return { repoRoot, legacyPid: legacy.pid, legacyPidPath };
      });

      when('[t0] del runs, then get', () => {
        const result = useBeforeAll(async () => {
          const linesDel = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderDel({ say, cwd: scene.repoRoot }),
          );
          const linesGet = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.repoRoot }),
          );
          return { linesDel, linesGet };
        });

        then('del prints the legacy reap line', () => {
          const out = result.linesDel.join('\n');
          expect(out).toContain(
            `RouteReminder legacy daemon reaped — pid ${scene.legacyPid}, handle ${scene.legacyPidPath}`,
          );
          expect(
            out
              .replace(/pid \d+/g, 'pid <pid>')
              .split(scene.repoRoot)
              .join('<repo>'),
          ).toMatchSnapshot();
        });

        then('the legacy daemon is gone', async () => {
          await awaitPidDead(scene.legacyPid);
          expect(isProcessAlive({ pid: scene.legacyPid })).toEqual(false);
        });

        then('get reads no daemon registered, not a quiet daemon', () => {
          const out = result.linesGet.join('\n');
          expect(out).toContain('no daemon is registered');
          expect(out).not.toContain('has gone quiet');
        });
      });
    },
  );

  // a legacy handle whose reap faults (a torn pid file) is kept, and del tells the human how to
  // finish the reap by hand
  given('[case23] a clone with a torn legacy handle', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = genTempDir({
        slug: 'reminder-cli-del-legacy-kept',
        git: true,
      });
      const legacyDir = path.join(repoRoot, '.behavior', 'v1.torn', '.route');
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyPidPath = path.join(
        legacyDir,
        'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
      );
      await fs.writeFile(legacyPidPath, '123abc');
      return { repoRoot, legacyPidPath };
    });

    when('[t0] del runs', () => {
      const result = useBeforeAll(async () => ({
        lines: await withCapturedStdout(['--clone-addr', '@:driver-1'], (say) =>
          routeReminderDel({ say, cwd: scene.repoRoot }),
        ),
      }));

      then('del prints the kept line with the fix', () => {
        const out = result.lines.join('\n');
        // the fault reads as one headline; its metadata json would bury the fix mid-line
        expect(out).not.toContain('"pidPath"');
        expect(out).toContain(
          `RouteReminder legacy handle kept, reap faulted (${scene.legacyPidPath})`,
        );
        expect(out).toContain(
          `remove ${scene.legacyPidPath}, then run rhx route.reminder.gen`,
        );
        expect(out.split(scene.repoRoot).join('<repo>')).toMatchSnapshot();
      });

      then('the torn handle is kept on disk', async () => {
        expect(await fs.readFile(scene.legacyPidPath, 'utf-8')).toEqual(
          '123abc',
        );
      });
    });
  });

  // a manual gen sweeps the legacy handles before it spawns. a kept handle names a fix only a human
  // can run, so gen prints it at the terminal as del does, never only to the clone log
  given('[case28] gen on a live route, with a torn legacy handle', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      const legacyDir = path.join(route, '.behavior', 'v1.torn', '.route');
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyPidPath = path.join(
        legacyDir,
        'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
      );
      await fs.writeFile(legacyPidPath, '123abc');
      return { route, legacyPidPath };
    });

    when('[t0] gen runs', () => {
      const result = useBeforeAll(async () => ({
        lines: await withCapturedStdout(
          ['--route', scene.route, '--clone-addr', '@:driver-1'],
          (say) =>
            routeReminderGen({
              say,
              spawnDaemon: async () => genSleeperProcess(),
            }),
        ),
      }));

      then('gen registers, then prints the kept line with the fix last', () => {
        // the kept daemon still nudges beside the new one, so its fix is the last line read
        expect(result.lines[0]).toContain('reminder registered');
        expect(result.lines.at(-1)).toContain(
          `RouteReminder legacy handle kept, reap faulted (${scene.legacyPidPath})`,
        );
        const out = result.lines.join('\n');
        expect(out).not.toContain('"pidPath"');
        expect(
          out
            .replace(/pid \d+/g, 'pid <pid>')
            .split(scene.route)
            .join('<route>'),
        ).toMatchSnapshot();
      });
    });
  });

  // a torn clone handle (a body that is no pid) wedges every strict read. get names the one verb
  // that clears it, and del clears it rather than die on it
  given('[case29] a clone whose pid handle is torn', () => {
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      });
      const pidPath = getRouteReminderPidPath({
        repoRoot: route,
        cloneAddr: '@:driver-1',
      });
      await writeCloneHandleFile(pidPath, '12x');
      return { route, pidPath };
    });

    when('[t0] get runs for the clone', () => {
      then(
        'it refuses with a constraint that names del as the fix',
        async () => {
          const error = await getError(async () =>
            withCapturedStdout(['--clone-addr', '@:driver-1'], (say) =>
              routeReminderGet({ say, cwd: scene.route }),
            ),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('torn');
          expect(error.message).toContain('rhx route.reminder.del');
          expect(
            error.message.split(scene.route).join('<route>'),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t1] del runs for the clone', () => {
      const result = useBeforeAll(async () => ({
        lines: await withCapturedStdout(['--clone-addr', '@:driver-1'], (say) =>
          routeReminderDel({ say, cwd: scene.route }),
        ),
      }));

      then('del clears the torn handle and says so', () => {
        const out = result.lines.join('\n');
        expect(out).toContain('reminder handle was torn');
        expect(out).toContain('"12x"');
        expect(out.split(scene.route).join('<route>')).toMatchSnapshot();
      });

      then('the slot is empty', async () => {
        const found = await readRouteReminderRawPid({
          repoRoot: scene.route,
          cloneAddr: '@:driver-1',
        });
        expect(found).toBeNull();
      });
    });

    when('[t2] get runs after del', () => {
      then('it reads a clean not-live state, no fault', async () => {
        const lines = await withCapturedStdout(
          ['--clone-addr', '@:driver-1'],
          (say) => routeReminderGet({ say, cwd: scene.route }),
        );
        const out = lines.join('\n');
        expect(out).toContain('reminder is not live');
        expect(out.split(scene.route).join('<route>')).toMatchSnapshot();
      });
    });
  });

  // a live daemon whose focus just halted nudges no more: get says it exits on its next tick,
  // rather than report it plainly live
  given('[case24] a live daemon whose focus route is blocked', () => {
    const scene = useBeforeAll(async () => {
      const built = await genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      });
      const clone = { repoRoot: built.route, cloneAddr: '@:driver-1' };
      await setRouteReminderFocus({ ...clone, route: built.route });
      const sleeper = genSleeperProcess();
      await writeCloneHandleFile(
        getRouteReminderPidPath(clone),
        String(sleeper.pid),
      );
      return { ...built, pid: sleeper.pid };
    });

    when('[t0] get runs for the clone', () => {
      then(
        'it reads live for now, and names the halt and the exit',
        async () => {
          const lines = await withCapturedStdout(
            ['--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say, cwd: scene.route }),
          );
          const out = lines.join('\n');
          expect(out).toContain(
            `reminder is live for now — daemon pid ${scene.pid}`,
          );
          expect(out).toContain(
            'is not a live drive (route-not-live, status blocked)',
          );
          expect(out).toContain('exits on its next tick');
          expect(out.replace(/pid \d+/g, 'pid <pid>')).toMatchSnapshot();
        },
      );
    });
  });

  // a focus route that completed: its daemon exits with it, and get names the completion
  given('[case25] a clone whose focus route completed, its daemon gone', () => {
    const scene = useBeforeAll(async () => {
      const built = await genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'passed' },
        ],
      });
      await setRouteReminderFocus({
        repoRoot: built.route,
        cloneAddr: '@:driver-1',
        route: built.route,
      });
      return built;
    });

    when('[t0] get runs for the clone', () => {
      then('it names the focus route and its completion', async () => {
        const lines = await withCapturedStdout(
          ['--clone-addr', '@:driver-1'],
          (say) => routeReminderGet({ say, cwd: scene.route }),
        );
        const out = lines.join('\n');
        expect(out).toContain('reminder is not live');
        expect(out).toContain('is not a live drive (route-complete)');
        expect(out).not.toContain('no daemon is registered');
        expect(out).toMatchSnapshot();
      });
    });
  });

  // a stray value with no open key (a dropped `--`, a bogus positional) is refused, never dropped:
  // the refusal names the token and the `--flag value` shape, with a hint that fits the reminder
  given('[case31] get with a stray positional token', () => {
    when('[t0] get runs with a value no flag opened', () => {
      const result = useBeforeAll(async () => ({
        error: await getError(
          withCapturedStdout(['--clone-addr', '@:driver-1', 'foo'], (say) =>
            routeReminderGet({ say }),
          ),
        ),
      }));

      then(
        'it refuses as a constraint that names the token and the fix',
        () => {
          expect(result.error).toBeInstanceOf(BadRequestError);
          expect(result.error.message).toContain('unexpected argument "foo"');
          expect(result.error.message).toContain(
            'e.g. --clone-addr @:driver-1',
          );
          expect(result.error.message).toMatchSnapshot();
        },
      );
    });
  });

  // the daemon owns the clone's one slot. once the slot names another daemon (a fresh spawn
  // reclaimed it), this one exits `handle-lost` after its next nudge, and its exit line says so.
  // the nudge must land for the loop to reach that check, so the entrypoint's `sayToClone` seam is
  // injected (a sandbox holds no live clone); the timer seam makes the interval instant
  given('[case32] a daemon whose slot names another daemon', () => {
    const scene = useBeforeAll(async () => {
      const built = await genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
        stonesOpen: ['5.1.execution'],
      });
      await setRouteReminderFocus({
        repoRoot: built.route,
        cloneAddr: '@:driver-1',
        route: built.route,
      });
      const other = genSleeperProcess();
      await writeCloneHandleFile(
        getRouteReminderPidPath({
          repoRoot: built.route,
          cloneAddr: '@:driver-1',
        }),
        String(other.pid),
      );
      return { ...built, otherPid: other.pid };
    });

    when(
      '[t0] the daemon entrypoint runs for the clone, its nudge lands',
      () => {
        const result = useBeforeAll(async () => {
          const nudges: string[] = [];
          const lines = await withCapturedStdout(
            [
              '--repo-root',
              scene.route,
              '--clone-addr',
              '@:driver-1',
              '--interval-ms',
              '1000',
            ],
            (say) =>
              routeReminderDaemon({
                say,
                sayToClone: async (input) => {
                  nudges.push(input.addr);
                  return { reached: true };
                },
                sleep: async () => undefined,
              }),
          );
          return { lines, nudges };
        });

        then('it nudges once, then exits handle-lost', () => {
          expect(result.nudges).toEqual(['@:driver-1']);
          const line = result.lines.find((l) =>
            l.startsWith('route.reminder.daemon exited:'),
          );
          expect(line).toContain('reason=handle-lost');
          expect(line).toContain('ticks=1');
          expect(line?.split(scene.route).join('<route>')).toMatchSnapshot();
        });

        then('the slot still names the other daemon', async () => {
          expect(
            await readRouteReminderRawPid({
              repoRoot: scene.route,
              cloneAddr: '@:driver-1',
            }),
          ).toEqual({ pid: scene.otherPid });
        });
      },
    );
  });

  // gen cannot point the reminder at its route: the focus write faults. it fails loud and spawns
  // no daemon, so a human never reads a registered reminder that nudges about another route
  given(
    '[case26] a gen whose focus write faults (the handle dir is read-only)',
    () => {
      const scene = useBeforeAll(async () => {
        const built = await genRouteWithPassage({
          lines: [{ stone: '5.1.execution', status: 'arrived' }],
        });
        const pidPath = getRouteReminderPidPath({
          repoRoot: built.route,
          cloneAddr: '@:driver-1',
        });
        await fs.mkdir(path.dirname(pidPath), { recursive: true });
        await fs.chmod(path.dirname(pidPath), 0o500);
        return { ...built, pidPath };
      });
      afterAll(async () => {
        await fs.chmod(path.dirname(scene.pidPath), 0o700);
      });

      when('[t0] gen runs for the route', () => {
        const result = useBeforeAll(async () => {
          const spawns: number[] = [];
          const error = await getError(
            withCapturedStdout(
              ['--route', scene.route, '--clone-addr', '@:driver-1'],
              (say) =>
                routeReminderGen({
                  say,
                  spawnDaemon: async () => {
                    const sleeper = genSleeperProcess();
                    spawns.push(sleeper.pid);
                    return sleeper;
                  },
                }),
            ),
          );
          return { error, spawns };
        });

        then('it fails loud with the io fault', () => {
          expect((result.error as NodeJS.ErrnoException).code).toEqual(
            'EACCES',
          );
        });

        then('it spawns no daemon and claims no handle', async () => {
          expect(result.spawns).toEqual([]);
          const pid = await fs
            .readFile(scene.pidPath, 'utf-8')
            .catch((error: NodeJS.ErrnoException) => {
              if (error.code === 'ENOENT') return null;
              throw error;
            });
          expect(pid).toEqual(null);
        });
      });
    },
  );
});

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '@src/domain.operations/route/.test/genRouteWithPassage';
import { bumpRouteReminderCrashBreaker } from '@src/domain.operations/route/reminder/bumpRouteReminderCrashBreaker';
import { getRouteReminderLogPath } from '@src/domain.operations/route/reminder/getRouteReminderLogPath';
import { getRouteReminderPidPath } from '@src/domain.operations/route/reminder/getRouteReminderPidPath';
import { isProcessAlive } from '@src/domain.operations/route/reminder/isProcessAlive';
import { MAX_ROUTE_REMINDER_CRASHES } from '@src/domain.operations/route/reminder/MAX_ROUTE_REMINDER_CRASHES';
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

  given('[case1] a blocked route (the daemon must self-exit at once)', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      }),
    );

    when('[t0] the daemon entrypoint runs against the blocked route', () => {
      then(
        'it logs its exit reason — route-not-live, tick 1 (observability)',
        async () => {
          const lines = await withCapturedStdout(
            [
              '--route',
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
          // snapshot the exact observability format (the one place a human learns WHY a reminder
          // went quiet), with the dynamic tmp route scrubbed so the shape pins deterministically
          // (rule.require.snapshots).
          expect(
            (line ?? '').replace(scene.route, '<route>'),
          ).toMatchSnapshot();
        },
      );
    });
  });

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
            ['--route', scene.route, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say }),
          );
          const out = lines.join('\n');
          expect(out).toContain('reminder is not live');
          // this session left NO daemon log, so get must discriminate to the NEVER-registered message
          // (start one), NOT the went-quiet message (read the log). the distinct phrase makes a
          // regression to one undifferentiated string go red (rule.require.status-feedback).
          expect(out).toContain('no daemon was ever registered');
          // snapshot the exact human-read bytes so a reviewer sees the shell experience and any drift
          // in the message surfaces (rule.require.snapshots). no dynamic tmp path here (the
          // never-registered message names no log path), so no scrub is needed.
          expect(out).toMatchSnapshot();
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

      when('[t0] detect runs with --route but no --clone-addr', () => {
        then('it fails loud with an error that names the fix', async () => {
          // no RHACHET_CLONE_SERIAL to auto-derive from — the required-arg floor still holds
          delete process.env.RHACHET_CLONE_SERIAL;
          const error = await getError(
            withCapturedStdout(['--route', scene.route], (say) =>
              routeReminderGet({ say }),
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
            withCapturedStdout(
              ['--route', scene.route, '--clone-addr', 'driver-1'],
              (say) => routeReminderGet({ say }),
            ),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain("did you mean '@:driver-1'?");
        },
      );
    });
  });

  // the spawned daemon parses the raw argv node hands `node -e "code" -- <flags>`. node's treatment
  // of the `--` end-of-options marker has two possible shapes, and the getInvocationArgs slice must
  // recover --route from BOTH — else the daemon dies at startup with "--route is required" while
  // route.reminder.gen reported "spawned" (the r8 silent-feature-killer). this clamps that seam
  // deterministically, without a built dist: it drives the real daemon entrypoint through the exact
  // argv shapes and asserts it recovers the flags (self-exits route-not-live, never "route required").
  given(
    '[case4] the two argv shapes node produces for `node -e ... -- <flags>`',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteWithPassage({
          lines: [
            { stone: '5.1.execution', status: 'arrived' },
            { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
          ],
        }),
      );

      when(
        '[t0] node CONSUMES the -- marker (argv[1] is the first flag)',
        () => {
          then(
            'the daemon recovers --route and self-exits route-not-live',
            async () => {
              const lines = await withRawArgv(
                [
                  '/usr/bin/node',
                  '--route',
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
          'the daemon still recovers --route and self-exits route-not-live',
          async () => {
            const lines = await withRawArgv(
              [
                '/usr/bin/node',
                '--',
                '--route',
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
          'it reports the daemon spawned and live, with the pid',
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
        await fs.writeFile(
          getRouteReminderLogPath({
            route: built.route,
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
              ['--route', scene.route, '--clone-addr', '@:driver-1'],
              (say) => routeReminderGet({ say }),
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

  // Fix F clamp: a freshly spawned daemon on a NOT-active route (here: blocked) self-exits on tick 1
  // by design. the OLD single-instant kill -0 probe raced that self-exit and almost always reported
  // "spawned and live" for a process already committed to exit (rule.forbid.behavior-hazards /
  // rule.forbid.surprises). gen now reads the DETERMINISTIC route activity FIRST, so a blocked route
  // ALWAYS reports the honest "not a live drive (route-not-live)" — no time-order race. the pid here
  // is a REAL live sleeper that WOULD read "alive" if the probe decided; the test proves the probe is
  // NOT reached for a not-active route (the activity gate returns first). RED under the probe-first
  // code (nondeterministic), GREEN under the activity gate.
  given('[case11] gen on a blocked (not-active) route', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      }),
    );

    when('[t0] gen registers onto the blocked route', () => {
      then(
        'it reports the honest not-a-live-drive reason, never a phantom live',
        async () => {
          const lines = await withCapturedStdout(
            ['--route', scene.route, '--clone-addr', '@:driver-1'],
            (say) =>
              routeReminderGen({
                say,
                // a REAL live sleeper — its kill -0 WOULD read "alive"; the activity gate returns
                // before any probe, so the honest not-a-live-drive message wins regardless
                spawnDaemon: async () => genSleeperProcess(),
              }),
          );
          const out = lines.join('\n');
          expect(out).toContain('not a live drive');
          expect(out).toContain('route-not-live');
          expect(out).toMatch(/pid \d+/);
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
  });

  // the clamp for the `--flag=value` failhide: `--interval-ms=5000` MUST parse to 5000, never
  // silently fall to the 20m default (the exact silent-degrade a reviewer flagged). the injected
  // spawnDaemon records the intervalMs it was handed, so the assertion proves the `=` idiom reached
  // genRouteReminder intact. RED under the old `--flag value`-only parser (records the default),
  // GREEN under the `--key=value` split. a BLOCKED tail keeps the daemon from a real spawn residue.
  given('[case12] gen with the --interval-ms=<value> (equals) idiom', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
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
          ['--route', scene.route, '--clone-addr', '@:driver-1'],
          (say) => routeReminderDel({ say }),
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
      await fs.writeFile(
        getRouteReminderPidPath({ route, cloneAddr: '@:driver-1' }),
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
      await fs.writeFile(
        getRouteReminderPidPath({ route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      return { route, pid };
    });

    when('[t0] del runs against the live daemon', () => {
      then(
        'it stops the live daemon, clears the handle, and reaps the pid',
        async () => {
          const lines = await withCapturedStdout(
            ['--route', scene.route, '--clone-addr', '@:driver-1'],
            (say) => routeReminderDel({ say }),
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
      await fs.writeFile(
        getRouteReminderPidPath({ route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      return { route, pid };
    });

    when('[t0] get runs against the live session', () => {
      then('it reports the reminder is live, with the pid', async () => {
        const lines = await withCapturedStdout(
          ['--route', scene.route, '--clone-addr', '@:driver-1'],
          (say) => routeReminderGet({ say }),
        );
        expect(lines.join('\n')).toContain('reminder is live');
        expect(lines.join('\n')).toContain(`daemon pid ${scene.pid}`);
        // scrub the real sleeper pid so the live-branch line a human reads snaps deterministically
        // (rule.require.snapshots).
        expect(
          lines.join('\n').replace(String(scene.pid), '<pid>'),
        ).toMatchSnapshot();
      });
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
        await bumpRouteReminderCrashBreaker({ route, cloneAddr: '@:driver-1' });
      return { route };
    });

    when('[t0] get runs against the circuit-broken session', () => {
      then(
        'it reports the circuit-broken state and names the re-arm fix',
        async () => {
          const lines = await withCapturedStdout(
            ['--route', scene.route, '--clone-addr', '@:driver-1'],
            (say) => routeReminderGet({ say }),
          );
          const out = lines.join('\n');
          expect(out).toContain('reminder is not live');
          expect(out).toContain('CIRCUIT-BROKEN');
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
      await fs.writeFile(
        getRouteReminderPidPath({ route, cloneAddr: '@:driver-1' }),
        String(pid),
      );
      // the trace a registered daemon leaves — the very log that, left behind, would make a later
      // get misreport the deliberate stop as a crash
      await fs.writeFile(
        getRouteReminderLogPath({ route, cloneAddr: '@:driver-1' }),
        'route.reminder.daemon tick=1\n',
      );
      return { route, pid };
    });

    when('[t0] del deregisters the live daemon on purpose', () => {
      then('it reports the deliberate deregister', async () => {
        const lines = await withCapturedStdout(
          ['--route', scene.route, '--clone-addr', '@:driver-1'],
          (say) => routeReminderDel({ say }),
        );
        expect(lines.join('\n')).toContain('deregistered');
        await awaitPidDead(scene.pid);
      });

      when('[t1] a later get reads the deliberately-stopped session', () => {
        then(
          'it reports NOT registered — never a misattributed crash',
          async () => {
            const lines = await withCapturedStdout(
              ['--route', scene.route, '--clone-addr', '@:driver-1'],
              (say) => routeReminderGet({ say }),
            );
            const out = lines.join('\n');
            expect(out).toContain('reminder is not live');
            // a deliberate del cleared the log, so get reads the accurate never/not-registered
            // message — NOT the went-quiet crash misattribution.
            expect(out).toContain('no daemon was ever registered');
            expect(out).not.toContain(
              'a daemon was registered but has gone quiet',
            );
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

      when(
        '[t0] detect runs with only --route, RHACHET_CLONE_SERIAL set',
        () => {
          then(
            'it derives the clone addr from the env — no --clone-addr needed',
            async () => {
              process.env.RHACHET_CLONE_SERIAL = 'auto-derive-1';
              const lines = await withCapturedStdout(
                ['--route', scene.route],
                (say) => routeReminderGet({ say }),
              );
              const out = lines.join('\n');
              // the SAME message an explicit --clone-addr @:auto-derive-1 would produce — proof the
              // derived address reached the real getRouteReminder call, not a placeholder
              expect(out).toContain('reminder is not live');
              expect(out).toContain('no daemon was ever registered');
            },
          );
        },
      );

      when(
        '[t1] an explicit --clone-addr is given alongside the same env',
        () => {
          then(
            'the explicit flag overrides the derived env value',
            async () => {
              process.env.RHACHET_CLONE_SERIAL = 'auto-derive-1';
              // register a daemon under the EXPLICIT address only
              const { pid } = genSleeperProcess();
              await fs.writeFile(
                getRouteReminderPidPath({
                  route: scene.route,
                  cloneAddr: '@:explicit-2',
                }),
                String(pid),
              );
              const lines = await withCapturedStdout(
                ['--route', scene.route, '--clone-addr', '@:explicit-2'],
                (say) => routeReminderGet({ say }),
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
});

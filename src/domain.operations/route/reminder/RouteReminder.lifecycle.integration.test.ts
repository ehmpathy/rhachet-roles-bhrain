import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { delRouteReminder } from './delRouteReminder';
import { genRouteReminder } from './genRouteReminder';
import { getRouteReminder } from './getRouteReminder';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';
import { isProcessAlive } from './isProcessAlive';
import { stopProcess } from './stopProcess';

// a file-presence probe that allowlists ONLY ENOENT (absent) — a permission / io fault surfaces
// instead of a collapse to "absent" (rule.forbid.failhide). used to assert handle presence.
const isFilePresent = async (filePath: string): Promise<boolean> => {
  const stat = await fs.stat(filePath).catch((error: unknown) => {
    if (asNodeErrnoCode(error) === 'ENOENT') return null;
    throw error;
  });
  return stat !== null;
};

/**
 * .what = the full register → detect → findsert → deregister lifecycle, against real pids
 * .why = the pid file is the daemon's handle; its lifecycle must be proven against a REAL
 *        background process, not a mock. a real `sleep` process stands in for the daemon so
 *        `kill -0` liveness, findsert idempotency, and teardown are all exercised for real.
 */

// a real, harmless background process to stand in for the daemon (a long sleep)
const genSleeperProcess = (): { pid: number } => {
  // cwd = repo root (jest runs from there) — a subprocess must not inherit a cwd outside the
  // git root (rule.forbid.cwd-outside-gitroot); harmless for `sleep`, kept for rule conformance.
  const child = spawn('sleep', ['300'], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
  });
  child.unref();
  if (!child.pid) throw new Error('failed to spawn sleeper');
  return { pid: child.pid };
};

const spawnedPids: number[] = [];
const spawnSleeperDaemon = async (): Promise<{ pid: number }> => {
  const { pid } = genSleeperProcess();
  spawnedPids.push(pid);
  return { pid };
};

// waits until a pid is truly reaped — a deterministic poll of the real condition, NOT a
// fixed-duration guess (rule.forbid.time-assumptions). recursive + bounded so it stays
// const-only and cannot loop forever. liveness comes from isProcessAlive, which allowlists ONLY
// ESRCH as "dead" and surfaces any other errno (e.g. EPERM = alive-but-not-ours), so a
// not-actually-dead pid can never end the wait early (rule.forbid.failhide).
const awaitPidDead = async (pid: number, triesLeft = 100): Promise<void> => {
  if (!isProcessAlive({ pid })) return;
  if (triesLeft <= 0) throw new Error(`pid ${pid} still alive after wait`);
  await new Promise((done) => setTimeout(done, 10));
  return awaitPidDead(pid, triesLeft - 1);
};

// the driver session address the reminder is keyed by (per-session pid scope)
const CLONE_ADDR = '@:driver-1';

// the live pid is non-deterministic (a real spawned process), so scrub it to a stable token
// before a journey snapshot — the snapshot then pins the SHAPE + the deterministic facts, not
// the random pid, so a reviewer reconstructs the arc from the snapshots alone.
const asScrubbedPid = (pid: number | null | undefined): string | null =>
  pid === null || pid === undefined
    ? null
    : pid > 0
      ? '<live-pid>'
      : `<bad:${pid}>`;

describe('RouteReminder.lifecycle.integration', () => {
  // reap every sleeper we spawned, so no test process lingers. stopProcess allowlists ONLY
  // ESRCH (already gone) and surfaces any other errno — a leaked-but-unkillable sleeper (EPERM)
  // is a real fault, never swallowed (rule.forbid.failhide).
  afterAll(() => {
    for (const pid of spawnedPids) {
      stopProcess({ pid, signal: 'SIGKILL' });
    }
  });

  given('[case1] a route with no reminder set', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'reminder-life-'));
      await fs.mkdir(path.join(route, '.route'), { recursive: true });
      return { route };
    });

    when('[t0] the reminder is detected before any register', () => {
      then('no reminder is set', async () => {
        expect(
          await getRouteReminder({ route: scene.route, cloneAddr: CLONE_ADDR }),
        ).toBeNull();
      });

      then('the journey step matches its snapshot', async () => {
        const found = await getRouteReminder({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
        });
        // pin the arc's first frame: a bare route yields no live reminder
        expect({
          step: 't0.detect-before-register',
          reminder: found,
        }).toMatchSnapshot();
      });
    });

    when('[t1] the reminder is registered', () => {
      const registered = useBeforeAll(async () =>
        genRouteReminder(
          {
            route: scene.route,
            cloneAddr: CLONE_ADDR,
            intervalMs: null,
            sayTimeoutMs: null,
          },
          { spawnDaemon: spawnSleeperDaemon },
        ),
      );

      then('it reports a freshly created daemon', () => {
        expect(registered.created).toBe(true);
        expect(registered.pid).toBeGreaterThan(0);
      });

      then(
        'the pid handle is written into .route/ under a per-session name',
        async () => {
          const pidPath = getRouteReminderPidPath({
            route: scene.route,
            cloneAddr: CLONE_ADDR,
          });
          // the handle name carries the escape-folded session token, so two sessions never
          // collide (CLONE_ADDR's '@' and ':' each fold to a ~XX hex escape)
          expect(path.basename(pidPath)).toEqual(
            'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
          );
          const raw = await fs.readFile(pidPath, 'utf-8');
          expect(Number.parseInt(raw.trim(), 10)).toEqual(registered.pid);
        },
      );

      then('detect now finds the live daemon', async () => {
        const found = await getRouteReminder({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
        });
        expect(found?.pid).toEqual(registered.pid);
      });

      then(
        'a DIFFERENT session on the same route sees no reminder (per-session scope)',
        async () => {
          const other = await getRouteReminder({
            route: scene.route,
            cloneAddr: '@:driver-2',
          });
          expect(other).toBeNull();
        },
      );

      then('the journey step matches its snapshot', async () => {
        const found = await getRouteReminder({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
        });
        // pin the register frame: created + a live handle, pid scrubbed to a stable token
        expect({
          step: 't1.register',
          created: registered.created,
          registeredPid: asScrubbedPid(registered.pid),
          detectedPid: asScrubbedPid(found?.pid),
          handleName: path.basename(
            getRouteReminderPidPath({
              route: scene.route,
              cloneAddr: CLONE_ADDR,
            }),
          ),
        }).toMatchSnapshot();
      });
    });

    when('[t2] the reminder is registered again (findsert)', () => {
      const outcome = useBeforeAll(async () => {
        const first = await getRouteReminder({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
        });
        const again = await genRouteReminder(
          {
            route: scene.route,
            cloneAddr: CLONE_ADDR,
            intervalMs: null,
            sayTimeoutMs: null,
          },
          {
            spawnDaemon: async () => {
              throw new Error('findsert must not spawn when a daemon is live');
            },
          },
        );
        return { first, again };
      });

      then('it returns the extant pid, spawns no duplicate', () => {
        expect(outcome.again.created).toBe(false);
        expect(outcome.again.pid).toEqual(outcome.first?.pid);
      });

      then('the journey step matches its snapshot', () => {
        // pin the findsert frame: not created, and the returned pid IS the extant one
        expect({
          step: 't2.findsert',
          created: outcome.again.created,
          reusedExtantPid: outcome.again.pid === outcome.first?.pid,
        }).toMatchSnapshot();
      });
    });

    when('[t3] the reminder is deregistered', () => {
      const result = useBeforeAll(async () =>
        delRouteReminder({ route: scene.route, cloneAddr: CLONE_ADDR }),
      );

      then('it reports the live daemon was stopped', () => {
        expect(result.stopped).toBe(true);
      });

      then('detect now finds no reminder', async () => {
        expect(
          await getRouteReminder({ route: scene.route, cloneAddr: CLONE_ADDR }),
        ).toBeNull();
      });

      then('the pid handle file is removed', async () => {
        const exists = await isFilePresent(
          getRouteReminderPidPath({
            route: scene.route,
            cloneAddr: CLONE_ADDR,
          }),
        );
        expect(exists).toBe(false);
      });

      then('the journey step matches its snapshot', async () => {
        const found = await getRouteReminder({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
        });
        const handleExists = await isFilePresent(
          getRouteReminderPidPath({
            route: scene.route,
            cloneAddr: CLONE_ADDR,
          }),
        );
        // pin the teardown frame: the live daemon was stopped, detect is null, handle gone
        expect({
          step: 't3.deregister',
          stopped: result.stopped,
          reminderAfter: found,
          handleExists,
        }).toMatchSnapshot();
      });
    });

    when('[t4] deregister runs again on the absent reminder', () => {
      const result = useBeforeAll(async () =>
        delRouteReminder({ route: scene.route, cloneAddr: CLONE_ADDR }),
      );

      then('it is an idempotent no-op (none stopped)', () => {
        expect(result.stopped).toBe(false);
      });

      then('the journey step matches its snapshot', () => {
        // pin the idempotent-teardown frame: a re-run on an absent reminder stops no process
        expect({
          step: 't4.deregister-again',
          stopped: result.stopped,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case2] a stale pid file left by a crashed daemon', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'reminder-stale-'));
      await fs.mkdir(path.join(route, '.route'), { recursive: true });
      // spawn a real process, capture its pid, then kill it → the pid is now dead
      const { pid } = genSleeperProcess();
      process.kill(pid, 'SIGKILL');
      // wait until the pid is TRULY dead (deterministic poll), then write it as a stale handle
      await awaitPidDead(pid);
      await fs.writeFile(
        getRouteReminderPidPath({ route, cloneAddr: CLONE_ADDR }),
        String(pid),
      );
      return { route, deadPid: pid };
    });

    when('[t0] detect reads the stale handle', () => {
      then(
        'it reports no reminder — kill -0 fails on the dead pid',
        async () => {
          expect(
            await getRouteReminder({
              route: scene.route,
              cloneAddr: CLONE_ADDR,
            }),
          ).toBeNull();
        },
      );

      then('the journey step matches its snapshot', async () => {
        const found = await getRouteReminder({
          route: scene.route,
          cloneAddr: CLONE_ADDR,
        });
        // pin the stale-read frame: a dead pointer reads as absent, never as live
        expect({ step: 't0.detect-stale', reminder: found }).toMatchSnapshot();
      });
    });

    when('[t1] register runs over the stale handle', () => {
      const registered = useBeforeAll(async () =>
        genRouteReminder(
          {
            route: scene.route,
            cloneAddr: CLONE_ADDR,
            intervalMs: null,
            sayTimeoutMs: null,
          },
          { spawnDaemon: spawnSleeperDaemon },
        ),
      );

      then('it spawns fresh (stale handle does not count as live)', () => {
        expect(registered.created).toBe(true);
        expect(registered.pid).not.toEqual(scene.deadPid);
      });

      then('the journey step matches its snapshot', () => {
        // pin the stale-overwrite frame: a fresh spawn, pid differs from the dead one
        expect({
          step: 't1.register-over-stale',
          created: registered.created,
          pid: asScrubbedPid(registered.pid),
          differsFromDeadPid: registered.pid !== scene.deadPid,
        }).toMatchSnapshot();
      });
    });
  });

  given(
    '[case4] a fault in the post-claim reconcile reaps the just-spawned daemon',
    () => {
      // Fix D clamp (rule.forbid.behavior-hazards / rule.forbid.failhide): if a concurrent writer
      // claims the handle between genRouteReminder's fast-path read and its exclusive-create claim,
      // the claim loses (EEXIST) and the reconcile reads the extant handle. a TORN handle makes that
      // read throw — and the just-spawned daemon MUST be reaped before the fault propagates, else it
      // is left loose with no handle on disk, a nudge drone unaddressable by get/del. the fake spawn
      // here writes a corrupt handle as its side effect, deterministically to force the reconcile down
      // its fault path. RED before reapSpawnedPidOnFault wrapped the reconcile (the sleeper leaked,
      // still alive + the fault mis-classified as benign), GREEN after (reaped + UnexpectedCodePathError).
      const scene = useBeforeAll(async () => {
        const route = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-reconcile-'),
        );
        await fs.mkdir(path.join(route, '.route'), { recursive: true });
        return { route };
      });

      when(
        '[t0] register spawns, then loses the claim to a corrupt rival handle',
        () => {
          const outcome = useBeforeAll(async () => {
            const spawnedInReconcile: number[] = [];
            // the fake host boundary: spawn a real sleeper, then write a corrupt handle to simulate a
            // concurrent writer that claimed the slot first (forces EEXIST → the reconcile fault path)
            const spawnSleeperThenCorruptHandle = async (spawnInput: {
              route: string;
              cloneAddr: string;
              intervalMs: number;
              sayTimeoutMs: number;
            }): Promise<{ pid: number }> => {
              const { pid } = genSleeperProcess();
              spawnedPids.push(pid);
              spawnedInReconcile.push(pid);
              await fs.writeFile(
                getRouteReminderPidPath({
                  route: spawnInput.route,
                  cloneAddr: spawnInput.cloneAddr,
                }),
                '123abc',
              );
              return { pid };
            };
            const error = await getError(
              genRouteReminder(
                {
                  route: scene.route,
                  cloneAddr: CLONE_ADDR,
                  intervalMs: null,
                  sayTimeoutMs: null,
                },
                { spawnDaemon: spawnSleeperThenCorruptHandle },
              ),
            );
            return { error, spawnedPid: spawnedInReconcile[0] ?? -1 };
          });

          then(
            'the reconcile fault surfaces as UnexpectedCodePathError (reap succeeded → not an orphan)',
            () => {
              expect(outcome.error).toBeInstanceOf(UnexpectedCodePathError);
            },
          );

          then(
            'the just-spawned daemon was reaped, never left loose',
            async () => {
              // the core leak clamp: pre-fix the reconcile threw WITHOUT a reap → this pid stayed alive
              await awaitPidDead(outcome.spawnedPid);
              expect(isProcessAlive({ pid: outcome.spawnedPid })).toBe(false);
            },
          );
        },
      );
    },
  );

  given('[case3] a corrupt pid handle that begins with digits', () => {
    // clamps the strict-parse fix: Number.parseInt would read `123abc` as 123 and pass a bare
    // integer guard, so a torn write with a digit prefix would be read as a live pid instead of
    // failing loud. this proves the /^\d+$/ gate throws on ANY non-all-digits handle.
    const CORRUPT_HANDLES = ['123abc', '12 34', '0x1F', '  ', '-5', '3.14'];

    CORRUPT_HANDLES.forEach((raw) => {
      given(`[sub] the handle contains "${raw}"`, () => {
        const scene = useBeforeAll(async () => {
          const route = await fs.mkdtemp(
            path.join(os.tmpdir(), 'reminder-corrupt-'),
          );
          await fs.mkdir(path.join(route, '.route'), { recursive: true });
          await fs.writeFile(
            getRouteReminderPidPath({ route, cloneAddr: CLONE_ADDR }),
            raw,
          );
          return { route };
        });

        when('[t0] detect reads the corrupt handle', () => {
          then(
            'it fails loud — a corrupt handle is invalid state, never a live pid',
            async () => {
              // assert WHAT it throws (not merely THAT it throws): a torn handle is an invalid-state
              // fault, so it must be the strict-parse UnexpectedCodePathError — a swap to a different
              // error (or a silent return) would regress the malformed-state contract.
              const error = await getError(
                getRouteReminder({
                  route: scene.route,
                  cloneAddr: CLONE_ADDR,
                }),
              );
              expect(error).toBeInstanceOf(UnexpectedCodePathError);
            },
          );
        });
      });
    });
  });
});

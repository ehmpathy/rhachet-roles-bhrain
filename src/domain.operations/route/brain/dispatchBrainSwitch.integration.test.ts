import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { dispatchBrainSwitch } from './dispatchBrainSwitch';
import { formatStoneBrainOutcome } from './formatStoneBrainOutcome';
import type { StoneBrainOutcome } from './setStoneBrain';

/**
 * .what = integration test for the real `clone say` dispatch spawn boundary
 * .why = every drive scenario halts before dispatch, so this is the one suite that proves
 *        the bit the caller reads — `submitted` — against a REAL spawn. it proves launch,
 *        never delivery (F5); the shims are inert, so no `/model` reaches a live session
 *
 * .note = the real-binary row pays node-boot latency, so its timeout is raised
 */
jest.setTimeout(30_000);

describe('dispatchBrainSwitch', () => {
  given('the rhx binary is ABSENT (a spawn that cannot launch)', () => {
    when('a switch is dispatched at a non-existent binary path', () => {
      const result = useThen('returns without a throw', async () => {
        const dir = genTempDir({ slug: 'dispatch-absent' });
        // no binary written — the path does not exist
        return dispatchBrainSwitch({
          rhx: path.join(dir, 'node_modules', '.bin', 'rhx'),
          repoRoot: dir,
          address: 'be3e7529',
          brain: 'opus',
          effort: null,
        });
      });

      then('submitted is FALSE — ENOENT, so the exec never happened', () => {
        // `child.pid` is undefined: libuv reports an execve failure synchronously
        // .note = an absent path fails at fork too, so `[case-noexec]` and `[case-isdir]`
        //         are the rows that prove `pid` reports the exec
        // .note = the `error` listener logs the ENOENT rather than let it crash the hook
        expect(result.submitted).toEqual(false);
      });
    });
  });

  given('a real rhx shim that launches and exits 0', () => {
    when('a switch is dispatched at the shim', () => {
      const result = useThen('returns without a throw', async () => {
        const dir = genTempDir({ slug: 'dispatch-launch' });
        const binDir = path.join(dir, 'node_modules', '.bin');
        await fs.mkdir(binDir, { recursive: true });
        // an inert shim: it launches and exits 0, and reads no `/model` — so no switch
        // reaches any real session, but the fork SUCCEEDS, which is the bit under test
        const shim = path.join(binDir, 'rhx');
        await fs.writeFile(shim, '#!/bin/sh\nexit 0\n');
        await fs.chmod(shim, 0o755);
        return dispatchBrainSwitch({
          rhx: shim,
          repoRoot: dir,
          address: 'be3e7529',
          brain: 'opus',
          effort: null,
        });
      });

      then(
        'submitted is TRUE — the child exec’d (launch, never delivery)',
        () => {
          expect(result.submitted).toEqual(true);
        },
      );
    });
  });

  // `[case-noexec]` — a binary PRESENT but not executable
  // .why = `submitted` reads `child.pid`, which libuv assigns only if fork AND exec succeed.
  //        that is a property of libuv this design leans on and does not own; a runtime that
  //        set `pid` on a failed exec would record a `requested` switch that never launched,
  //        and goes red here (`rule.require.clamp-edge-cases`)
  // .note = `EACCES` is the hermetic exec failure: a file at the default 0o644 mode is not
  //         executable on any posix host (`rule.forbid.bare-host-deps`)
  given(
    'a real rhx binary that is PRESENT but cannot exec (mode 0o644)',
    () => {
      when('a switch is dispatched at it', () => {
        const result = useThen('returns without a throw', async () => {
          const dir = genTempDir({ slug: 'dispatch-noexec' });
          const binDir = path.join(dir, 'node_modules', '.bin');
          await fs.mkdir(binDir, { recursive: true });
          const shim = path.join(binDir, 'rhx');
          // written at the default mode, and deliberately NOT chmod'd — the file exists,
          // so the fork succeeds and the execve does not
          await fs.writeFile(shim, '#!/bin/sh\nexit 0\n');
          return dispatchBrainSwitch({
            rhx: shim,
            repoRoot: dir,
            address: 'be3e7529',
            brain: 'opus',
            effort: null,
          });
        });

        then('submitted is FALSE — a fork is not an exec', () => {
          expect(result.submitted).toEqual(false);
        });
      });
    },
  );

  // `[case-isdir]` — the THIRD exec-failure driver, beside ENOENT and EACCES: EISDIR, the
  //    one a reader might expect a fork to survive, since the path resolves and is readable
  given('a DIRECTORY sits where the rhx binary must be', () => {
    when('a switch is dispatched at it', () => {
      const result = useThen('returns without a throw', async () => {
        const dir = genTempDir({ slug: 'dispatch-isdir' });
        const shim = path.join(dir, 'node_modules', '.bin', 'rhx');
        await fs.mkdir(shim, { recursive: true });
        return dispatchBrainSwitch({
          rhx: shim,
          repoRoot: dir,
          address: 'be3e7529',
          brain: 'opus',
          effort: null,
        });
      });

      then('submitted is FALSE — a directory cannot exec', () => {
        expect(result.submitted).toEqual(false);
      });
    });
  });

  // a `clone say` that exits 1 with a MalfunctionError must leave its stderr in the log;
  // the record still reads `requested`, so the log is the only trace (see `F23` below)
  given(
    'a real rhx shim that launches and FAILS LOUD (exit 1 + stderr)',
    () => {
      when('a switch is dispatched at the shim', () => {
        const scene = useThen('the child runs to completion', async () => {
          const dir = genTempDir({ slug: 'dispatch-loud' });
          const binDir = path.join(dir, 'node_modules', '.bin');
          await fs.mkdir(binDir, { recursive: true });
          const shim = path.join(binDir, 'rhx');
          await fs.writeFile(
            shim,
            '#!/bin/sh\necho "MalfunctionError: the brain never submitted it" 1>&2\nexit 1\n',
          );
          await fs.chmod(shim, 0o755);
          const result = dispatchBrainSwitch({
            rhx: shim,
            repoRoot: dir,
            address: 'be3e7529',
            brain: 'opus',
            effort: null,
          });
          // the child is detached, so its write lands after this call returns. poll the log
          // rather than sleep a fixed span — bounded, and it cannot pass on an empty file.
          const logPath = path.join(
            dir,
            '.log',
            'bhrain',
            'brain',
            'apply.log',
          );
          const log = await (async () => {
            for (let attempt = 0; attempt < 50; attempt += 1) {
              const text = await fs.readFile(logPath, 'utf-8').catch(() => '');
              if (text.length > 0) return text;
              await new Promise((settle) => setTimeout(settle, 20));
            }
            return '';
          })();
          return { result, log };
        });

        then(
          'submitted is TRUE — the EXEC succeeded; the exit code is a later event',
          () => {
            // `submitted` reports the exec (`[case-noexec]`); a child that execs then exits 1
            // lands after it, so it stays uncaught — that gap is `F23`
            expect(scene.result.submitted).toEqual(true);
          },
        );

        then(
          'the child’s own stderr is CAPTURED in the engine-owned log',
          () => {
            expect(scene.log).toContain(
              'MalfunctionError: the brain never submitted it',
            );
          },
        );

        // 🔴 the clamp for `F23`: it pins the GAP. a loud post-exec failure is logged, yet
        //    the next tick renders it exactly as a healthy dispatch in flight
        // .why pinned rather than fixed = a log read-back is a call `F23` reserves; like
        //    `F16` and `F21`, the accepted behavior is pinned so a change is deliberate
        // .how it bites = it chains the shim's REAL `submitted` into the outcome map
        //    `setStoneBrain` applies and renders it; a build that reads the log back flips it
        //    to a halt and goes red
        then(
          'and the render it feeds is UNCONFIRMED, never a halt — the log is unread',
          () => {
            // the mapping `setStoneBrain` applies, verbatim: `submitted` alone decides
            const outcome: StoneBrainOutcome = scene.result.submitted
              ? {
                  outcome: 'requested',
                  brain: 'opus',
                  effort: null,
                  guard: '/r/5.1.execution.guard',
                  reviewers: [],
                }
              : {
                  outcome: 'undispatched',
                  brain: 'opus',
                  effort: null,
                  guard: '/r/5.1.execution.guard',
                  cause: 'spawn-failed',
                };

            const rendered = formatStoneBrainOutcome({
              route: '/r',
              stone: '5.1.execution',
              outcome,
              drive: '🦉 where were we?',
            });

            expect(outcome.outcome).toEqual('requested');
            // .why EQUALITY = a `requested` outcome adds no surface; its brain rides the
            //    `where do we go?` line. a halt REPLACES the body, a request leaves it
            expect(rendered).toEqual('🦉 where were we?');
          },
        );
      });
    },
  );

  // the REAL shipped binary: proves the real cli accepts this arg vector
  // .why = every other row drives an inert shim; an unaddressable target makes the real
  //        binary refuse before delivery, with no credential, clone, or 15s poll:
  //
  //      $ rhx clone say @:nonexistent-xyz-test --what '/model opus'
  //      exit 2
  //      ✋ ConstraintError: no clone answers to '@:nonexistent-xyz-test'
  given(
    'the REAL shipped rhx binary, dispatched at an unaddressable clone',
    () => {
      when(
        '[t0] a switch is submitted against an address no clone answers to',
        () => {
          const scene = useThen('the child runs to completion', async () => {
            const repoRoot = await getRepoRootWithFallback({
              from: __dirname,
            });
            const rhx = path.join(repoRoot, 'node_modules', '.bin', 'rhx');
            const reachable = await fs
              .access(rhx)
              .then(() => true)
              .catch(() => false);
            if (!reachable)
              throw new Error(
                `the shipped rhachet binary is absent at ${rhx}, so the real contract ` +
                  'cannot be exercised and a pass would be a false green. fix: run ' +
                  '`npm ci`, then re-run this suite.',
              );

            const dir = genTempDir({ slug: 'dispatch-real-binary' });
            const result = dispatchBrainSwitch({
              rhx,
              repoRoot: dir,
              address: 'nonexistent-xyz-test',
              brain: 'opus',
              effort: null,
            });
            // the child is detached, so its stderr write lands after this call returns.
            // poll the log rather than sleep a fixed span — bounded, and it cannot pass
            // on an empty file.
            const logPath = path.join(
              dir,
              '.log',
              'bhrain',
              'brain',
              'apply.log',
            );
            const log = await (async () => {
              for (let attempt = 0; attempt < 500; attempt += 1) {
                const text = await fs
                  .readFile(logPath, 'utf-8')
                  .catch(() => '');
                if (text.length > 0) return text;
                await new Promise((settle) => setTimeout(settle, 40));
              }
              return '';
            })();
            return { result, log };
          });

          then(
            'submitted is TRUE — the real binary forked and exec’d (launch, never delivery)',
            () => {
              expect(scene.result.submitted).toEqual(true);
            },
          );

          then(
            'the real binary’s own refusal is CAPTURED, verbatim, in the engine-owned log',
            () => {
              expect(scene.log).toContain(
                "ConstraintError: no clone answers to '@:nonexistent-xyz-test'",
              );
            },
          );
        },
      );
    },
  );

  // a chatty, SUCCESSFUL say leaves the diagnostic log untouched
  // .why = the log is append-only and dispatch runs per tick; fed by success, it would
  //        grow without bound
  given('a real rhx shim that SUCCEEDS and is chatty on stdout', () => {
    when('a switch is dispatched at the shim', () => {
      const scene = useThen('the child runs to completion', async () => {
        const dir = genTempDir({ slug: 'dispatch-chatty' });
        const binDir = path.join(dir, 'node_modules', '.bin');
        await fs.mkdir(binDir, { recursive: true });
        const shim = path.join(binDir, 'rhx');
        // .why a DONE MARKER = a poll cannot prove an absence; the marker is the child's
        //    last act, so its presence proves the write window closed. without it, a child
        //    that never ran would read as a clean pass
        const donePath = path.join(dir, 'chatty.done');
        await fs.writeFile(
          shim,
          '#!/bin/sh\necho "delivered: true"\necho "🗿 said into @:be3e7529"\n' +
            `touch "${donePath}"\nexit 0\n`,
        );
        await fs.chmod(shim, 0o755);
        const result = dispatchBrainSwitch({
          rhx: shim,
          repoRoot: dir,
          address: 'be3e7529',
          brain: 'opus',
          effort: null,
        });
        // the child is detached, so poll ITS OWN marker on the same 50 × 20ms cadence the
        // failure-arm clamp uses. an empty read after the marker is the ASSERTION.
        const logPath = path.join(dir, '.log', 'bhrain', 'brain', 'apply.log');
        const done = await (async () => {
          for (let attempt = 0; attempt < 50; attempt += 1) {
            const seen = await fs
              .access(donePath)
              .then(() => true)
              .catch(() => false);
            if (seen) return true;
            await new Promise((settle) => setTimeout(settle, 20));
          }
          return false;
        })();
        const log = await fs.readFile(logPath, 'utf-8').catch(() => '');
        return { done, result, log };
      });

      then('submitted is TRUE — the launch bit is unchanged', () => {
        expect(scene.result.submitted).toEqual(true);
      });

      then('the child RAN to completion — its own marker is on disk', () => {
        // 🔴 asserted BEFORE the empty read. a child that never launched also leaves an
        //    empty log, so the row below would go green on a broken shim — a clamp that
        //    passes hardest when the event it measures did not occur at all
        //    (`rule.forbid.failhide`)
        expect(scene.done).toEqual(true);
      });

      then(
        'the diagnostic log holds NAUGHT — a success writes no transcript',
        () => {
          expect(scene.log).toEqual('');
        },
      );
    });
  });

  // the log fd does not leak on the FAILURE arm: a failed spawn forks no child to inherit it,
  // and this arm runs per tick while a stone is parked. its twin below covers success; one
  // unconditional close in `dispatchBrainSwitch.ts` holds both
  // .how it bites = posix `open` returns the LOWEST free fd, so a probe fd after N failed
  //    dispatches equals the one before only if all N were released
  // 🔴 .note = that posix rule is asserted as a precondition, so a host that breaks it
  //    throws rather than earns a false green
  // .note = the waits poll the breadcrumb count (one line per failed dispatch), never a
  //    fixed span, which would price a machine rather than an event
  given(
    'a spawn that FAILS, repeated — the fd handoff has no inheritor',
    () => {
      when('five switches are dispatched at a non-existent binary path', () => {
        const scene = useThen(
          'every call returns without a throw',
          async () => {
            // the measurement rests on posix `open` semantics — assert it, never assume it
            if (process.platform === 'win32')
              throw new Error(
                'this clamp measures the LOWEST-free-descriptor rule posix `open` guarantees; ' +
                  'no equivalent holds here, so the two fd reads are incomparable. ' +
                  'fix: run this suite on a posix host.',
              );

            const dir = genTempDir({ slug: 'dispatch-fd-leak' });
            const probe = path.join(dir, 'probe.txt');
            await fs.writeFile(probe, 'probe\n');
            const logPath = path.join(
              dir,
              '.log',
              'bhrain',
              'brain',
              'apply.log',
            );

            // wait on the EVENT, never on a span: each failed dispatch appends one
            // breadcrumb line, so the count is what says the `error` handlers have run
            const awaitBreadcrumbs = async (count: number): Promise<void> => {
              const deadline = Date.now() + 5_000;
              for (;;) {
                const text = await fs
                  .readFile(logPath, 'utf-8')
                  .catch(() => '');
                const lines = text.split('\n').filter((line) => line !== '');
                if (lines.length >= count) return;
                if (Date.now() > deadline)
                  throw new Error(
                    `awaited ${count} spawn-failure breadcrumbs at ${logPath}; ` +
                      `read ${lines.length} before the 5s cap. ` +
                      'fix: read the log by hand — a count that never arrives means the ' +
                      '`error` handler did not run, and the fd measurement below would be ' +
                      'a false green.',
                  );
                await new Promise((settle) => setTimeout(settle, 25));
              }
            };

            // the log must already exist, so the probe below is not what creates its
            // directory — that write would itself move the fd floor
            dispatchBrainSwitch({
              rhx: path.join(dir, 'node_modules', '.bin', 'rhx'),
              repoRoot: dir,
              address: 'be3e7529',
              brain: 'opus',
              effort: null,
            });
            await awaitBreadcrumbs(1);

            const getFdFloor = async (): Promise<number> => {
              const handle = await fs.open(probe, 'r');
              const fd = handle.fd;
              await handle.close();
              return fd;
            };

            const floorBefore = await getFdFloor();
            for (let n = 0; n < 5; n += 1)
              dispatchBrainSwitch({
                rhx: path.join(dir, 'node_modules', '.bin', 'rhx'),
                repoRoot: dir,
                address: 'be3e7529',
                brain: 'opus',
                effort: null,
              });
            // all six breadcrumbs — the one above, plus these five
            await awaitBreadcrumbs(6);
            const floorAfter = await getFdFloor();

            return { floorBefore, floorAfter };
          },
        );

        then('the fd floor is UNMOVED — no descriptor was left open', () => {
          expect(scene.floorAfter).toEqual(scene.floorBefore);
        });
      });
    },
  );

  // the log fd does not leak on the SUCCESS arm, which fires on every session boot
  // .note = no poll: the close is synchronous after `spawn`, so once `dispatchBrainSwitch`
  //         returns the fd is released or it is not; a poll would wait on no event
  given(
    'a real rhx shim that SUCCEEDS, repeated — the parent still owns its handoff fd',
    () => {
      when('five switches are dispatched at a shim that exits 0', () => {
        const scene = useThen(
          'every call returns without a throw',
          async () => {
            // the same posix precondition its twin asserts — never assumed
            if (process.platform === 'win32')
              throw new Error(
                'this clamp measures the LOWEST-free-descriptor rule posix `open` guarantees; ' +
                  'no equivalent holds here, so the two fd reads are incomparable. ' +
                  'fix: run this suite on a posix host.',
              );

            const dir = genTempDir({ slug: 'dispatch-fd-leak-success' });
            const probe = path.join(dir, 'probe.txt');
            await fs.writeFile(probe, 'probe\n');

            // an inert shim that LAUNCHES and exits 0 — so a child really is forked, which
            // is the whole difference from the failure clamp above
            const binDir = path.join(dir, 'node_modules', '.bin');
            await fs.mkdir(binDir, { recursive: true });
            const shim = path.join(binDir, 'rhx');
            await fs.writeFile(shim, '#!/bin/sh\nexit 0\n');
            await fs.chmod(shim, 0o755);

            // one warm-up dispatch, so the log's own directory already exists — that mkdir
            // would otherwise move the fd floor between the two reads
            dispatchBrainSwitch({
              rhx: shim,
              repoRoot: dir,
              address: 'be3e7529',
              brain: 'opus',
              effort: null,
            });

            const getFdFloor = async (): Promise<number> => {
              const handle = await fs.open(probe, 'r');
              const fd = handle.fd;
              await handle.close();
              return fd;
            };

            const floorBefore = await getFdFloor();
            for (let n = 0; n < 5; n += 1)
              dispatchBrainSwitch({
                rhx: shim,
                repoRoot: dir,
                address: 'be3e7529',
                brain: 'opus',
                effort: null,
              });
            const floorAfter = await getFdFloor();

            return { floorBefore, floorAfter };
          },
        );

        then('the fd floor is UNMOVED — the parent released its copy', () => {
          // a leak shows as floorBefore + 5: one fd per successful dispatch, held by the
          // parent after the child took its own dup
          expect(scene.floorAfter).toEqual(scene.floorBefore);
        });
      });
    },
  );

  /**
   * 🔴 .what = the FAN-OUT, per declared variant — which says reach the wire, and with what
   * .why = the cases above hold `effort: null`, so none reaches the second say; `/model`
   *        and `/effort` are two commands, and the commands must be proven, not only
   *        `submitted` (`rule.require.contract-snapshot-exhaustiveness`)
   *
   * .how = a recorder shim appends its `--what` to a file; the children are detached, so
   *        the read POLLS (case=5)
   */

  given('a recorder shim that captures each say`s --what', () => {
    /**
     * .what = dispatches into a shim that logs its `--what`, then reads the says back
     * .why = a deadline rather than a fixed sleep: a sleep long enough for a slow host is
     *        a sleep every fast host pays in full, on every row
     */
    const genSaysDispatched = async (input: {
      slug: string;
      brain: string | null;
      effort: string | null;
      expect: number;
    }): Promise<{ says: string[] }> => {
      const dir = genTempDir({ slug: input.slug });
      const binDir = path.join(dir, 'node_modules', '.bin');
      await fs.mkdir(binDir, { recursive: true });
      const says = path.join(dir, 'says.txt');
      const shim = path.join(binDir, 'rhx');

      // .note = it walks argv for `--what` rather than takes `$6`, so a later change to the
      //         argument ORDER turns the assert red instead of silently records the wrong
      //         token. the shim is the instrument, and an instrument that reads by position
      //         measures the position rather than the contract
      await fs.writeFile(
        shim,
        [
          '#!/bin/sh',
          'while [ $# -gt 0 ]; do',
          '  if [ "$1" = "--what" ]; then printf "%s\\n" "$2" >> ' +
            JSON.stringify(says),
          '  fi',
          '  shift',
          'done',
          'exit 0',
        ].join('\n'),
      );
      await fs.chmod(shim, 0o755);

      dispatchBrainSwitch({
        rhx: shim,
        repoRoot: dir,
        address: 'be3e7529',
        brain: input.brain,
        effort: input.effort,
      });

      // poll to a deadline — the children are detached, so no handle exists to await
      const deadline = Date.now() + 15_000;
      for (;;) {
        const text = await fs.readFile(says, 'utf-8').catch(() => '');
        const lines = text.split('\n').filter((line) => line.length > 0);
        if (lines.length >= input.expect) return { says: lines };
        if (Date.now() > deadline) return { says: lines };
        await new Promise((next) => setTimeout(next, 100));
      }
    };

    when('[t0] a CHOICE alone is dispatched', () => {
      const scene = useThen('the shim records', async () =>
        genSaysDispatched({
          slug: 'dispatch-says-choice',
          brain: 'opus[1m]',
          effort: null,
          expect: 1,
        }),
      );

      then('exactly ONE say lands, and it is the /model', () => {
        // 🔴 .why = the count is half the claim. a build that dispatched `/effort ` with an
        //          empty argument would still put `/model opus[1m]` on the wire, so an
        //          assert on the first line alone would pass over a second, malformed say
        expect(scene.says).toEqual(['/model opus[1m]']);
      });
    });

    when('[t1] BOTH axes are dispatched', () => {
      const scene = useThen('the shim records', async () =>
        genSaysDispatched({
          slug: 'dispatch-says-both',
          brain: 'opus[1m]',
          effort: 'medium',
          expect: 2,
        }),
      );

      then('TWO says land, one per slash command', () => {
        // .why = the value rides VERBATIM into each command, so a map or an escape applied
        //        on the way would show here. `opus[1m]` carries brackets a shell would
        //        glob, which is why the argument is passed as its own argv slot (F10)
        //
        // .note = SORTED, because the two says race to connect (F29) — the order on the
        //         wire is not this operation's to guarantee, so an ordered assert here
        //         would pin a property the code does not claim and flake on the host
        expect([...scene.says].sort()).toEqual([
          '/effort medium',
          '/model opus[1m]',
        ]);
      });

      then('neither say carries the other`s argument', () => {
        // 🔴 .why = the fusion the brain-cli refuses. `/model opus[1m] --effort medium` and
        //          `/model opus[1m]\n/effort medium` are each ONE say that a reader would
        //          take for two, and the second is what rhachet's bracketed-paste frame
        //          would produce from a multi-line `--what` (`asCloneDispatchFrame`)
        expect(scene.says.some((say) => say.includes('\n'))).toEqual(false);
        expect(
          scene.says.some(
            (say) => say.includes('model') && say.includes('effort'),
          ),
        ).toEqual(false);
      });
    });

    when('[t2] an EFFORT alone is dispatched', () => {
      const scene = useThen('the shim records', async () =>
        genSaysDispatched({
          slug: 'dispatch-says-effort',
          brain: null,
          effort: 'medium',
          expect: 1,
        }),
      );

      then('exactly ONE say lands, and NO /model is sent', () => {
        // 🔴 .why = the variant-3 clamp at the wire. a null choice must send no `/model` at
        //          all — a `/model null` or a `/model ` would switch the driver off the
        //          brain it runs, which is the one thing an effort-only prescription is
        //          written to avoid ("omit the choice" — the wisher, verbatim)
        expect(scene.says).toEqual(['/effort medium']);
      });
    });
  });
});

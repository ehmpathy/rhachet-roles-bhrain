import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';
import { promisify } from 'util';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { asCloneAddress } from './asCloneAddress';
import { getCloneAddress, WHOAMI_TIMEOUT_MS } from './getCloneAddress';

const execFileAsync = promisify(execFile);

/**
 * .what = writes an executable stand-in for the `rhx` binary, and returns its path
 * .why = `getCloneAddress` owns a spawn, an exit-code taxonomy, and a cap. every one
 *        of those is a property of a REAL child, so a stubbed function would verify the
 *        stub. an executable on disk is the smallest thing that exercises the operation's
 *        actual contract (`rule.forbid.unit.remote-boundaries` — hence integration)
 *
 * .note = it takes a node program rather than a shell one, so the same file runs
 *         wherever node does and no shell builtin is assumed
 */
const genFakeRhx = async (input: {
  slug: string;
  program: string;
}): Promise<{ rhx: string; repoRoot: string }> => {
  const repoRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), `clone-addr-${input.slug}-`),
  );
  const rhx = path.join(repoRoot, 'rhx');
  await fs.writeFile(
    rhx,
    ['#!/usr/bin/env node', '', input.program, ''].join('\n'),
    'utf-8',
  );
  await fs.chmod(rhx, 0o755);
  return { rhx, repoRoot };
};

describe('getCloneAddress.integration', () => {
  given('[case1] a probe that answers with a usable address', () => {
    when('[t0] the payload carries a slug', () => {
      const read = useBeforeAll(async () => {
        const fake = await genFakeRhx({
          slug: 'ok',
          program: `console.log(JSON.stringify({ slug: 'driver', reachState: 'LIVE' }));`,
        });
        return getCloneAddress(fake);
      });

      then('the address comes back, and no cause is set', () => {
        expect(read.address).toEqual('driver');
        expect(read.cause).toBeUndefined();
      });
    });

    when('[t1] the payload carries a serial and a NULL slug', () => {
      // 🔴 .why = the measured live shape, 2026-09-13: an enrolled clone routinely
      //          reports `{ serial: "8841…", slug: null }`. the serial fallback is
      //          load-bearing rather than defensive, so it is clamped end to end here
      //          and not only at the transformer's own unit grain
      const read = useBeforeAll(async () => {
        const fake = await genFakeRhx({
          slug: 'serial',
          program: `console.log(JSON.stringify({ serial: '88412066-aaaa', slug: null }));`,
        });
        return getCloneAddress(fake);
      });

      then('the serial is the address', () => {
        expect(read.address).toEqual('88412066-aaaa');
      });
    });
  });

  given('[case2] a probe that exits 2 — the unenrolled constraint', () => {
    when('[t0] the address is read', () => {
      const read = useBeforeAll(async () => {
        const fake = await genFakeRhx({
          slug: 'exit2',
          program: `process.exit(2);`,
        });
        return getCloneAddress(fake);
      });

      then('the cause is `unenrolled`, never a malfunction word', () => {
        // 🔴 .why = exit 2 is a CONSTRAINT the caller owns, and it is the overwhelmingly
        //          common case (F-a, measured). a halt that named a malfunction here
        //          would offer "run the probe by hand" to the one reader whose actual
        //          remedy is `rhx enroll` (`rule.require.exit-code-semantics`)
        expect(read.address).toEqual(null);
        expect(read.cause).toEqual('unenrolled');
      });
    });
  });

  given('[case3] a probe that exits 0 and writes text that is not json', () => {
    when('[t0] the address is read', () => {
      const read = useBeforeAll(async () => {
        const fake = await genFakeRhx({
          slug: 'garbage',
          program: `console.log('not json at all');`,
        });
        return getCloneAddress(fake);
      });

      then(
        'the cause is `unreadable-payload`, not `unreadable-address`',
        () => {
          // 🔴 .why = a clean exit beside unreadable output says the INSTRUMENT broke; a
          //          clean parse with no address says the payload SHAPE moved. the two
          //          send a reader to two different places, and a bare catch fused them
          //          (`rule.forbid.failhide`)
          expect(read.cause).toEqual('unreadable-payload');
        },
      );
    });
  });

  given('[case4] a probe that exits 0 with json that holds no address', () => {
    when('[t0] the address is read', () => {
      const read = useBeforeAll(async () => {
        const fake = await genFakeRhx({
          slug: 'shapeless',
          program: `console.log(JSON.stringify({ reachState: 'LIVE' }));`,
        });
        return getCloneAddress(fake);
      });

      then('the cause is `unreadable-address`', () => {
        expect(read.cause).toEqual('unreadable-address');
      });
    });
  });

  given('[case5] a probe that shuts its stdout and then LINGERS', () => {
    /**
     * .what = a probe that closes stdout and outlives the cap
     * .why = with no `data` listener to hold the await, only the (ref'd) timer settles it
     *
     * .note = jest keeps the loop alive, so the REF half is unobservable here; this clamps
     *         that such a child settles inside the cap and reports the CAP
     */
    when('[t0] the address is read', () => {
      const read = useBeforeAll(async () => {
        const fake = await genFakeRhx({
          slug: 'lingerer',
          program: [
            // shut stdout at once, so no `data` listener holds the await open
            `process.stdout.end();`,
            // then outlive the cap by a wide margin
            `setTimeout(() => process.exit(0), 30_000);`,
          ].join('\n'),
        });
        const began = Date.now();
        const result = await getCloneAddress(fake);
        return { result, took: Date.now() - began };
      });

      then('it settles, rather than hanging forever', () => {
        expect(read.result.address).toEqual(null);
      });

      then('the cause is `timed-out` — the CAP, never a diagnosis', () => {
        // .why = the timer settles first; a cap knows one fact — the probe outlived it —
        //        and a richer diagnosis would hand a slow probe the wrong fix
        expect(read.result.cause).toEqual('timed-out');
      });

      then('it settles INSIDE the driver hook budget', () => {
        // .why = the whole point of the cap is that this returns with room for the dispatch
        //        and the render that follow it
        //
        // .note = derived from the cap rather than hardcoded at 4_000, and doubled for
        //         wall-clock slack on a loaded host. the cap-vs-budget bind this once
        //         asserted in PROSE is `[case8]`'s, which reads the budget off disk
        expect(read.took).toBeLessThan(WHOAMI_TIMEOUT_MS * 2);
      });
    });
  });

  given('[case6] the rhx binary is ABSENT — the spawn cannot launch', () => {
    /**
     * .what = the one case that reaches `child.on('error', …)` rather than `close`
     * .why = that listener owns the `unreadable-clone` cause on a non-exit fault and the
     *        `noteCause` write; `dispatchBrainSwitch` clamps the same shape for its spawn
     */
    when('[t0] the address is read at a path that does not exist', () => {
      const read = useBeforeAll(async () => {
        const repoRoot = await fs.mkdtemp(
          path.join(os.tmpdir(), 'clone-addr-absent-'),
        );
        // no binary written — the path does not exist, so the fork fails with ENOENT
        const result = await getCloneAddress({
          rhx: path.join(repoRoot, 'node_modules', '.bin', 'rhx'),
          repoRoot,
        });
        const log = await fs
          .readFile(
            path.join(repoRoot, '.log', 'bhrain', 'brain', 'apply.log'),
            'utf-8',
          )
          .catch(() => '');
        return { result, log };
      });

      then('the cause is `unreadable-clone` — the instrument broke', () => {
        // .why = a spawn that never launched is not a constraint the caller can fix with
        //        `rhx enroll`, so it must NOT read as `unenrolled`. exit 2 is the caller's;
        //        a fault with no exit code at all is the instrument's
        expect(read.result.address).toEqual(null);
        expect(read.result.cause).toEqual('unreadable-clone');
      });

      then('the error INSTANCE is captured in the engine-owned log', () => {
        // 🔴 .why = the CAUSE names the class and the error object names the instance.
        //          `unreadable-clone` covers an ENOENT and an EACCES alike, and each takes
        //          a different remedy — so without this line a debugger's only move is to
        //          re-run the probe by hand and hope it fails the same way
        expect(read.log).toContain('getCloneAddress:');
        expect(read.log).toContain('ENOENT');
      });
    });
  });

  given('[case7] the engine-owned log cannot be opened', () => {
    /**
     * .what = a diagnostic log that cannot be written changes no outcome
     * .why = `genBrainApplyLog`'s `catch { return null }` is the one allowed degradation;
     *        the log is a breadcrumb, and no caller may branch on it (`rule.forbid.failhide`)
     *
     * .note = forced with a real FILE where the log expects a DIRECTORY (ENOTDIR), no mock
     */
    when('[t0] a FILE sits where the log directory must go', () => {
      const read = useBeforeAll(async () => {
        const fake = await genFakeRhx({
          slug: 'logless',
          program: `console.log('not json at all');`,
        });
        // seed `.log/bhrain/brain` as a file, so the mkdir below it cannot succeed
        await fs.mkdir(path.join(fake.repoRoot, '.log', 'bhrain'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(fake.repoRoot, '.log', 'bhrain', 'brain'),
          'i am a file, not a directory',
          'utf-8',
        );
        return getCloneAddress(fake);
      });

      then('the real signal is unaffected — the cause still lands', () => {
        expect(read.address).toEqual(null);
        expect(read.cause).toEqual('unreadable-payload');
      });
    });
  });

  given(
    '[case8] the probe cap, against the hook budget it claims to fit inside',
    () => {
      /**
       * .what = `WHOAMI_TIMEOUT_MS` fits inside the `route.drive` hook budgets, read OFF DISK
       * .why = the two numbers live in two files; a raised cap or a dropped hook `timeout`
       *        would drift apart with no red suite
       *
       * .note = binds to the `route.drive` sites alone: the probe runs inside `route.drive`,
       *         so another hook's budget says naught about it
       */
      when(
        '[t0] every `route.drive` hook site is read from the settings',
        () => {
          const budget = useBeforeAll(async () => {
            const repoRoot = await getRepoRootWithFallback({ from: __dirname });
            const file = path.join(repoRoot, '.claude', 'settings.json');
            // .why GUARDED = an absent or malformed settings file is a drift this case
            //    catches; a raw ENOENT here would kill the case before the row that names
            //    the fix (`rule.require.failloud`)
            const settings = await fs
              .readFile(file, 'utf-8')
              .then(
                (source) =>
                  JSON.parse(source) as {
                    hooks: Record<
                      string,
                      { hooks: { command: string; timeout?: number }[] }[]
                    >;
                  },
              )
              .catch(() => null);
            const timeouts = Object.values(settings?.hooks ?? {})
              .flat()
              .flatMap((matcher) => matcher.hooks)
              .filter((site) => site.command.includes('route.drive'))
              .map((site) => site.timeout);
            return { file, settings, timeouts };
          });

          then('the settings declare at least one such site', () => {
            // 🔴 .why = `Math.min()` over an empty set is `Infinity`, so a clamp that skipped
            //          this check would PASS on a settings file that renamed the hook away —
            //          a green clamp over a set it never found (`rule.forbid.failhide`)
            // .why `BadRequestError` = this repo's `helpful-errors` exports no
            //      `ConstraintError`; this is its caller-must-fix peer, with metadata
            if (budget.settings === null)
              throw new BadRequestError(
                'the claude hook settings could not be read or parsed',
                {
                  expected: budget.file,
                  hint: 'restore `.claude/settings.json` (rhx roles boot re-stamps it). this case binds WHOAMI_TIMEOUT_MS to the `route.drive` hook timeouts declared there, so an absent file leaves the probe cap unbound rather than merely untested',
                },
              );
            expect(budget.timeouts.length).toBeGreaterThan(0);
          });

          then('every one of them declares its own timeout', () => {
            // an absent `timeout` is the brain-cli's default, never a number this repo
            // declared — so the clamp may not quietly read one as unbounded
            expect(
              budget.timeouts.every((each) => typeof each === 'number'),
            ).toEqual(true);
          });

          then('the probe cap is strictly under the smallest of them', () => {
            const smallestMs =
              Math.min(...(budget.timeouts as number[])) * 1_000;
            expect(WHOAMI_TIMEOUT_MS).toBeLessThan(smallestMs);
          });

          then(
            'it leaves more budget than it takes — the split its header declares',
            () => {
              // 🔴 the header says "the rest of the budget is owed to the dispatch and the
              //    render". that is a stronger claim than "under the cap", and it is the one
              //    that matters: a probe permitted 24.9s of a 25s budget fits, and starves
              //    every act after it
              const smallestMs =
                Math.min(...(budget.timeouts as number[])) * 1_000;
              expect(smallestMs - WHOAMI_TIMEOUT_MS).toBeGreaterThan(
                WHOAMI_TIMEOUT_MS,
              );
            },
          );
        },
      );
    },
  );

  given('[case9] a probe TERMINATED by a signal, well under the cap', () => {
    /**
     * .what = a probe ENDED by a signal reports `killed`
     * .why = node reports `code === null` on a signal; the catch-all would hand a
     *        broken-instrument remedy to a probe an outside party ended
     *
     * .note = the cap's own kill settles `timed-out` first, so this branch is reachable by
     *         an EXTERNAL kill alone, and must not borrow the cap's word
     * .note = the second row clamps cap-vs-kill only; the first row is the one that goes
     *         red on the fused verdict (`rule.require.clamp-edge-cases`)
     */
    when('[t0] the address is read', () => {
      const read = useBeforeAll(async () => {
        if (process.platform === 'win32')
          throw new Error(
            'this clamp needs a posix signal death, which windows reports as an exit ' +
              'code rather than as `code === null`. so the branch under test is ' +
              'unreachable here and a pass would be a false green. ' +
              'fix: run this suite on a posix host.',
          );
        const fake = await genFakeRhx({
          slug: 'killed',
          program: `process.kill(process.pid, 'SIGTERM');`,
        });
        return getCloneAddress(fake);
      });

      then('the cause is `killed`, never a malfunction word', () => {
        expect(read.address).toEqual(null);
        expect(read.cause).toEqual('killed');
      });

      then('it settled well under the cap, so it is not the timer', () => {
        // the assert that parts this from `timed-out`: a self-kill returns at once, so a
        // `killed` verdict here proves the BRANCH ran rather than the 2s timer
        expect(read.cause).not.toEqual('timed-out');
      });
    });
  });

  given(
    '[case11] a DEAF clone, against a LIVE one — the accepted blind spot',
    () => {
      /**
       * 🔴 .what = an INDISTINGUISHABILITY: an enrolled-but-DEAF clone reads exactly as a
       *          healthy one, because `getCloneAddress` ignores `reachState`
       * .why kept = `reachState` is rhachet's closed set; a gate here would refuse a state
       *        rhachet adds later. deferred to
       *        `.dream/v2026_09_14.feat.a-deaf-clone-halts-with-the-wrong-fix-line.md`
       * .why clamped = the two readers owe different remedies; a GREEN means still blind on
       *        purpose, a RED means the blind spot closed and the dream is owed an update
       */
      when('[t0] one probe reports LIVE and its twin reports DEAF', () => {
        const reads = useBeforeAll(async () => {
          const asRead = async (reachState: string) => {
            const fake = await genFakeRhx({
              slug: `reach-${reachState.toLowerCase()}`,
              program: `console.log(JSON.stringify({ serial: '3f2a91c7-beef', slug: null, reachState: '${reachState}' }));`,
            });
            return getCloneAddress(fake);
          };
          return { live: await asRead('LIVE'), deaf: await asRead('DEAF') };
        });

        then(
          'the deaf read is a usable address, exactly as the live one is',
          () => {
            // 🔴 the deaf clone walks the HAPPY path. that is the blind spot, stated as an
            //    assertion rather than as prose a reader may skip
            expect(reads.deaf.address).toEqual('3f2a91c7-beef');
            expect(reads.deaf.cause).toBeUndefined();
          },
        );

        then('the two reads are byte-identical — no field parts them', () => {
          // 🔴 a serialized compare, never a field-by-field one: a future build that parts
          //    the two by ADDING a field would leave a field-by-field assert green, which
          //    is the one drift this row exists to catch
          expect(JSON.stringify(reads.deaf)).toEqual(
            JSON.stringify(reads.live),
          );
        });
      });
    },
  );

  given('[case10] the REAL rhachet binary, against the REAL contract', () => {
    /**
     * .what = the SHIPPED `rhx` binary's `clone whoami` payload is one `asCloneAddress` reads
     * .why = every other case drives a fake; only the real binary proves the contract. a
     *        rhachet rename of `serial`/`slug` still exits 0, so it lands RED here as
     *        `unreadable-address` rather than silently in a live drive
     *
     * .note = deterministic across hosts: each admissible read carries its own assertions
     *           enrolled   → a trimmed, non-empty address, no cause
     *           unenrolled → `address === null`, `cause === 'unenrolled'`
     *           overrun    → `address === null`, `cause === 'timed-out'`, `took >= cap`
     *         neither arm is a skip (`rule.forbid.failhide`)
     *
     * 🔴 .note = the cap asserts the BOUND (`took < 2×cap`), never the host's speed: in a
     *           parallel run the real probe measured 2032ms against a 2000ms cap, a grade
     *           of the scheduler. the cost: a genuinely slow `whoami` lands on the overrun
     *           arm and stays green; the repair is
     *           `.dream/v2026_09_18.fix.the-real-whoami-probe-shares-a-jest-worker.md`
     *
     * .note = an enrolled clone reports `slug: null` with a `serial`, so the `serial`
     *         fallback in `asCloneAddress` carries the real contract
     */
    when('[t0] the address is read from the shipped binary', () => {
      const read = useBeforeAll(async () => {
        const repoRoot = await getRepoRootWithFallback({ from: __dirname });
        const rhx = path.join(repoRoot, 'node_modules', '.bin', 'rhx');
        const reachable = await fs
          .access(rhx)
          .then(() => true)
          .catch(() => false);
        if (!reachable)
          throw new Error(
            `the shipped rhachet binary is absent at ${rhx}, so the real contract cannot ` +
              'be exercised and a pass would be a false green. fix: run `npm ci`, then ' +
              're-run this suite.',
          );
        // 🔴 the elapsed is measured, so a RED here names a NUMBER rather than a word.
        //    `timed-out` alone cannot part "the cap is too tight for the real binary" from
        //    "this worker was loaded" — and those two take opposite repairs
        //    (`rule.require.errors-name-the-fix`)
        const began = Date.now();
        const result = await getCloneAddress({ rhx, repoRoot });
        const took = Date.now() - began;

        // .why a SECOND spawn = the checks below assert exclusion; this raw payload off the
        //    same binary lets the enrolled arm assert the VALUE itself
        // .note = it may race an enroll mid-run, so it is evidence for the enrolled arm alone
        const rawPayload: unknown = await (async () => {
          try {
            const { stdout } = await execFileAsync(rhx, [
              'clone',
              'whoami',
              '--output',
              'json',
            ]);
            return JSON.parse(stdout);
          } catch {
            // the raw probe can exit non-zero (unenrolled) or emit prose on stderr — either
            // way there is no payload to cross-check, and the arm below skips accordingly
            return null;
          }
        })();

        return { ...result, took, rawPayload };
      });

      then('it never renders a malfunction — the rename clamp', () => {
        // 🔴 each of these four means the binary answered in a shape `asCloneAddress` could
        //    not read, which is precisely what a rename or a contract move looks like
        expect(read.cause).not.toEqual('unreadable-clone');
        expect(read.cause).not.toEqual('unreadable-payload');
        expect(read.cause).not.toEqual('unreadable-address');
        expect(read.cause).not.toEqual('spawn-failed');
      });

      then(
        'the cap BOUNDS the await — the probe settles, it never runs away',
        () => {
          // .why = this clamps the BOUND, never the host's speed: the cap settles at
          //    `WHOAMI_TIMEOUT_MS`, so a settle far past it means the timer held the hook's
          //    event loop — the one failure the drive cannot survive
          expect(read.took).toBeLessThan(WHOAMI_TIMEOUT_MS * 2);

          // 🔴 `killed` stays forbidden, and that is not the same word as the cap's own. the
          //    2s timer's `child.kill()` settles as `timed-out` FIRST, so `killed` can only
          //    mean an EXTERNAL kill — an instrument fault, never a designed path
          expect(read.cause).not.toEqual('killed');
        },
      );

      then('whichever arm ran, it is fully determined', () => {
        // ✅ THREE arms, each with its own assertions, and the rename clamp above forbids
        //    every other cause — so this branch is TOTAL, never a silent path
        //    (`rule.forbid.failhide`)
        const enrolled = read.address !== null;
        if (enrolled) {
          const address = read.address as string;
          expect(typeof address).toEqual('string');
          expect(address).toEqual(address.trim());
          expect(address.length).toBeGreaterThan(0);
          expect(read.cause).toEqual(undefined);

          // the POSITIVE check: `read.address` equals what `asCloneAddress` derives from the
          // independent raw payload, so an address read from the wrong field goes red
          if (read.rawPayload !== null) {
            expect(read.address).toEqual(
              asCloneAddress({ payload: read.rawPayload }),
            );
          }
        }

        // 🔴 the overrun arm — a DESIGNED render rather than a failure. it asserts the cap's
        //    OWN contract, so it verifies the path rather than excuses it: the address is
        //    null, and the elapsed reached the cap that produced the word
        if (!enrolled && read.cause === 'timed-out') {
          expect(read.address).toEqual(null);
          expect(read.took).toBeGreaterThanOrEqual(WHOAMI_TIMEOUT_MS);
        }

        // the common arm — ci runs with no `RHACHET_CLONE_SERIAL`, so the binary answers
        // its constraint well inside the cap
        if (!enrolled && read.cause !== 'timed-out') {
          expect(read.cause).toEqual('unenrolled');
          expect(read.took).toBeLessThan(WHOAMI_TIMEOUT_MS);
        }
      });
    });
  });
});

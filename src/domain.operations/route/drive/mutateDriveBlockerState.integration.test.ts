import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { WHOAMI_TIMEOUT_MS } from '../brain/getCloneAddress';
import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { DriveBlockerState } from './DriveBlocker';
import { getDriveBlockerState } from './getDriveBlockerState';
import { mutateDriveBlockerState } from './mutateDriveBlockerState';
import { setDriveBlockerState } from './setDriveBlockerState';
import { setDriveEntryStone } from './setDriveEntryStone';
import {
  LOCK_ACQUIRE_TIMEOUT_MS,
  withDriveStateLock,
} from './withDriveStateLock';

/**
 * .what = the lost-update clamp on `mutateDriveBlockerState`
 * .why = the atomic `rename` stops a torn read, not a lost update: two writers read one
 *        `before`, and the second rename discards the first's change. `withDriveStateLock`
 *        closes that. a lost `count` under-arms the 21-block cutoff; a lost `.stone` can
 *        suppress a due brain dispatch. neither leaves a trace
 *
 * .note = the lock, never the pid, makes the temp write safe against a same-process writer:
 *         `…json.<pid>.tmp` parts two processes, never two calls inside one
 * ✅ .teeth = bypass the lock and `[case1]`, `[case2]`, `[case4]` go red
 */
describe('mutateDriveBlockerState.integration', () => {
  given(
    '[case1] the two real writers mutate one route at the same time',
    () => {
      const tempDir = genTempDir({ slug: 'test-mutateDriveBlockerState-two' });

      when('[t0] a count increment and a stone mark run concurrently', () => {
        /**
         * 🔴 this is the EXACT pair the reviewer named: `setDriveBlockerState` increments
         *    `count` (and stamps `.stone`), `setDriveEntryStone` sets `.stone` and carries
         *    `count` through. both route through one non-atomic read-modify-write, so
         *    with no lock each reads `{ count: 0 }` and the later rename wins outright.
         */
        const state = useThen('both settle', async () => {
          await Promise.all([
            setDriveBlockerState({ route: tempDir, stone: 'alpha' }),
            setDriveEntryStone({
              route: tempDir,
              stone: 'beta',
              brain: 'opus',
              effort: null,
            }),
          ]);
          return await getDriveBlockerState({ route: tempDir });
        });

        then('the count increment survived', () => {
          // 🔴 the red row with no lock: `setDriveEntryStone` carries through the `count: 0`
          //    it read BEFORE the increment landed, so the cutoff silently re-arms to zero
          expect(state.count).toEqual(1);
        });

        then('a stone mark survived', () => {
          // either writer may win the `.stone` field — both are legitimate marks of the
          // same tick — so the clamp reads that ONE of them landed, never which
          expect(['alpha', 'beta']).toContain(state.stone);
        });
      });
    },
  );

  /**
   * .note = eight, not twenty. each contender's deadline starts with the race, so the last in
   *         line waits out every section ahead of it inside one `LOCK_ACQUIRE_TIMEOUT_MS`.
   *         twenty queued sections under full-suite disk load ran past 500ms and threw — a
   *         queue depth the hook never builds (it takes this lock at most twice per tick).
   *         eight still reads a lost update as a short count, and fits the deadline under load
   */
  const CONTENDERS = 8;

  given('[case2] many increments contend for one file', () => {
    const tempDir = genTempDir({ slug: 'test-mutateDriveBlockerState-many' });

    when('[t0] all of them run concurrently', () => {
      const state = useThen('they all settle', async () => {
        await Promise.all(
          Array.from({ length: CONTENDERS }, () =>
            setDriveBlockerState({ route: tempDir, stone: 'alpha' }),
          ),
        );
        return await getDriveBlockerState({ route: tempDir });
      });

      then('every one of them is counted', () => {
        // 🔴 the arithmetic IS the assert: N serialized increments read N, and any lost
        //    update reads fewer. with no lock this read 1 — every other write discarded
        expect(state.count).toEqual(CONTENDERS);
      });
    });
  });

  given('[case3] a critical section throws mid-hold', () => {
    const tempDir = genTempDir({ slug: 'test-mutateDriveBlockerState-throw' });

    when('[t0] the next writer acquires after the fault', () => {
      /**
       * 🔴 .why = the release lives in a `finally`, and a `finally` is exactly the branch a
       *          refactor drops without a red test. a dropped release wedges the route's
       *          state file FOREVER — every later mutate throws at the deadline — so this
       *          row is the difference between a lock and a one-shot latch
       */
      const outcome = useThen('the second write lands', async () => {
        const statePath = path.join(
          tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });

        const fault = await withDriveStateLock({
          statePath,
          critical: async () => {
            throw new Error('the section faulted');
          },
        }).catch((error: Error) => error);

        const after = await setDriveEntryStone({
          route: tempDir,
          stone: 'gamma',
          brain: 'opus',
          effort: null,
        });
        return { fault, after: after.state };
      });

      then('the fault surfaced rather than was swallowed', () => {
        expect(outcome.fault).toBeInstanceOf(Error);
        expect((outcome.fault as Error).message).toContain(
          'the section faulted',
        );
      });

      then('the lock was released, so the next writer got through', () => {
        expect(outcome.after.stone).toEqual('gamma');
      });

      then('no lock file was left behind', async () => {
        const left = await fs
          .readdir(path.join(tempDir, '.route'))
          .then((each) => each.filter((name) => name.endsWith('.lock')));
        expect(left).toEqual([]);
      });
    });
  });

  given('[case4] a lock already held by another writer', () => {
    const tempDir = genTempDir({ slug: 'test-mutateDriveBlockerState-held' });

    when('[t0] a second writer contends past the deadline', () => {
      /**
       * 🔴 .why = the ONE outcome this lock may never have is a quiet proceed. a contender
       *          that gave up and wrote anyway would restore the exact lost update the lock
       *          was built to close, and no assert above would notice
       *          (`rule.forbid.failhide`)
       */
      const fault = useThen('it fails rather than proceeds', async () => {
        const statePath = path.join(
          tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });

        // take the lock by hand and hold it for the whole contended window
        const held = await fs.open(`${statePath}.lock`, 'wx');
        const caught = await mutateDriveBlockerState({
          route: tempDir,
          project: () =>
            new DriveBlockerState({ count: 9, stone: 'delta', brain: null }),
        }).catch((error: unknown) => error);
        await held.close();
        await fs.unlink(`${statePath}.lock`);

        // .note = the facts are extracted HERE rather than asserted on `caught` itself.
        //         `useThen` hands back a Proxy that defers access, so an `instanceof` on it
        //         reads the proxy's own constructor and never the thrown value's
        return {
          threw: caught instanceof Error,
          message: caught instanceof Error ? caught.message : '',
        };
      });

      then('it threw', () => {
        expect(fault.threw).toEqual(true);
      });

      then('the error names the fix, with the path to remove', () => {
        expect(fault.message).toContain('drive-state lock');
        expect(fault.message).toContain('rm ');
        expect(fault.message).toContain('.drive.blockers.latest.json.lock');
      });

      then('it wrote no state past the lock it never held', async () => {
        // a fresh read: the refused write must not appear on disk
        const state = await getDriveBlockerState({ route: tempDir });
        expect(state.count).toEqual(0);
        expect(state.stone).toEqual(null);
      });
    });
  });

  given(
    '[case5] the acquire cap, against the hook budget it sits inside',
    () => {
      /**
       * 🔴 .why = `LOCK_ACQUIRE_TIMEOUT_MS` is a wait inside a driver hook, and one tick can
       *          take the lock TWICE (`setDriveEntryStone` then `setDriveBlockerState`). so
       *          the number that must fit the budget is 2 × the cap, plus the probe the same
       *          tick already spends — a claim about `.claude/settings.json`, a file neither
       *          operation opens. the clamp reads it off disk and binds the three numbers
       *
       * .note = it mirrors `getCloneAddress.integration.test.ts [case8]` deliberately: same
       *         budget, same hook sites, so a settings edit moves both clamps together
       */
      when(
        '[t0] every `route.drive` hook site is read from the settings',
        () => {
          const budget = useBeforeAll(async () => {
            const repoRoot = await getRepoRootWithFallback({ from: __dirname });
            const file = path.join(repoRoot, '.claude', 'settings.json');
            // .why guarded, verdict deferred = an absent or malformed settings file is a
            //    drift this case catches; a raw throw in `useBeforeAll` would kill the case
            //    before the row that names the repair (`rule.require.failloud`)
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
            // `Math.min()` over an empty set is `Infinity`, which would pass every row below
            // .why `BadRequestError` = this repo's `helpful-errors` exports no
            //      `ConstraintError`; this is its caller-must-fix peer, with metadata
            if (budget.settings === null)
              throw new BadRequestError(
                'the claude hook settings could not be read or parsed',
                {
                  expected: budget.file,
                  hint: 'restore `.claude/settings.json` (rhx roles boot re-stamps it). this case binds the lock acquire deadline to the `route.drive` hook timeouts declared there, so an absent file leaves the deadline unbound rather than merely untested',
                },
              );
            expect(budget.timeouts.length).toBeGreaterThan(0);
          });

          then(
            'two acquires plus the probe still fit the smallest budget',
            () => {
              const smallestMs =
                Math.min(...(budget.timeouts as number[])) * 1_000;
              expect(
                LOCK_ACQUIRE_TIMEOUT_MS * 2 + WHOAMI_TIMEOUT_MS,
              ).toBeLessThan(smallestMs);
            },
          );

          then(
            'the lock waits for a small share of what the probe may take',
            () => {
              // 🔴 a stronger claim than "it fits": the lock guards a sub-millisecond section, so
              //    a cap that rivalled the probe's would price a queue rather than a handoff
              expect(LOCK_ACQUIRE_TIMEOUT_MS).toBeLessThan(WHOAMI_TIMEOUT_MS);
            },
          );
        },
      );
    },
  );

  /**
   * .what = the reap's two clamps, a PAIR by construction
   * .why = a reap fails two opposite ways: it leaves an abandoned lock wedged, or it deletes
   *        a LIVE holder's lock and restores the lost update. one clamp alone would pass a
   *        build that traded one fault for the worse one
   *
   * ✅ .teeth = disable the reap → only `[case6]` red; disable the liveness gate in
   *   `delAbandonedDriveStateLock` → only `[case7]` red
   */
  given('[case6] a lock whose holder is PROVABLY gone', () => {
    const tempDir = genTempDir({ slug: 'test-mutateDriveBlockerState-reap' });

    when('[t0] a writer contends with an abandoned lock on disk', () => {
      const outcome = useThen(
        'the write settles rather than throws',
        async () => {
          const statePath = path.join(
            tempDir,
            '.route',
            '.drive.blockers.latest.json',
          );
          await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });

          // 🔴 a pid the os can never have issued — 2^31-1, orders above any `pid_max` a
          //    linux or darwin host allocates from. so `kill(pid, 0)` answers ESRCH here on
          //    every host, which is what makes this row deterministic
          //
          // .why not a REAL dead pid = spawn a child, reap it, reuse its pid — and the os may
          //    reissue that number to an unrelated process before the assert runs, on a busy
          //    host, rarely. ⇒ that is a flake keyed to load, and it would read as a defect
          //    in the reap rather than in the fixture
          //
          // .why not 0 = `kill(0, 0)` addresses the caller's own PROCESS GROUP rather than a
          //    process, so it answers success and the row would test the opposite of its name
          const deadPid = 0x7fffffff;
          await fs.writeFile(`${statePath}.lock`, `${deadPid}\n`);

          const caught = await mutateDriveBlockerState({
            route: tempDir,
            project: () =>
              new DriveBlockerState({ count: 4, stone: 'omega', brain: null }),
          }).catch((error: unknown) => error);

          return { threw: caught instanceof Error };
        },
      );

      then('it did NOT throw — the abandoned hold was reaped', () => {
        expect(outcome.threw).toEqual(false);
      });

      then('the write landed', async () => {
        const state = await getDriveBlockerState({ route: tempDir });
        expect(state.count).toEqual(4);
        expect(state.stone).toEqual('omega');
      });

      then('the reap left no lock and no claim behind', async () => {
        // 🔴 a reap that leaves its own claim wedges the NEXT reap, which would move the
        //    hazard one level up rather than close it
        const statePath = path.join(
          tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        const lockGone = await fs
          .stat(`${statePath}.lock`)
          .then(() => false)
          .catch(() => true);
        const claimGone = await fs
          .stat(`${statePath}.lock.reap`)
          .then(() => false)
          .catch(() => true);
        expect(lockGone).toEqual(true);
        expect(claimGone).toEqual(true);
      });
    });
  });

  given('[case7] a lock whose holder is THIS live process', () => {
    const tempDir = genTempDir({ slug: 'test-mutateDriveBlockerState-live' });

    when('[t0] a writer contends with a live holder on disk', () => {
      /**
       * 🔴 .why = the counter-clamp, and the one that matters more. `[case6]` proves the
       *          reap fires; this proves it fires on NO live lock — which is the property a
       *          naive age-based steal would break, silently, with two holders in the
       *          section at once (`rule.forbid.behavior-hazards`, the race clause)
       */
      const fault = useThen('it fails rather than steals', async () => {
        const statePath = path.join(
          tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });

        // this process's own pid — the one holder that is provably live on any host
        await fs.writeFile(`${statePath}.lock`, `${process.pid}\n`);

        const caught = await mutateDriveBlockerState({
          route: tempDir,
          project: () =>
            new DriveBlockerState({ count: 9, stone: 'theta', brain: null }),
        }).catch((error: unknown) => error);

        const lockHeld = await fs
          .stat(`${statePath}.lock`)
          .then(() => true)
          .catch(() => false);
        await fs.unlink(`${statePath}.lock`);

        return {
          threw: caught instanceof Error,
          message: caught instanceof Error ? caught.message : '',
          lockHeld,
        };
      });

      then('it threw — a live hold is never reaped', () => {
        expect(fault.threw).toEqual(true);
      });

      then("the live holder's lock is STILL on disk", () => {
        expect(fault.lockHeld).toEqual(true);
      });

      then('the error names both files a human may need to remove', () => {
        expect(fault.message).toContain('could not be proven gone');
        expect(fault.message).toContain('.drive.blockers.latest.json.lock');
        expect(fault.message).toContain('.reap');
      });

      then('it wrote no state past the lock it never held', async () => {
        const state = await getDriveBlockerState({ route: tempDir });
        expect(state.count).toEqual(0);
        expect(state.stone).toEqual(null);
      });
    });
  });
});

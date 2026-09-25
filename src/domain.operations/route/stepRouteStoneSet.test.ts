import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useThen, when } from 'test-fns';

import { genContextReviewBrainSupplyDemo } from './__test_assets__/genContextReviewBrainSupplyDemo';
import { getSelfReviewArticulationPath } from './guard/review/self/getSelfReviewArticulationPath';
import { getSelfReviewTriggeredReport } from './guard/review/self/getSelfReviewTriggeredReport';
import { stepRouteStoneSet } from './stepRouteStoneSet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

const noopContext = { ...genContextReviewBrainSupplyDemo(), isTTY: true };

describe('stepRouteStoneSet', () => {
  given('[case1] set stone as passed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-passed-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as passed with artifact present', () => {
      then('dispatches to setStoneAsPassed', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('passage = allowed');
      });

      then('returns refs object', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        expect(result.refs).toBeDefined();
        expect(result.refs?.reviews).toEqual([]);
        expect(result.refs?.judges).toEqual([]);
      });
    });
  });

  given('[case2] set stone as approved', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-approved-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as approved', () => {
      then('dispatches to setStoneAsApproved', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'approved',
          },
          noopContext,
        );
        expect(result.approved).toBe(true);
        expect(result.emit?.stdout).toContain('✓ approved');
      });

      then('does not return refs', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'approved',
          },
          noopContext,
        );
        expect(result.refs).toBeUndefined();
      });
    });
  });

  given('[case3] invalid --as value', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-invalid-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as has unsupported value', () => {
      then('throws unexpected code path error', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'invalid' as 'passed' | 'approved',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('unsupported');
      });
    });
  });

  given('[case4] set stone as promised', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-promised-${Date.now()}`,
    );

    /**
     * .what = the path the guard computes, and the one a promise must declare via --into
     * .why = the path is keyed (stone, slug). the rN level was removed, because one
     *        quantity derived at three call sites named three different files.
     */
    const owedPath = getSelfReviewArticulationPath({
      route: tempDir,
      stone: '1.vision',
      slug: 'all-done',
    });

    /**
     * .what = back-date the triggered .since mtime, so the ask reads as older than the cue window
     * .why = the clock is a CUE now, never a gate — it decides whether the encouragement
     *        renders. a back-dated ask is how a test reaches the un-confronted branch
     *        without real elapsed time.
     * .note = only .since is back-dated; .uptil stays current
     */
    const backdateTriggeredReport = async (input: {
      stone: string;
      slug: string;
    }): Promise<void> => {
      const routeDir = path.join(tempDir, '.route');

      // 🔴 ENOENT only. this read FEEDS A MUTATION — a bare `.catch(() => [])` turns an
      // EACCES, EISDIR, or EMFILE into an empty list, so the back-date becomes a silent
      // no-op and every case downstream runs against a FRESH ask where it wanted an elapsed
      // one. the suite then grades the wrong branch and goes green
      // (`rule.forbid.failhide`; `mech-failhides` blocker.1 at i017)
      const files = await fs
        .readdir(routeDir)
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return [] as string[];
          throw error;
        });
      const sinceFile = files.find(
        (f) =>
          f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
          f.endsWith('.triggered.since'),
      );
      if (sinceFile) {
        const filepath = path.join(routeDir, sinceFile);
        const mtimePast = new Date(Date.now() - 91 * 1000);
        await fs.utimes(filepath, mtimePast, mtimePast);
      }
    };

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.review.self'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
      // create the articulation at the owed path (the guard reads exactly here)
      await fs.mkdir(path.dirname(owedPath), { recursive: true });
      await fs.writeFile(owedPath, '# self-review\n');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    /**
     * 🔴 .note = this case has been re-aimed TWICE, and both moves are recorded because a
     *            reader who meets only the latest would read the current claim as the
     *            original one.
     *            1. it once asserted `challenged === true` for a CLOCK reason — no trigger
     *               had aged 90 seconds. the clock is a cue now, so that reason died.
     *            2. it then asserted `promised === true` — and that was the LAUNDERED ASK.
     *               the promise cleared on two gates that could not run: the freshness bar
     *               was skipped (`report && …`) and the haste cue read a null `askedAt`,
     *               while the adjudication quietly minted a `.since` dated now.
     * 🔴 .what it asserts now = the refusal is REAL, and its reason is the absent ask —
     *            never a clock. both halves carry weight: drop the first and the laundered
     *            ask returns; drop the second and requirement 1 is violated.
     */
    when('[t0] --as promised without prior trigger', () => {
      /**
       * 🟡 .why one act, three assertions = the act wraps a full `stepRouteStoneSet` — an
       *    `fs.cp` of a whole fixture route, a `git init`, and the entire guard pipeline.
       *    to re-run it per `then` is `rule.forbid.redundant-expensive-operations`, and
       *    it also parts the three assertions from each other: each would grade a
       *    DIFFERENT run, so the "no ask is minted" claim would be about a third mint
       *    rather than about the one whose refusal the first two graded.
       */
      const outcome = useThen(
        'the promise is adjudicated without any prior ask',
        async () => {
          // promise without first call to --as passed (no trigger)
          const result = await stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'promised',
              that: 'all-done',
              into: owedPath,
            },
            noopContext,
          );
          // read the marker AFTER that one adjudication — never after a second
          const report = await getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: tempDir,
          });
          return { result, report };
        },
      );

      then('the promise is refused — there is no ask to answer', () => {
        expect(outcome.result.challenged).toBe(true);
        // 🔴 .why exact = `undefined` is the contract for a refused promise, and its
        //    peer in stepRouteStoneSet.integration.test.ts pins the same value. a
        //    `toBeFalsy` would stay green on `null`, `false`, or `0`
        expect(outcome.result.promised).toBeUndefined();
      });

      /**
       * 🔴 the operand that parts this refusal from the one requirement 1 forbids: the
       *    reason must be the absent ask, never elapsed time. a haste message here would
       *    be a clock refusal under a new verdict's name
       */
      then('the reason is the absent ask, never a clock', () => {
        expect(outcome.result.emit?.stdout).toContain('no ask on record');
        expect(outcome.result.emit?.stdout).not.toContain(
          'pond barely rippled',
        );
        expect(outcome.result.emit?.stdout).toContain('--as passed');
      });

      /**
       * 🔴 the operand that clamps the LAUNDERED ask: the adjudication minted a `.since`
       *    dated now until i005, so a pre-rewind articulation read as fresh against a
       *    timestamp that postdates it. an ask on disk after this refusal is that mint
       */
      then('no ask is minted by the refusal', () => {
        expect(outcome.report).toBeNull();
      });
    });

    when('[t1] --as promised with no --into', () => {
      then('throws, and burns no attempt', async () => {
        // the ask, so a trigger is on record to be burned
        await stepRouteStoneSet(
          { stone: '1.vision', route: tempDir, as: 'passed' },
          noopContext,
        );

        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'promised',
              that: 'all-done',
            },
            noopContext,
          ),
        );
        expect(error.message).toContain('--into is required');

        // .why = the error must name the FIX, never the symptom alone. only `.message`
        //        reaches the driver — the cli prints it and drops the metadata bag — so an
        //        owed path that lives only in metadata is a path the driver never sees
        //        (rule.require.errors-name-the-fix). move it back and this goes red
        expect(error.message).toContain(
          `--into ${tempDir}/review/self/for.1.vision._.all-done.md`,
        );

        // .why = the attempt count is half the haste cue's condition. a usage error that
        //        burned one would retire this driver's confrontation with no read behind it
        const report = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        expect(report?.attempts).toEqual(0);
      });
    });

    when('[t2] --as promised after trigger and backdate', () => {
      /**
       * .what = the act, declared ONCE — and it captures the on-disk read with it.
       * .why  = each `then` used to re-run this whole 3-step cli sequence, so one case paid
       *         for two full flows and wore the side effects twice
       *         (`rule.forbid.redundant-expensive-operations`).
       * 🟡 .why the readdir sits INSIDE the act rather than in its own `then`: this case's
       *         `afterEach` wipes `tempDir` after every test, so a peer `then` would find
       *         no tree at all. the act reads the dir while it still stands and hands the
       *         names forward — one expensive flow, and one concern per `then`.
       */
      const outcome = useThen('the promise is recorded', async () => {
        // first trigger via --as passed
        await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        // back-date the ask, so the promise lands outside the cue window
        await backdateTriggeredReport({ stone: '1.vision', slug: 'all-done' });

        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
            into: owedPath,
          },
          noopContext,
        );

        const files = await fs.readdir(path.join(tempDir, '.route'));
        return {
          result,
          promiseFiles: files.filter((f) => f.includes('.promise.')),
        };
      });

      then('returns promised true', () => {
        expect(outcome.result.promised).toBe(true);
        // per blueprint: shows "passage = progressed" not "promise = recorded"
        expect(outcome.result.emit?.stdout).toContain('passage = progressed');
        expect(outcome.result.emit?.stdout).toContain(
          'review.self 1/2 promised',
        );
        // per blueprint: shows next unpromised review (tests-pass)
        expect(outcome.result.emit?.stdout).toContain('tests-pass');
      });

      then('creates promise artifact file', () => {
        expect(outcome.promiseFiles.length).toBeGreaterThan(0);
        expect(outcome.promiseFiles[0]).toContain('all-done');
      });
    });

    when('[t3] --as promised without --that', () => {
      const outcome = useThen('throws bad request error', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'promised',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--that is required');
        return { error };
      });

      then('the refusal a driver reads is stable (full snapshot)', () => {
        // 🔴 .why this pin = the peer refusal on this same flag pair — the
        //    `--into is required` message — is snapped in full, and this one held a
        //    lone `toContain` of four words. so a regression that dropped the guidance
        //    beneath the first line would keep the bar green while the driver lost the
        //    move (`rule.require.contract-snapshot-exhaustiveness`)
        expect(outcome.error.message).toMatchSnapshot(
          'the refusal when --that is absent on --as promised',
        );
      });
    });
  });

  given('[case5] set stone as arrived (alias for passed)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-arrived-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as arrived with artifact present', () => {
      then('behaves same as --as passed', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'arrived',
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('passage = allowed');
      });

      then('returns refs object', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'arrived',
          },
          noopContext,
        );
        expect(result.refs).toBeDefined();
        expect(result.refs?.reviews).toEqual([]);
        expect(result.refs?.judges).toEqual([]);
      });
    });
  });

  // 🔴 the clamp for r10.n5 — a stance-only flag on a non-stance --as was DROPPED with no
  //    word before the guard. now it is refused loud, so a mistyped verb never eats a grade.
  //    fires before any fs access, so the bogus route is never read.
  given('[case6] a stance-only flag on a non-stance --as', () => {
    when('[t0] --as passed --severity urgent', () => {
      then('refuses, and names the stray flag', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'passed',
              severity: 'urgent',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--severity is only accepted for');
        // 🔴 r009 i011 nitpick.2 — pinned whole; a mistyped-verb driver reads this
        //    message in full, and the taught commands inside it must stay correct
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] --as passed --why some/path', () => {
      then('refuses, and names --why', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'passed',
              why: '.fulcrums/inventory.of=fulcrums.case=F001.md',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--why is only accepted for');
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t2] --as approved --with architect', () => {
      then('refuses, and names --with', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'approved',
              with: 'architect',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--with is only accepted for');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  /**
   * 🔴 .what = the clamp for i013's nitpick, raised INDEPENDENTLY by two lanes (r007 + r011).
   *
   * .why = `--into` is REQUIRED on `--as promised`, and it was the one verb-specific flag never
   *        added to the stray-flag refusals. so `--as passed --into <path>` discarded the
   *        argument in silence — the exact failure mode the `--that` refusal had been built to
   *        kill one round earlier, re-committed on the round's own new flag.
   *
   * 🔴 .what it really clamps = the TABLE, never this one flag. the `if`-per-flag shape shipped
   *        three times and the fourth flag was never added to it, because that shape makes each
   *        new flag opt IN to validation ⇒ the default for a new flag is silence. `[t1]` below
   *        asserts a SIBLING flag through the same table, so a repair that special-cased
   *        `--into` back into its own `if` would satisfy `[t0]` and leave the class open.
   */
  given('[case6b] --into on a verb that does not own it', () => {
    when('[t0] --as passed --into some/path', () => {
      then('refuses, and names --into', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'passed',
              into: 'review/self/for.1.vision._.all-done.md',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--into is only accepted for');
        expect(error.message).toMatchSnapshot();
      });
    });

    /**
     * 🔴 .why = `--absorbed` owns `--that` and does NOT own `--into`. it is the sharpest verb to
     *           assert, because a driver who absorbs a lane has just typed a `--that` command and
     *           is one flag away from this mistype.
     */
    when('[t1] --as absorbed --into some/path', () => {
      then('refuses too — the verb owns --that, never --into', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'absorbed',
              that: 'architect',
              into: 'review/self/for.1.vision._.all-done.md',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--into is only accepted for');
      });
    });

    /**
     * 🔴 .why = the refusal must not fire on the verb that DOES own the flag. a check that
     *           refused every `--into` would pass `[t0]` and `[t1]` while it broke the required
     *           flag outright — which is the one outcome worse than the silence it repairs.
     */
    when('[t2] --as promised --into some/path', () => {
      then('is NOT refused by the stray-flag table', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'promised',
              that: 'has-grounded-in-reality',
              into: 'review/self/for.1.vision._.has-grounded-in-reality.md',
            },
            noopContext,
          ),
        );
        // it still fails — the route does not exist — but never for the stray-flag reason
        expect(error.message).not.toContain('--into is only accepted for');
      });
    });
  });

  // 🔴 r009 i012 nitpick.1 — a stance names a PARTY and a SUBJECT; both refusals below
  //    teach a driver what to add. naught in the target drove them before this clamp
  given('[case7] a stance with an absent --with or --about', () => {
    when('[t0] --as disputed with no --with', () => {
      then('refuses, and names --with — pinned whole', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'disputed',
              about: 'blocker.1',
              why: '.fulcrums/inventory.of=fulcrums.case=F001.md',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--with is required for --as disputed');
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] --as conceded with no --about', () => {
      then('refuses, and names --about — pinned whole', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'conceded',
              with: 'architect',
              severity: 'better',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain(
          '--about is required for --as conceded',
        );
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});

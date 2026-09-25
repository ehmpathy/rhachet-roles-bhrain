import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getSelfReviewArticulationPath } from '../src/domain.operations/route/guard/review/self/getSelfReviewArticulationPath';
import { getSelfReviewTriggeredPaths } from '../src/domain.operations/route/guard/review/self/getSelfReviewTriggeredPaths';
import { isPathFound } from '../src/domain.operations/route/isPathFound';
import { getRouteDirFiles } from './.test/getRouteDirFiles';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-drive');

/**
 * .what = the path the guard computes, and the one a promise must declare via --into
 * .why = the route is bound to '.', so that is the route segment the guard uses — never
 *        the temp dir. a test that declares an absolute path meets the mismatch verdict.
 */
const asOwedPath = (input: { stone: string; slug: string }): string =>
  getSelfReviewArticulationPath({ route: '.', ...input });

/**
 * .what = the per-stone trigger counts a rewind's `cleared:` lines report
 *
 * 🔴 .why = a rewind CASCADES, so one invocation emits one `cleared:` line per stone it
 *           rewound. a whole-stdout assertion therefore reads every stone's count at once
 *           and cannot say which stone it means.
 *
 * ⚠️ .note = this locator exists because the first draft of `[case18]` asserted
 *            `not.toContain('0 triggers')` against the whole emit, and went RED on correct
 *            behavior: the downstream stone genuinely held no trigger, so its zero is the
 *            right line to print. one count per stone is what makes a negative assertion
 *            mean what it says.
 */
const asClearedTriggerCounts = (stdout: string): number[] =>
  stdout
    .split('\n')
    .filter((line) => line.includes('cleared:'))
    .map((line) => Number(/(\d+) triggers/.exec(line)?.[1] ?? -1));

/**
 * .what = the `.since` ask markers a stone+slug owns, as absolute paths
 * .why = the ask's mtime is the datum both the haste cue and the freshness bar read, so a
 *        test that wants to move either one must first locate the marker. one locator, so
 *        the filename shape is derived once rather than per caller.
 *
 * .note = stone pattern matches resolved names (e.g., '1' matches '1.stone')
 */
const getAskMarkerPaths = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<string[]> => {
  const stonePattern = input.stone.includes('.') ? input.stone : `${input.stone}.`;
  const routeDir = path.join(input.tempDir, '.route');
  const files = await getRouteDirFiles(routeDir);
  return files
    .filter(
      (f) =>
        f.startsWith(stonePattern) &&
        f.includes(`guard.selfreview.${input.slug}`) &&
        f.endsWith('.triggered.since'),
    )
    .map((f) => path.join(routeDir, f));
};

/**
 * .what = back-dates the ask, so the promise lands outside the cue window
 * .why = the clock is a CUE now, never a gate. a back-dated ask is how a test reaches
 *        the un-confronted branch without real elapsed time.
 *
 * .note = only .since files are backdated; .uptil stays current
 */
const backdateTriggeredReport = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<void> => {
  const mtimePast = new Date(Date.now() - 31 * 1000);
  for (const sincePath of await getAskMarkerPaths(input)) {
    await fs.utimes(sincePath, mtimePast, mtimePast);
  }
};

/**
 * .what = re-stamps the ask and its articulation so the next promise lands INSIDE the cue
 *         window, whatever the machine's load — the ask at now−1s, the file at now.
 *
 * 🔴 .why = the cue fires on elapsed-since-the-ask, so a case that asserts it FIRES has a
 *           precondition its code never states: the scene plus every prior step must finish
 *           in under 30s. that is a DURATION, and a duration is a flake with a long fuse —
 *           green on a scoped suite for a whole round, red the first time the full corpus
 *           runs beside it. measured: `[case8][t2]` went red at 655s of suite time.
 *
 * ⇒ call it immediately before the promise, and the precondition becomes an order of
 *   operations rather than a race. the clock leaves the test.
 *
 * .note = it sets both stamps deliberately, one second apart. the ask must stay OLDER than
 *         the file (or the freshness bar refuses it) and YOUNGER than the window (or the cue
 *         never fires) — one write cannot hold both ends, so it writes both.
 */
const freshenAskAndArticulation = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<void> => {
  const now = Date.now();

  const askedAt = new Date(now - 1000);
  for (const sincePath of await getAskMarkerPaths(input)) {
    await fs.utimes(sincePath, askedAt, askedAt);
  }

  const wroteAt = new Date(now);
  await fs.utimes(
    getSelfReviewArticulationPath({
      route: input.tempDir,
      stone: input.stone,
      slug: input.slug,
    }),
    wroteAt,
    wroteAt,
  );
};

/**
 * .what = acceptance tests for review.self flow
 * .why = verifies clone must promise review.selfs before guards run
 */
describe('driver.route.review.self.acceptance', () => {
  given('[case1] stone with reviews.self defined', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case1', { cwd: tempDir });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // 🔴 write the FIRST review's articulation only.
      // .why = the ladder is serial — the driver is asked for `tests-pass` only once
      //        `all-done` is promised, and the freshness bar wants an articulation NEWER
      //        than its own ask. a fixture that writes both up front encodes the WITHDRAWN
      //        fork workflow, which was coherent only because every trigger was minted at
      //        the first `--as passed`. under a lazy mint that file predates its ask.
      // ⇒ `tests-pass`'s articulation is written in [t2], after its ask, as a driver does
      const articulationPath1 = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath1), { recursive: true });
      await fs.writeFile(
        articulationPath1,
        '# Self-Review: all-done\n\nI reviewed all requirements.\n',
      );

      return { tempDir };
    });

    when('[t0] pass attempted without promises', () => {
      const result = useThen('blocked by review.self', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows review.self required', () => {
        expect(result.stdout.toLowerCase()).toContain('review.self');
      });

      then('shows first review slug', () => {
        expect(result.stdout).toContain('all-done');
      });

      then('shows promise command', () => {
        expect(result.stdout).toContain('--as promised');
        expect(result.stdout).toContain('--that all-done');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] first review is promised', () => {
      const result = useThen('promise succeeds', async () => {
        // backdate triggered report to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progress', () => {
        expect(result.stdout.toLowerCase()).toContain('progress');
      });

      then('shows next review', () => {
        expect(result.stdout).toContain('tests-pass');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] second review is promised', () => {
      const result = useThen('promise succeeds and guards run', async () => {
        // make review pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');
        // ask for the second review — the lazy mint stamps ITS ask now, not at [t0]
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // 🔴 write the articulation AFTER the ask, as the serial ladder requires
        await fs.writeFile(
          getSelfReviewArticulationPath({
            route: scene.tempDir,
            stone: '1',
            slug: 'tests-pass',
          }),
          '# Self-Review: tests-pass\n\nI verified all tests pass.\n',
        );
        // backdate triggered report to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'tests-pass',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'tests-pass',
            into: asOwedPath({ stone: '1', slug: 'tests-pass' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] pass attempted with all promises', () => {
      const result = useThen('guards execute', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows guard tree', () => {
        expect(result.stdout.toLowerCase()).toContain('guard');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] invalid promise slug', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case2', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] promise with invalid slug', () => {
      const result = useThen('shows error with valid options', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'invalid-slug' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows valid slugs', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('all-done');
        expect(output).toContain('tests-pass');
      });

      then('the refusal a driver reads is stable (full snapshot)', () => {
        // 🔴 .why this pin = the two `toContain` bars above hold the SLUG LIST and
        //    naught else, so a regression that moved this refusal to stdout, re-classed
        //    it, or dropped the guidance around the list would keep them both green.
        //    every other negative path of this promise contract is snapped; this one
        //    was the sole hole (`rule.require.contract-snapshot-exhaustiveness`)
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the stdout of an invalid promise slug',
        );
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'the stderr of an invalid promise slug',
        );
      });
    });
  });

  given('[case3] hashless promises survive hash changes (firm checkpoint)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case3', {
        cwd: tempDir,
      });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // create articulation files for both self-reviews
      const articulationPath1 = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      const articulationPath2 = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'tests-pass',
      });
      await fs.mkdir(path.dirname(articulationPath1), { recursive: true });
      await fs.writeFile(
        articulationPath1,
        '# Self-Review: all-done\n\nI reviewed all requirements.\n',
      );
      await fs.writeFile(
        articulationPath2,
        '# Self-Review: tests-pass\n\nI verified all tests pass.\n',
      );

      return { tempDir };
    });

    when('[t0] first review is promised', () => {
      const result = useThen('promise succeeds', async () => {
        // first call --as passed to trigger the report
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // backdate triggered report to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progress 1/2', () => {
        expect(result.stdout).toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] artifact is edited (hash changes)', () => {
      then('artifact content changes', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.stone.i1.md'),
          '# Implementation\n\nFeature implemented with changes.',
        );
        // verify the file was updated
        const content = await fs.readFile(
          path.join(scene.tempDir, '1.stone.i1.md'),
          'utf-8',
        );
        expect(content).toContain('with changes');
      });
    });

    when('[t2] pass attempted after edit', () => {
      const result = useThen('all-done still valid, tests-pass blocks', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero (tests-pass not promised yet)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows review.self required', () => {
        expect(result.stdout.toLowerCase()).toContain('review.self');
      });

      then('shows tests-pass (not all-done)', () => {
        // all-done promise is firm (hashless), so we proceed to tests-pass
        expect(result.stdout).toContain('tests-pass');
        expect(result.stdout).toContain('2/2');
      });

      then('all-done promise remains valid', () => {
        // no invalidation status shown
        expect(result.stdout.toLowerCase()).not.toContain('invalidated');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] flat reviews array (backwards compatible)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case4', { cwd: tempDir });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // overwrite guard with flat reviews array
      await fs.writeFile(
        path.join(tempDir, '1.stone.guard'),
        `artifacts:
  - 1.stone*.md

reviews:
  - .test/mock-review.sh --paths 1.stone*.md

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0
`,
      );

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // make review pass
      await fs.writeFile(path.join(tempDir, '.test', 'review-should-pass'), '');

      return { tempDir };
    });

    when('[t0] pass attempted with flat reviews', () => {
      const result = useThen('guards execute directly (no review.self)', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows guard tree', () => {
        expect(result.stdout.toLowerCase()).toContain('guard');
      });

      then('no review.self block', () => {
        expect(result.stdout.toLowerCase()).not.toContain('lets reflect');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .note = this case once read `[case5] clone promises too quickly (time enforcement)`
   *         and walked first → rushed → allowed over three commands, the third of which
   *         needed 30 seconds of elapsed time. no promise is enforced by time now: the
   *         clock decides whether the encouragement renders, never whether the promise
   *         passes. the case is re-aimed at the cue rather than deleted.
   */
  given('[case5] clone promises too quickly (the haste cue)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case5',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case5', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — so a trigger is on record, and the promise below lands inside its window
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      // .note = the articulation is written AFTER the ask, which is the real order: the
      //         guard asks, then the driver reads and writes. a fixture that writes it
      //         first constructs a file that PREDATES the question, and the freshness bar
      //         correctly refuses it — a `stale` verdict, never the cue under test
      const articulationPath = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath), { recursive: true });
      await fs.writeFile(
        articulationPath,
        '# self-review\n\nreviewed and looks good.',
      );

      return { tempDir };
    });

    when('[t0] the promise lands inside the window of the ask', () => {
      const result = useThen('returns challenge:rushed', async () => {
        // 🔴 no backdate — the promise is meant to land inside the window. the stamps are
        //    re-set so "inside the window" is an order of operations, never a race the
        //    scene's own runtime can lose under load
        await freshenAskAndArticulation({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows what is the rush', () => {
        expect(result.stdout).toContain('what is the rush');
      });

      then('shows patience challenge after rush prefix', () => {
        expect(result.stdout).toContain('patience, friend');
      });

      then('shows pond barely rippled', () => {
        expect(result.stdout).toContain('pond barely rippled');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the very next command, with no wait at all', () => {
      const result = useThen('promise accepted', async () => {
        // .why = the cue demands NO wait. the atomic `wx` claim already landed, so
        //        `firstAdjudication` is false and the cue cannot fire again — and no time has
        //        passed between this command and the last. that conjunction IS the wish's
        //        requirement 1
        // 🔴 .note = the bound is `firstAdjudication`, NEVER the `attempts` counter. this
        //    comment named the counter until i019, which is the racy mechanism the i014/i015
        //    blocker retired from the production docblock — and a reader who took it at face
        //    value was pointed straight back at it (`repo-rules` nitpick.1 at i019)
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progress', () => {
        expect(result.stdout).toContain('progressed');
      });

      then('stdout has good vibes', () => {
        // .why = [t0] snapped the confrontation; this snaps the clearance, and the pair
        //        IS the round's headline claim — confronted once, then through with no
        //        wait. a snapshot on one step alone leaves the transition invisible
        //        (rule.require.snapshot-every-journey-step)
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .note = this case once read `[case6] hashbar controls timer behavior (not promise type)`,
   *         and the title outlived the design. hashbar controls no behavior now — it is
   *         accepted only so the emit can say it is retired (`[case13]`), and this body never
   *         sets it. re-titled to the property it actually exercises, never deleted.
   */
  /**
   * 🔴 .note = every step here pins its stdout, and until i019 not one did. the case runs
   *            three real CLI commands and asserted them with `toContain` alone, so the arc it
   *            is named for — promise → artifact edit → the promise SURVIVES → completion —
   *            was unreadable from the snapshots (`repo-rules` blocker.1 at i019,
   *            `rule.require.snapshot-every-journey-step`).
   *
   * ⚠️ .note = the snapshots sit INSIDE each step's one `then` rather than in a `then` of their
   *            own, because each step's result is a local built by several awaits. the rule
   *            asks that every step be readable, never that every step own a separate `then`.
   */
  given('[case6] a promise is hashless and survives an artifact hash change', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'self-review-case6',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-self-review-case6', {
        cwd: tempDir,
      });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation v1\n\nFeature implemented.',
      );

      return { tempDir };
    });

    /**
     * 🟡 .note on the shape of all three `when`s below = the act is declared in the `when`
     *    via `useThen`, and each `then` only asserts. the acts used to run inline inside
     *    bare `then` blocks, which inverts the given/when/then contract — a `when` that
     *    names a state while the act hides one level down (`rule.require.given-when-then`).
     *    these three steps are also a SEQUENCE: [t1] depends on [t0]'s promise, and [t2] on
     *    both, so each act stays exactly one per `when`.
     */
    when('[t0] all promises are hashless (no hash in filename)', () => {
      const outcome = useThen('the first promise is made', async () => {
        // trigger self-review
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // create articulation file (required for promise to succeed)
        const articulationPath = getSelfReviewArticulationPath({
          route: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        await fs.mkdir(path.dirname(articulationPath), { recursive: true });
        await fs.writeFile(
          articulationPath,
          '# self-review\n\nreviewed and looks good.',
        );

        // backdate to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        // promise
        const result = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });

        const files = await fs.readdir(path.join(scene.tempDir, '.route'));
        return { result, files };
      });

      then('the promise is accepted', () => {
        expect(outcome.result.code).toEqual(0);
      });

      then('a hashless promise file is created', () => {
        // exact match, no hash suffix
        expect(
          outcome.files.find((f) => f === '1.guard.promise.all-done.md'),
        ).toBeDefined();
      });

      then('no hash-bound promise file is created', () => {
        expect(
          outcome.files.find(
            (f) =>
              f.startsWith('1.guard.promise.all-done.') &&
              f.match(/\.[a-f0-9]+\.md$/),
          ),
        ).toBeUndefined();
      });

      // .why = the promise's own stdout — the acceptance a driver reads when a self review
      //        lands. the filename assertions above prove the SHAPE on disk and say naught
      //        about what the driver was told
      then('the driver is told the promise landed', () => {
        expect(sanitizeTimeForSnapshot(outcome.result.stdout)).toMatchSnapshot(
          'the first promise is accepted',
        );
      });
    });

    when('[t1] hashless promise survives hash changes', () => {
      const result = useThen('the artifact is edited, then re-passed', async () => {
        // change artifact (new hash)
        await fs.writeFile(
          path.join(scene.tempDir, '1.stone.i1.md'),
          '# Implementation v2\n\nFeature improved.',
        );

        // make review pass for tests-pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'review-should-pass'),
          '',
        );

        // attempt pass — should progress to tests-pass (all-done still valid)
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('the guard names the NEXT review, never all-done', () => {
        expect(result.stdout).toContain('tests-pass');
        expect(result.stdout).toContain('2/2');
      });

      // 🔴 .why = this is the case's WHOLE subject — the artifact hash moved and the extant
      //    promise held. the assertion above proves the guard named the NEXT review;
      //    only the snapshot shows that `all-done` is still counted, which is the survival
      //    the case is named for
      then('the prior promise is still counted', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the hashless promise survives the edit',
        );
      });
    });

    when('[t2] promise tests-pass and complete stone', () => {
      const outcome = useThen(
        'the last review is promised, then the stone is passed',
        async () => {
          // create articulation file for tests-pass (required for promise to succeed)
          const articulationPath = getSelfReviewArticulationPath({
            route: scene.tempDir,
            stone: '1',
            slug: 'tests-pass',
          });
          await fs.writeFile(
            articulationPath,
            '# self-review\n\nall tests pass.',
          );

          // backdate tests-pass triggered report
          await backdateTriggeredReport({
            tempDir: scene.tempDir,
            stone: '1',
            slug: 'tests-pass',
          });

          // promise tests-pass
          const promiseResult = await invokeRouteSkill({
            skill: 'route.stone.set',
            args: {
              stone: '1',
              route: '.',
              as: 'promised',
              that: 'tests-pass',
              into: asOwedPath({ stone: '1', slug: 'tests-pass' }),
            },
            cwd: scene.tempDir,
          });

          // pass should now succeed (both reviews promised)
          const passResult = await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          });

          return { promiseResult, passResult };
        },
      );

      then('the second promise is accepted', () => {
        expect(outcome.promiseResult.code).toEqual(0);
        expect(
          sanitizeTimeForSnapshot(outcome.promiseResult.stdout),
        ).toMatchSnapshot('the second promise is accepted');
      });

      // .why = the arc's end. `code === 0` says the stone passed and says naught about the
      //        guard tree the driver reads on the way through
      then('the stone then passes', () => {
        expect(outcome.passResult.code).toEqual(0);
        expect(
          sanitizeTimeForSnapshot(outcome.passResult.stdout),
        ).toMatchSnapshot('the stone passes with both reviews promised');
      });
    });
  });

  /**
   * .note = this case once read `[case7] plowthrough via 3 attempts on same hash`, and
   *         asserted the liveness hatch. the hatch is RETIRED: its `attempts` count is
   *         half the cue's own condition now, so the cue opens on attempt 2 and no hatch
   *         has work left to do.
   *         ⚠️ the hatch was also UNREACHABLE for the driver it existed to serve — attempts
   *         were counted per-hash, and a driver who repairs is on a new hash every time.
   *         the case is re-aimed at the bound that replaced it, never deleted.
   */
  given('[case7] the cue fires at most once per slug', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case7',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case7', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — so the promises below land inside its window
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      // .note = written AFTER the ask, as the real order goes. a fixture that writes it
      //         first constructs a file that PREDATES the question, so the freshness bar
      //         refuses it — and the case then measures `stale`, never the cue's bound
      const articulationPath = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath), { recursive: true });
      await fs.writeFile(
        articulationPath,
        '# Self-Review: all-done\n\nI reviewed and found everything in order.\n',
      );

      return { tempDir };
    });

    when('[t0] the driver promises twice inside the window', () => {
      /**
       * .what = BOTH promises, declared once, in order, with no pause between them.
       * .why  = each `then` used to fire its own `--as promised`, so the 2nd block only
       *         passed because the 1st block's side effect had consumed the cue — an act
       *         inside a `then`, and the order dependence hidden by it
       *         (`rule.forbid.redundant-expensive-operations`). the act belongs in the
       *         `when`; each `then` then asserts one attempt's outcome, and the
       *         no-wait claim is visible in the act itself rather than implied.
       */
      const attempts = useThen('both promises run back to back', async () => {
        // the stamps are re-set so the 1st promise lands inside the window by construction
        await freshenAskAndArticulation({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });

        const asPromise = async () =>
          invokeRouteSkill({
            skill: 'route.stone.set',
            args: {
              stone: '1',
              route: '.',
              as: 'promised',
              that: 'all-done',
              into: asOwedPath({ stone: '1', slug: 'all-done' }),
            },
            cwd: scene.tempDir,
          });

        // no `sleep` between them — the bound under test is the attempt count, never a clock
        return { first: await asPromise(), second: await asPromise() };
      });

      then('1st attempt meets the cue', () => {
        expect(attempts.first.code).not.toEqual(0);
        expect(attempts.first.stdout).toContain('patience');
      });

      then('2nd attempt clears — no wait between them', () => {
        expect(attempts.second.code).toEqual(0);
        expect(attempts.second.stdout).toContain('progressed');

        // .why = a cue that could repeat is a wall, and a wall is what this round removed
        expect(attempts.second.stdout).not.toContain('what is the rush');
      });

      /**
       * 🔴 .why own-site pins = the two `toContain`s above grade one phrase each, and the
       *    variants they ride on are pinned only over in `[case5]`. so this case's
       *    protection was BORROWED: re-key or drop a case5 snapshot and case7 loses its
       *    pin with no test that turns red (`ergo-contract-snapshots` nitpick.1 at i002).
       *    ⇒ a case must stand on its own snapshots — a shared variant is covered
       *    globally, and a COLLISION case is about the PAIR, which no peer case pins
       */
      then('the 1st attempt has good vibes', () => {
        expect(sanitizeTimeForSnapshot(attempts.first.stdout)).toMatchSnapshot();
      });

      then('the 2nd attempt has good vibes', () => {
        expect(
          sanitizeTimeForSnapshot(attempts.second.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  /**
   * .note = this case once read `first → absent → rushed → allowed`. the verdict order is
   *         mismatch → absent → stale → rushed → allowed now, and the haste cue is LAST
   *         by design: a driver whose real defect is a path must never be told to slow
   *         down. the journey is re-aimed to walk the new order, never deleted.
   */
  given('[case8] full journey (mismatch → absent → rushed → allowed)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case8',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case8', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — so a trigger is on record for the haste cue at [t2]
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] the declared path is not the owed path', () => {
      const result = useThen('returns challenge:mismatch', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: './review/self/for.1._.r1.all-done.md', // a stale rN-shaped path
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('renders a diff, never a bare absence', () => {
        expect(result.stdout).toContain('not quite there');
        expect(result.stdout).toContain('you named');
        expect(result.stdout).toContain('it is owed');
      });

      then('names both paths, so the driver can see the difference', () => {
        expect(result.stdout).toContain('review/self/for.1._.r1.all-done.md');
        expect(result.stdout).toContain('review/self/for.1._.all-done.md');
      });

      then('does NOT tell the driver to slow down', () => {
        // .why = a promise whose real defect is a path must never meet the haste cue
        expect(result.stdout).not.toContain('what is the rush');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the path is right, and the file is absent', () => {
      const result = useThen('returns challenge:absent', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows what have you seen', () => {
        expect(result.stdout).toContain('what have you seen');
      });

      then('shows articulation is absent', () => {
        expect(result.stdout).toContain('articulation is absent');
      });

      then('shows promise without words message', () => {
        expect(result.stdout).toContain('promise without words');
        expect(result.stdout).toContain('daydream');
      });

      /**
       * .note = this once asserted `patience, friend` — the absent verdict used to append the
       *         haste reproach to a driver whose file was simply not there. only
       *         `challenge:rushed` carries a haste message now (the D5 invariant), so the case
       *         is re-aimed at what the absent verdict DOES owe: the guide that names the fix.
       */
      then('still names the fix — the guide, the path, the command', () => {
        expect(result.stdout).toContain('lets reflect');
        expect(result.stdout).toContain('--as promised --that all-done');
      });

      then('does NOT reproach the driver for haste', () => {
        expect(result.stdout).not.toContain('patience, friend');
        expect(result.stdout).not.toContain('what is the rush');
        expect(result.stdout).not.toContain('pond barely rippled');
      });

      then('names the path it looked at, so the driver can check it', () => {
        // .note = the path is keyed (stone, slug) — no derived ordinal. the driver holds
        //         both operands, so the path is computable by hand and cannot drift
        expect(result.stdout).toContain('review/self/for.1._.all-done.md');
        expect(result.stdout).not.toContain('for.1._.r1.all-done.md');
      });

      then('states the guard looks precisely here, write exactly this path', () => {
        expect(result.stdout).toContain(
          'the guard looks precisely here, write exactly to this path',
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] the file is written, inside the window of the ask', () => {
      const result = useThen('returns challenge:rushed', async () => {
        // create articulation file
        const articulationPath = getSelfReviewArticulationPath({
          route: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        await fs.mkdir(path.dirname(articulationPath), { recursive: true });
        await fs.writeFile(
          articulationPath,
          '# self-review\n\nreviewed and looks good.',
        );

        // 🔴 the journey's prior legs cost real seconds, so "inside the window" cannot rest
        //    on how fast they ran. re-set the stamps and the leg asserts its own subject
        await freshenAskAndArticulation({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows patience challenge (not absent)', () => {
        expect(result.stdout).toContain('patience, friend');
      });

      then('does NOT show what have you seen', () => {
        expect(result.stdout).not.toContain('what have you seen');
      });

      then('shows what is the rush', () => {
        expect(result.stdout).toContain('what is the rush');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] the very next command, with no wait at all', () => {
      const result = useThen('returns allowed', async () => {
        // .why = NO backdate. the cue fired once at [t2], so the `wx` claim is on disk and
        //        `firstAdjudication` is false — it cannot fire again, and the driver waits for
        //        naught
        // 🔴 .note = the bound is `firstAdjudication`, NEVER the `attempts` counter — see the
        //    twin note at `[case5][t1]` (`repo-rules` nitpick.1 at i019)
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progressed', () => {
        expect(result.stdout).toContain('progressed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = the freshness verdict, end to end, plus the claim it must NOT consume
   * .why = `challenge:stale` was the one verdict of the five with no acceptance case, so the
   *        emit a driver actually reads was pinned nowhere. a unit test proves the formatter;
   *        only this proves the verdict reaches stdout.
   *
   * ⚠️ .note = [t1] is the bite check, and it guards the write-then-decide inversion. the stale
   *            verdict returns BEFORE `setSelfReviewTriggeredReport`, so it claims no
   *            first-adjudication — a driver refused for staleness must still meet the haste cue
   *            once on their next promise. move the write above the freshness branch and [t1]
   *            goes green on `progressed` rather than on the cue.
   */
  given('[case9] a leftover articulation, written before the ask', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case9',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case9', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — this mints the trigger, and its `.since` mtime is the datum
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      // a review from a prior round: at the owed path, and an hour older than the ask
      const articulationPath = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath), { recursive: true });
      await fs.writeFile(
        articulationPath,
        '# self-review\n\nreviewed a version of this that no longer exists.',
      );
      const mtimePast = new Date(Date.now() - 60 * 60 * 1000);
      await fs.utimes(articulationPath, mtimePast, mtimePast);

      return { tempDir, articulationPath };
    });

    when('[t0] the promise names that leftover', () => {
      const result = useThen('returns challenge:stale', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('names the freshness defect, never an absence', () => {
        expect(result.stdout).toContain('predates the ask');
        expect(result.stdout).not.toContain('articulation is absent');
      });

      then('names BOTH stamps, so the driver sees which one is the problem', () => {
        expect(result.stdout).toContain('written');
        expect(result.stdout).toContain('asked at');
      });

      then('names the fix — read what is there now, then promise again', () => {
        expect(result.stdout).toContain('read what is there now');
      });

      then('does NOT reproach the driver for haste', () => {
        // .why = the D5 invariant — a promise whose real defect is a date must never be
        //        told to slow down. the confrontation it earns is about the file
        expect(result.stdout).not.toContain('what is the rush');
        expect(result.stdout).not.toContain('patience, friend');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the driver reads again and re-saves the file', () => {
      const result = useThen('returns challenge:rushed', async () => {
        // the review is redone against what is there now
        await fs.writeFile(
          scene.articulationPath,
          '# self-review\n\nre-read the artifact as it stands, and here is what i found.',
        );

        // the cue is owed here, so the ask must still be inside its window by construction
        await freshenAskAndArticulation({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('the freshness defect is gone', () => {
        expect(result.stdout).not.toContain('predates the ask');
      });

      then('the haste cue is STILL owed — [t0] consumed no claim', () => {
        // .why = the bite. the stale verdict returns before the atomic `wx` write, so the
        //        first adjudication is still unclaimed and the cue fires here, once
        expect(result.stdout).toContain('what is the rush');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = the usage error a driver meets when they omit the required --into
   * .why = the owed path is computed inside the throw and carried in `.message`. only
   *        `.message` reaches a human — the cli prints it and drops the metadata bag — so
   *        the round's unit clamp proves the message HOLDS the path, and says naught about
   *        whether a driver ever READS it. this proves the second half.
   *
   * ⚠️ .note = the assertion is on STDERR, deliberately. a BadRequestError is printed by
   *            `console.error` and exits 2; an assertion on stdout would pass vacuously.
   */
  given('[case10] a promise that omits the required --into', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case10',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case10', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] the flag is absent', () => {
      const result = useThen('exits with a usage error', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('names what went wrong', () => {
        expect(result.stderr).toContain('--into is required');
      });

      then('names the FIX, as a command the driver can paste', () => {
        // .why = rule.require.errors-name-the-fix. the owed path is already computed at
        //        the throw; an error that withholds it names the symptom alone. drop the
        //        path back into the metadata bag and this goes red
        expect(result.stderr).toContain(
          '--into ./review/self/for.1._.all-done.md',
        );
      });

      then('burns no attempt — the decision is never reached', async () => {
        // .why = the attempt count is half the haste cue's condition. a usage error that
        //        burned one would retire this driver's confrontation with no read behind it
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await getRouteDirFiles(routeDir);
        const uptils = files.filter((f) => f.endsWith('.triggered.uptil'));
        expect(uptils).toEqual([]);
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    /**
     * 🔴 .what = the flag is PRESENT and BARE — a distinct branch from `[t0]`, and one no
     *            case reached until i017
     * .why = `[t0]` exercises the route operation's own required-guard, which fires because
     *        the key is absent from the parsed bag. a bare `--into` never reaches it: the
     *        parser would coerce the value-less flag to the string `'true'`, which is TRUTHY,
     *        so the required-guard would read the flag as supplied and the driver would meet
     *        a confusing downstream verdict about a path named `true`. the refusal therefore
     *        lives in `parseArgs`, fires earlier, and reads generic — and a human-faced error
     *        with no snapshot is one a reviewer cannot see
     *        (`rule.forbid.friction-hazards`; `ergo-friction-hazards` nitpick.1 at i017).
     */
    when('[t1] the flag is present with no value', () => {
      const result = useThen('exits with a usage error', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: true,
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('names the flag, and that it was passed bare', () => {
        expect(result.stderr).toContain('--into was passed with no value');
      });

      then('names the FIX — the shape the flag owes', () => {
        expect(result.stderr).toContain('--into <value>');
      });

      then('the message stays GENERIC — it names no one verb’s syntax', () => {
        // .why = `parseArgs` is shared by every route subcommand and does not know which
        //        was invoked, so a hint that names `--as promised` is decoy guidance for a
        //        driver on `route.bind.set` or `route.bounce` (`rule.forbid.surprises`).
        //        this is the i016 repair, and it has had no clamp until now
        expect(result.stderr).not.toContain('--as promised');
      });

      then('burns no attempt — the parser refuses before any decision', async () => {
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await getRouteDirFiles(routeDir);
        const uptils = files.filter((f) => f.endsWith('.triggered.uptil'));
        expect(uptils).toEqual([]);
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    /**
     * 🔴 .what = the flag is WELL-FORMED and the VERB is wrong — the third and last way a
     *            driver can misuse `--into`, and the only one the table owns.
     *
     * .why = `[t0]` is the route operation's required-guard (key absent) and `[t1]` is
     *        `parseArgs` (value absent). this is `getStrayFlagRefusal`: the value is fine, the
     *        verb does not own the flag. three ways to get `--into` wrong, three refusals from
     *        three layers — and this was the one pinned at UNIT grain only, so no artifact in
     *        the diff showed what a driver actually reads
     *        (`ergo-friction-hazards` nitpick.1 at i019, `rule.forbid.friction-hazards` .how 4).
     *
     * ⚠️ .note = `--as absorbed` rather than `--as passed`, deliberately. `absorbed` OWNS
     *            `--that` and does NOT own `--into`, so it is the one verb that proves the
     *            refusal reads a TABLE rather than a per-flag `if` — the exact shape that
     *            shipped three times and forgot the fourth flag.
     */
    when('[t2] the flag is well-formed, on a verb that does not own it', () => {
      const result = useThen('exits with a usage error', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'absorbed',
            that: 'all-done',
            into: './review/self/for.1._.all-done.md',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('names the flag and the verbs that DO own it', () => {
        expect(result.stderr).toContain(
          '--into is only accepted for --as promised',
        );
      });

      then('echoes the verb the driver actually typed', () => {
        // .why = "only accepted for X" alone leaves the driver to recall what they typed.
        //        the echo is what makes a mistyped verb visible with no scrollback
        expect(result.stderr).toContain('you passed --as absorbed');
      });

      then('hands back a RUNNABLE command', () => {
        expect(result.stderr).toContain(
          '--as promised --that <slug> --into <path-you-wrote-to>',
        );
      });

      then('the SIBLING flag is not what is refused', () => {
        // 🔴 .why = `absorbed` owns `--that`, and both flags are present. a per-flag `if`
        //    chain passes this only by accident; the table answers it by construction
        expect(result.stderr).not.toContain('--that is only accepted');
      });

      then('burns no attempt — the decision is never reached', async () => {
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await getRouteDirFiles(routeDir);
        const uptils = files.filter((f) => f.endsWith('.triggered.uptil'));
        expect(uptils).toEqual([]);
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = the SECOND face of `challenge:stale` — a file the driver wrote moments before
   *         the guard asked, so both stamps render to the same second
   * .why = `case9` covers the plain branch by an hour-old back-date, so the stamps differ and
   *         the identical-render branch is never reached. that branch is a distinct blocked
   *         state a driver can meet: the path keys on `(stone, slug)` and is computable by
   *         hand, so a driver who reads, writes their findings, and THEN runs `--as passed`
   *         lands inside the freshness bar — and when the write and the ask share a second,
   *         "it is older than the question" reads as a malfunction rather than as a fix.
   *
   * ⚠️ .note = the two mtimes are STAGED, never raced. both are pinned into one UTC second
   *            with the write strictly first, so the verdict is stale (raw ms) while the two
   *            operands a human reads are equal (second precision). a real-clock test of the
   *            same branch would be a flake with a sub-second window.
   */
  given('[case11] an articulation written in the same second as the ask', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case11',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case11', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — this mints the trigger, and its `.since` mtime is the datum
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      // a real review, at the owed path — written 650ms BEFORE the ask, inside its second
      const articulationPath = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath), { recursive: true });
      await fs.writeFile(
        articulationPath,
        '# self-review\n\ni read the artifact and here is what i found.',
      );

      // 🔴 pin both stamps into ONE utc second, write strictly first.
      //    the raw ms decide the verdict (stale); the floored stamps decide the words
      const askAt = new Date('2026-01-01T12:00:00.750Z');
      const writtenAt = new Date('2026-01-01T12:00:00.100Z');
      await fs.utimes(articulationPath, writtenAt, writtenAt);
      for (const sincePath of await getAskMarkerPaths({
        tempDir,
        stone: '1',
        slug: 'all-done',
      })) {
        await fs.utimes(sincePath, askAt, askAt);
      }

      return { tempDir, articulationPath };
    });

    when('[t0] the promise names that file', () => {
      const result = useThen('returns challenge:stale', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('names the sub-second gap, so the two equal stamps read as sane', () => {
        // .why = the bite. drop the identical-render branch and the driver is told their
        //        file is "older than the question" beside two stamps that look the same
        expect(result.stdout).toContain('the two read alike');
        expect(result.stdout).toContain('you wrote it just before the guard asked');
      });

      then('names the fix as a RE-SAVE, never a re-read', () => {
        // .why = the words are probably fine; only the stamp is wrong. to tell this driver
        //        to "read what is there now" sends them to redo work they already did
        expect(result.stdout).toContain('re-save the file');
        expect(result.stdout).not.toContain('read what is there now');
      });

      then('does NOT reproach the driver for haste', () => {
        // .why = the same D5 bound case9 carries — a date defect earns no haste cue
        expect(result.stdout).not.toContain('what is the rush');
        expect(result.stdout).not.toContain('patience, friend');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = the cheapest bypass `S13`'s design concedes, walked end to end
   * .why = a driver who waits 31s and promises ONCE with a garbage articulation is
   *        indistinguishable from `case1`'s thorough driver — by construction, since elapsed
   *        time is all the cue sees. the round HEADLINES this as its own residual, and it was
   *        asserted at unit level only, so no artifact showed what the driver actually meets.
   *
   * 🔴 .note = this case is a RECORD of a known hole, never a demand that it close. it goes
   *            red if a future round makes the cue fire outside its window, or makes the
   *            articulation gate read the prose — either is a design change, not a regression.
   * ⚠️ .note = the wait is STAGED via a back-dated ask, never slept. a real 31s sleep would
   *            pay the exact cost this round removed, in the suite that proves it removed.
   */
  given('[case12] a driver who waits out the cue window without a read', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case12',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case12', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] the ask lands', () => {
      const result = useThen('the guard hands out the review', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero — the self review is owed', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] 31s pass, and a two-word articulation is promised ONCE', () => {
      const result = useThen('the promise is allowed', async () => {
        // the wait, staged — the ask is moved 31s into the past
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });

        // the garbage — at the owed path, fresher than the ask, and no review at all
        const articulationPath = getSelfReviewArticulationPath({
          route: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        await fs.mkdir(path.dirname(articulationPath), { recursive: true });
        await fs.writeFile(articulationPath, 'looks good\n');

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0 — the promise is recorded', () => {
        expect(result.code).toEqual(0);
      });

      then('the haste cue never fires', () => {
        // 🔴 the residual, pinned. the cue reads elapsed time alone, so an idle wait
        //    presents exactly as a thorough read does
        expect(result.stdout).not.toContain('what is the rush');
        expect(result.stdout).not.toContain('patience, friend');
      });

      then('the articulation gate does NOT read the prose', () => {
        // .why = a two-word file at the owed path with a fresh mtime clears every check the
        //        guard makes. that is the bound on requirement 2, stated as a test
        expect(result.stdout).not.toContain('predates the ask');
        expect(result.stdout).not.toContain('articulation is absent');
        expect(result.stdout).toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = a route author whose `.guard` still declares the retired `hashbar:` key
   * .why = the notice was unit-tested at two levels — the formatter renders, and the emit
   *        calls it — and driven end to end by neither. so the one span between "the
   *        formatter is correct" and "an author sees this on their terminal" was unproven:
   *        the real yaml parse into `RouteStoneGuard`, `asHashbarDeclaredReviews`, the
   *        `--as passed` branch, and stdout.
   *
   * 🔴 .note = `hashbar: 0` is the value under test on purpose. it was the commonest value in
   *            the wild — a bug report written in yaml — and a truthiness test would read it
   *            as absent, which is the one author who most needs to hear the key is dead.
   * ⚠️ .note = the key is ACCEPTED, never a throw. an author's guard was correct when it was
   *            written, so the route must still run; the notice is the whole remedy.
   */
  given('[case13] a guard that still carries the retired hashbar key', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case13',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case13', {
        cwd: tempDir,
      });

      // the guard an author wrote BEFORE the key was retired — `hashbar: 0` on one review,
      // and the peer review dropped, so the self-review branch is the one under test
      await fs.writeFile(
        path.join(tempDir, '1.stone.guard'),
        [
          'artifacts:',
          '  - $route/1.stone*.md',
          '',
          'reviews:',
          '  self:',
          '    - slug: all-done',
          '      hashbar: 0',
          '      say: |',
          '        did you complete all that was requested in this stone?',
          '',
          '    - slug: tests-pass',
          '      say: |',
          '        do all tests pass?',
          '',
          'judges: []',
          '',
        ].join('\n'),
      );

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] the author runs --as passed', () => {
      const result = useThen('the guard hands out the review', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('the route still runs — the key is accepted, never a throw', () => {
        // .why = a throw would halt a route on a key that was correct when it was written
        expect(result.code).not.toEqual(0);
        expect(result.stdout).toContain('review.self');
        expect(result.stdout).toContain('all-done');
      });

      then('the retirement notice reaches stdout, and names the review', () => {
        expect(result.stdout).toContain('hashbar is retired');
        expect(result.stdout).toContain('review.self.all-done');
      });

      then('the notice names the move the author must make', () => {
        expect(result.stdout).toContain('safe to delete the key');
      });

      then('a review that omits the key is NOT named', () => {
        // .why = the notice is per (stone, slug); `tests-pass` omits hashbar, so an author
        //        who reads it must not be sent to edit a review that is already clean
        expect(result.stdout).not.toContain('review.self.tests-pass');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = a promise that arrives after a REWIND, with no re-ask on record
   * .why = 🔴 the round's most severe repair shipped with **zero** acceptance coverage, and
   *        two i006 lanes raised it independently. the verdict was clamped by 8 unit
   *        assertions and driven end to end by none — which is the identical shape that let
   *        the defect itself survive 11 review rounds: correct at the unit grain, blind at
   *        the CLI.
   *
   * 🔴 .note = the rewind is REAL here, never a hand-deleted marker. that is the whole point:
   *            the reachability argument in `formatNoAskOnRecord`'s docblock is a claim about
   *            `archiveStoneSelfReviewTriggers`, and only a real `--as rewound` tests it. a
   *            fixture that unlinks `.since` by hand would prove the verdict renders and would
   *            prove the state reachable not at all.
   * 🔴 .note = the articulation is written BEFORE the rewind and left in place. it is the
   *            pre-rewind file the laundered ask used to wave through, so its survival across
   *            the rewind is what makes `[t0]` the actual defect rather than a near neighbour.
   */
  given('[case14] a promise after a rewind, with no re-ask', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case14',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case14', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — this mints the trigger the rewind will archive
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      // the driver's review, written while the ask stood
      const articulationPath = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath), { recursive: true });
      await fs.writeFile(
        articulationPath,
        '# self-review\n\nread it, and here is what it told me.',
      );

      // the ask minted above, confirmed present BEFORE the rewind
      const asksBefore = await getAskMarkerPaths({
        tempDir,
        stone: '1',
        slug: 'all-done',
      });

      // 🔴 the rewind — this is what archives the ask out from under the promise
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'rewound' },
        cwd: tempDir,
      });

      const asksAfter = await getAskMarkerPaths({
        tempDir,
        stone: '1',
        slug: 'all-done',
      });

      return { tempDir, articulationPath, asksBefore, asksAfter };
    });

    when('[t0] the driver re-promises the articulation that survived', () => {
      const result = useThen('returns challenge:unasked', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        }),
      );

      then('the precondition holds — the rewind really did archive the ask', () => {
        // .why = the case is worthless if the ask survived. this asserts the SETUP reached the
        //        state under test, so a later change to the rewind cannot make [t0] vacuous
        expect(scene.asksBefore.length).toBeGreaterThan(0);
        expect(scene.asksAfter).toEqual([]);
      });

      then('the promise is refused', () => {
        expect(result.code).not.toEqual(0);
      });

      then('names the absent ask, and both operands', () => {
        expect(result.stdout).toContain('no ask on record');
        expect(result.stdout).toContain('stone = 1');
        expect(result.stdout).toContain('slug  = all-done');
      });

      then('names the two gates that cannot run', () => {
        // .why = the harm is that both would have been SKIPPED and read as passed. a driver
        //        who is told only "refused" learns the what and never the why
        expect(result.stdout).toContain(
          'the freshness bar has no date to measure',
        );
        expect(result.stdout).toContain('the haste cue has no start');
      });

      then('names the one command that recovers, and it is the ASK', () => {
        expect(result.stdout).toContain('--as passed');
      });

      then('does NOT hand out the promise guide', () => {
        // 🔴 .why = the wire. the four other verdicts share a `formatSelfReviewGuide` tail
        //           that names the owed path and the PROMISE command — and a driver with no
        //           ask must not promise again, they must ask. this verdict sits outside
        //           that union guard on purpose, and this is the assertion that pins it
        expect(result.stdout).not.toContain('articulate into');
      });

      then('does NOT reproach the driver for haste or for the file', () => {
        // .why = D5's mirror. the file may be perfect; what is absent is the ask it answers
        expect(result.stdout).not.toContain('what is the rush');
        expect(result.stdout).not.toContain('articulation is absent');
        expect(result.stdout).not.toContain('predates the ask');
      });

      then('the promise was NOT recorded', async () => {
        // 🔴 .why = the sharpest assertion here. the defect was that this state LAUNDERED an
        //           ask and cleared the review — so "refused" is only half the claim; the
        //           other half is that no ask was minted behind the driver's back
        const asks = await getAskMarkerPaths({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        expect(asks).toEqual([]);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the driver declares the WRONG path, still with no ask', () => {
      const result = useThen('still returns challenge:unasked', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: './review/self/for.1.stone._.r1.all-done.md',
          },
          cwd: scene.tempDir,
        }),
      );

      then('the absent ask outranks the path mismatch', () => {
        // 🔴 .why = the D5 MIRROR, and it was enforced by `if`-statement order alone. D5 ranks
        //           a verdict the driver can ACT on above one they cannot; here the driver's
        //           one move is the same whatever the path says — re-ask — and the ask's own
        //           emit then hands them the owed path. so a path report first would buy a
        //           round trip to learn a lesson the next command supersedes
        expect(result.stdout).toContain('no ask on record');
        expect(result.stdout).not.toContain('is not the path the guard checks');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] the driver re-asks, then promises', () => {
      const result = useThen('the review clears', async () => {
        // the ask, re-minted by the command the verdict named
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // the review is re-read against what stands now, and re-saved
        await fs.writeFile(
          scene.articulationPath,
          '# self-review\n\nre-read after the rewind, and here is what it told me.',
        );
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('the verdict is gone — it was a precondition, never a wall', () => {
        // 🔴 .why = the assertion that is easiest to skip and matters most. a clamp that only
        //           proves the refusal would let a future "refuse harder" edit make the state
        //           unrecoverable and stay green. this pins the way OUT
        expect(result.stdout).not.toContain('no ask on record');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = the SERIAL LADDER, proven through the CLI a real driver uses
   * .why = the wish's headline claim is that a driver who repairs mid-review is never charged
   *        for it. this walks that claim end to end at the boundary: ask, repair, promise, then
   *        the next ask — and it clamps the two properties that make the ladder honest.
   *
   * 🔴 .note = `[t1]` is the wish's own defect, staged. the driver repairs the DELIVERABLE
   *            while their window is open — exactly what the guard's `for each found issue 🪘`
   *            block instructs. under the hash key that write re-keyed their own trigger
   *            filename, so their lookup read `absent`, minted a fresh ask dated now, and
   *            confronted them for their own obedience. the assertion is that the ask is
   *            byte-identical across the repair — same path, same content, same mtime.
   *
   * 🔴 .note = `[t0]` and `[t4]` clamp the ONE-AT-A-TIME hand-out, from both sides. the ask
   *            names one slug and mints one trigger; the second slug gets neither until it is
   *            actually asked for. ⇒ that is not tidiness — `.since` IS the ask, and the haste
   *            cue reads elapsed-since-the-ask, so a trigger minted early would stamp slug 2's
   *            ask forty minutes before the driver ever met slug 2 and the cue could never
   *            reach them. this emit and this mint are the only two places that could break it.
   *
   * 🔴 .note = `[t3]` is the TOOTH. an out-of-order promise finds no ask and is refused rather
   *            than served — and the refusal mints naught, because a guard that minted an ask
   *            to satisfy the promise in front of it would launder a review nobody requested.
   *
   * ⚠️ .note = the repair writes `1.stone.i1.md`, the DELIVERABLE, never an articulation.
   *            `artifact` is an overload and the round already paid for it once: two headline
   *            clamps were written against a review file that the hash never read, so both went
   *            green under the defect (yield item 16). only the deliverable is in the hashed set.
   *
   * 🟡 .note = this was `[case15] two lanes fork, and one repairs inside the other’s window`
   *            until 2026-09-24. the fork was withdrawn — it invited a parallelism the guide
   *            layer could not serve, since the guide renders only for the review in hand and
   *            the route is sealed. the cross-lane scene is gone; the repair-mid-window claim
   *            it carried is unchanged and is stronger here, because the lane charged for the
   *            repair is now the same lane that made it.
   */
  given('[case15] the ladder is serial, and a repair mid-review costs naught', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case15',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-review.self-case15', {
        cwd: tempDir,
      });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // the DELIVERABLE under review — this is what the artifact hash reads
      const deliverablePath = path.join(tempDir, '1.stone.i1.md');
      await fs.writeFile(
        deliverablePath,
        '# Implementation v1\n\nFeature implemented.',
      );

      // the mock reviewer must pass, so the stone reaches its self reviews
      await fs.writeFile(path.join(tempDir, '.test', 'review-should-pass'), '');

      return { tempDir, deliverablePath };
    });

    when('[t0] the guard hands out ONE review', () => {
      const result = useThen('the ask lands', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('an ask is minted for the named slug, and for it alone', async () => {
        // 🔴 .why = `.since` IS the ask, and the haste cue reads elapsed-since-the-ask. a
        //           trigger minted for `tests-pass` here would date its ask to THIS moment —
        //           so by the time the driver is actually handed `tests-pass`, minutes later,
        //           `elapsed < window` can never hold and the cue is dead for it. ⇒ the
        //           second assertion is the clamp on that, and it goes red on a mint-all
        expect(result.code).not.toEqual(0);
        const asksNamed = await getAskMarkerPaths({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        const asksUnnamed = await getAskMarkerPaths({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'tests-pass',
        });
        expect(asksNamed.length).toEqual(1);
        expect(asksUnnamed.length).toEqual(0);
      });

      then('the other slug is withheld, so the ladder stays one at a time', () => {
        // 🔴 .why = the route is SEALED — a driver cannot read the `.guard` file — so this
        //           emit is the only surface that could ever name the other slug. while it
        //           names one, slug N+1 is reachable only once slug N is promised, and the
        //           serial contract holds by construction rather than by a refusal branch
        expect(result.stdout).toContain('all-done');
        expect(result.stdout).not.toContain('tests-pass');
      });

      then('stdout has good vibes', () => {
        // 🔴 .why = the two `toContain` checks above prove which slugs APPEAR without proof
        //           of what the driver reads. a reviewer cannot vibe-check "is this legible
        //           as one clear instruction?" from a pair of booleans; the snapshot is the
        //           only window onto that — and it is where a re-added roster would show
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the driver repairs the deliverable, inside their own window', () => {
      const observed = useThen('the repair lands', async () => {
        const askPathBefore = (
          await getAskMarkerPaths({
            tempDir: scene.tempDir,
            stone: '1',
            slug: 'all-done',
          })
        )[0]!;
        const before = {
          path: askPathBefore,
          content: await fs.readFile(askPathBefore, 'utf-8'),
          mtimeMs: (await fs.stat(askPathBefore)).mtimeMs,
          // 🔴 the path the GUARD COMPUTES, not the one that happens to sit on disk.
          //    an on-disk read alone is green under the defect — a re-key mints no new
          //    file until the guard next runs, so the old marker is trivially unchanged.
          //    this is the operand that actually moves (proven: the bite check caught it)
          computed: getSelfReviewTriggeredPaths({
            stone: '1',
            slug: 'all-done',
            route: scene.tempDir,
          }).sincePath,
        };

        // 🔴 the driver improves the deliverable — exactly what the guard's own
        //    `for each found issue 🪘` block instructs. the review is STILL unpromised
        await fs.writeFile(
          scene.deliverablePath,
          '# Implementation v2\n\nFeature improved, per the review’s read.',
        );

        const asksAfter = await getAskMarkerPaths({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        const askPathAfter = asksAfter[0];
        return {
          before,
          asksAfter,
          computedAfter: getSelfReviewTriggeredPaths({
            stone: '1',
            slug: 'all-done',
            route: scene.tempDir,
          }).sincePath,
          after: askPathAfter
            ? {
                path: askPathAfter,
                content: await fs.readFile(askPathAfter, 'utf-8'),
                mtimeMs: (await fs.stat(askPathAfter)).mtimeMs,
              }
            : null,
        };
      });

      then('there is still exactly one ask — the repair minted none', () => {
        expect(observed.asksAfter.length).toEqual(1);
      });

      then('the path the gate COMPUTES is unmoved by the repair', () => {
        // 🔴 .why = THE assertion of this case, and the wish's own defect. the trigger report
        //           was keyed (stone, slug, hash), and its filename CARRIED the hash — so the
        //           repair moved the file the gate looks for. the gate then read `absent`,
        //           minted a fresh ask dated now, and confronted the driver for their own work
        // ⚠️ .why the COMPUTED path and not the on-disk one = an on-disk equality is green
        //           under the defect. a re-key mints no file until the guard next runs, so the
        //           old marker sits there untouched and the compare passes while the gate is
        //           already broken. the bite check caught exactly that, in this very assertion
        expect(observed.computedAfter).toEqual(observed.before.computed);
      });

      then('and the ask it points at is still there, byte for byte', () => {
        // .why = the computed path is the operand that moves; this is the second half —
        //        the repair neither rewrote the marker nor re-dated the ask the gates read
        expect(observed.after).not.toBeNull();
        expect(observed.after!.path).toEqual(observed.before.path);
        expect(observed.after!.content).toEqual(observed.before.content);
        expect(observed.after!.mtimeMs).toEqual(observed.before.mtimeMs);
      });

      /**
       * 🔴 .why the LITERAL on both operands = an equality can hold by luck; a named
       *    basename cannot. this pins BOTH the marker on disk and the path the guard
       *    computes to the hashless name, so a re-keyed design goes red here even if
       *    the two operands happen to agree with each other.
       *
       * ⚠️ .note = a `toMatchSnapshot` of these values stood here until i002 and was
       *    removed. it pinned a flat object of test-computed booleans
       *    (`askBytesUnmoved`, `askDateUnmoved`, …) — internal assertion state, never
       *    output a driver meets. this step runs no cli, so it renders no artifact for
       *    `rule.forbid.snapshot-visual-blemishes` to grade, and the dump broke the
       *    treestruct format every other export in this corpus carries. each field it
       *    held is asserted by name in the four `then` blocks here, so the removal
       *    costs no coverage — it moves the same claims from an opaque blob to
       *    assertions that say what they mean.
       */
      then('and both operands carry the hashless name, by literal', () => {
        const hashless = '1.guard.selfreview.all-done.triggered.since';
        expect(path.basename(observed.before.path)).toEqual(hashless);
        expect(path.basename(observed.before.computed)).toEqual(hashless);
        expect(path.basename(observed.computedAfter)).toEqual(hashless);
      });
    });

    when('[t2] the driver promises, after their own repair', () => {
      const result = useThen('the promise lands', async () => {
        const articulationPath = getSelfReviewArticulationPath({
          route: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        await fs.mkdir(path.dirname(articulationPath), { recursive: true });
        await fs.writeFile(
          articulationPath,
          '# self-review\n\nread it all, and here is what it found.',
        );
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('it clears — the driver was never charged for their repair', () => {
        expect(result.code).toEqual(0);
      });

      then('and it meets no confrontation it did not earn', () => {
        expect(result.stdout).not.toContain('no ask on record');
        expect(result.stdout).not.toContain('what is the rush');
        expect(result.stdout).not.toContain('articulation is absent');
      });

      then('stdout has good vibes', () => {
        // 🔴 .why = the round's headline claim, and the assertion above states it as three
        //           ABSENCES. a reviewer reads "these three words are absent" and still
        //           cannot tell what the driver actually saw. this is the step that renders
        //           "never charged for your own repair" as a thing you can look at
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] the driver runs ahead and promises the un-asked slug', () => {
      const result = useThen('the out-of-order promise lands', async () => {
        await fs.writeFile(
          getSelfReviewArticulationPath({
            route: scene.tempDir,
            stone: '1',
            slug: 'tests-pass',
          }),
          '# self-review\n\nread the tests, ahead of being asked.',
        );
        const promised = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'tests-pass',
            into: asOwedPath({ stone: '1', slug: 'tests-pass' }),
          },
          cwd: scene.tempDir,
        });
        return {
          promised,
          asksAfter: await getAskMarkerPaths({
            tempDir: scene.tempDir,
            stone: '1',
            slug: 'tests-pass',
          }),
        };
      });

      then('it is REFUSED — that slug has no ask on record', () => {
        // 🔴 .why = the tooth. the articulation is real and well-placed, so every other gate
        //           would have passed it; the only thing absent is the ASK. ⇒ the serial
        //           ladder is not merely undiscoverable now, it is enforced
        expect(result.promised.code).not.toEqual(0);
        expect(result.promised.stdout).toContain('no ask on record');
      });

      then('and the refusal minted no ask to satisfy itself', async () => {
        // 🔴 .why = a guard that minted an ask here would LAUNDER a review nobody requested,
        //           and would date it now — so a pre-ask articulation reads as fresh against
        //           a timestamp that postdates it. that is the freshness bar's own defect,
        //           entered from the other side
        expect(result.asksAfter.length).toEqual(0);
      });

      then('stdout has good vibes', () => {
        expect(
          sanitizeTimeForSnapshot(result.promised.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t4] the driver asks again, and gets the second review', () => {
      const result = useThen('the second ask lands', async () => {
        const askedAfter = Date.now();
        const asked = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        const asks = await getAskMarkerPaths({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'tests-pass',
        });
        const askMtimeMs = asks[0]
          ? (await fs.stat(asks[0])).mtimeMs
          : null;

        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'tests-pass',
        });
        const promised = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'tests-pass',
            into: asOwedPath({ stone: '1', slug: 'tests-pass' }),
          },
          cwd: scene.tempDir,
        });
        const passed = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        return { askedAfter, asked, asks, askMtimeMs, promised, passed };
      });

      then('NOW the second slug has its ask, and the driver is told', () => {
        expect(result.asks.length).toEqual(1);
        expect(result.asked.stdout).toContain('tests-pass');
      });

      /**
       * 🔴 .why = the clamp on the lazy mint, and the one bar that states WHY the ladder is
       *    served one at a time rather than merely rendered that way. `.since` is the ask,
       *    and the haste cue reads elapsed-since-the-ask. a mint-all would have stamped this
       *    ask back at `[t0]`, before the repair, the promise and the refusal — so this
       *    comparison goes red, and the cue would be dead for every review after the first.
       */
      then('and its clock starts NOW, never back at the first ask', () => {
        expect(result.askMtimeMs).not.toBeNull();
        expect(result.askMtimeMs!).toBeGreaterThanOrEqual(result.askedAfter);
      });

      then('the second review clears', () => {
        expect(result.promised.code).toEqual(0);
      });

      then('both reviews are satisfied, so the stone passes', () => {
        // .why = the ladder's end state. two reviews, one repair mid-flight, no charge for
        //        the repair, and the review ladder is discharged in full
        expect(result.passed.code).toEqual(0);
      });

      then('the second ask has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.asked.stdout)).toMatchSnapshot();
      });

      then('the second clear has good vibes', () => {
        expect(
          sanitizeTimeForSnapshot(result.promised.stdout),
        ).toMatchSnapshot();
      });

      then('and the stone’s passage has good vibes', () => {
        // .why = the arc's destination. with [t0]'s one-at-a-time hand-out, [t1]'s untouched
        //        ask, [t2]'s unconfronted clear and [t3]'s refusal beside it, a reviewer can
        //        read the whole serial ladder from the snapshots alone
        expect(sanitizeTimeForSnapshot(result.passed.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * 🔴 .why = invariant 5 — "only a promise the guard adjudicated may increment the attempt
   *           count" — at ACCEPTANCE grain. under the clock a leaked increment merely drifted
   *           a driver toward a liveness hatch; since `S13` the count is HALF the gate
   *           condition, so M lanes that each burn an attempt on ONE slug would clear the
   *           haste cue with no read at all. that is a bypass, never a delay.
   *
   * 🟡 .note = `case15` walks two DIFFERENT slugs in sequence, so it exercises the ladder and
   *            never the collision. the property here — two promises, ONE slug — rode inside
   *            it by inference until a peer lane named the gap at i011.
   *
   * 🟡 .note = the collision is rarer since the fork was withdrawn, and it is NOT unreachable:
   *            a driver may still run two commands at once by hand, a retry may double-fire,
   *            and `firstAdjudication` is won by an exclusive create precisely so the answer
   *            does not depend on who is careful. ⇒ the case stays.
   */
  given('[case16] two lanes promise the SAME slug', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case16',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-review.self-case16', {
        cwd: tempDir,
      });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation v1\n\nFeature implemented.',
      );
      await fs.writeFile(path.join(tempDir, '.test', 'review-should-pass'), '');

      // the ask — both lanes then hold the same slug
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });
      const articulationPath = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath), { recursive: true });
      await fs.writeFile(
        articulationPath,
        '# self-review\n\nboth lanes read the same slug, and both found it sound.',
      );

      // 🔴 the ask is NOT back-dated, deliberately. a back-dated ask puts BOTH lanes
      //    outside the cue window, so "the second lane meets no confrontation" would pass
      //    however the gate were wired — a clamp with no teeth. left current, lane A is
      //    inside the window AND first, so it earns the cue; lane B is inside the window
      //    and NOT first. only `firstAdjudication` can part them, which is the bound
      return { tempDir };
    });

    when('[t0] both lanes promise it, one after the other', () => {
      const result = useThen('both promises land', async () => {
        const promise = async () =>
          invokeRouteSkill({
            skill: 'route.stone.set',
            args: {
              stone: '1',
              route: '.',
              as: 'promised',
              that: 'all-done',
              into: asOwedPath({ stone: '1', slug: 'all-done' }),
            },
            cwd: scene.tempDir,
          });
        const laneA = await promise();
        const laneB = await promise();
        return { laneA, laneB };
      });

      then('lane A earns the cue — it is first, and inside the window', () => {
        // the cue REFUSES the promise once: `challenge:rushed` returns challenged, and
        // the cli turns that into a non-zero exit. one command, no wait
        expect(result.laneA.code).not.toEqual(0);
      });

      then('lane B clears — the cue fires at most ONCE per slug', () => {
        // 🔴 the bound, and the one assertion in this case that can only pass for the
        //    right reason. lane B sits inside the same window as lane A, so elapsed time
        //    cannot part them — `firstAdjudication` is the sole operand that does. drop it
        //    from the condition and lane B is confronted too, and this goes red
        expect(result.laneB.code).toEqual(0);
        expect(result.laneB.stdout).not.toContain('no ask on record');
      });

      then('exactly one promise artifact is on disk', async () => {
        const routeFiles = await getRouteDirFiles(
          path.join(scene.tempDir, '.route'),
        );
        const promises = routeFiles.filter((file) =>
          file.includes('guard.promise.all-done'),
        );
        expect(promises).toHaveLength(1);
      });

      then('first-ness is claimed exactly ONCE, however many lanes promise', async () => {
        // 🔴 the operand invariant 5 is actually about, and it is NOT the tally. the haste
        //    cue reads `firstAdjudication`, won by an atomic `wx` create of `.uptil`, so
        //    exactly one lane can hold it — that single marker IS the "at most once per
        //    slug" bound, and a second lane physically cannot re-win it
        const routeFiles = await getRouteDirFiles(
          path.join(scene.tempDir, '.route'),
        );
        const uptils = routeFiles.filter((file) =>
          file.includes('selfreview.all-done.triggered.uptil'),
        );
        expect(uptils).toHaveLength(1);
      });

      then('the tally counts both commands, and gates on neither', async () => {
        // 🔴 the DISTINCTION the i010 repair established, asserted rather than assumed: a
        //    second promise DOES raise the diagnostic tally to 2, and that is correct — it
        //    counts adjudications. it is not a leak, because no gate reads it. the bound
        //    that matters is the `.uptil` above, which a second lane cannot take.
        // ⚠️ an `attempts: 1` here would be the WRONG clamp — it would assert the tally is
        //    the gate operand, which is the very confusion that let a diagnostic fault
        //    disable the claim beside it for a whole round
        //
        // 🔴 .note = this read `.since` until i013, and the CLAIM above is unchanged — only
        //            the file it lives in moved. i010 gave the tally its own failure domain;
        //            i013 gave it its own FILE, because a tally write into `.since` rewrote
        //            the very marker whose mtime the gate reads. ⇒ so the two reads below
        //            are one assertion in two halves: the tally rose to 2, and the gate
        //            operand was untouched while it rose
        const { sincePath, attemptsPath } = getSelfReviewTriggeredPaths({
          stone: '1',
          slug: 'all-done',
          route: scene.tempDir,
        });
        expect(await fs.readFile(attemptsPath, 'utf-8')).toContain(
          'attempts: 2',
        );
        expect(await fs.readFile(sincePath, 'utf-8')).not.toContain('attempts');
      });

      /**
       * 🔴 .why lane A earns a pin too = its only grade above is an exit code, and an exit
       *    code cannot tell the cue apart from any other refusal this gate can render —
       *    a mismatch, an absence, a stale file all exit non-zero too. so the claim
       *    "lane A earns the CUE" rested on a variant pinned only in `[case5]`, and a
       *    re-key there would have cost this case its pin with no test that turns red
       *    (`ergo-contract-snapshots` nitpick.1 at i002). ⇒ the PAIR is this case's
       *    subject, so the pair is what it must pin
       */
      then('lane A’s cue has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.laneA.stdout)).toMatchSnapshot();
      });

      then('lane B’s clear has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.laneB.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * 🔴 .what = a MISPLACED declaration whose owed file is PRESENT, fresh, and correct — the
   *            one scene that parts `challenge:mismatch` from `challenge:absent`.
   *
   * 🔴 .why = `[case8][t0]` is the corpus's only acceptance mismatch scene and it leaves
   *           BOTH paths empty, so its refusal is consistent with either verdict. ⇒ a reader
   *           cannot tell from it whether the guard refused the PATH or the ABSENCE, and the
   *           driver who most needs the answer is the one who did the work and typed the flag
   *           wrong (`enroll-impl-behavior-intent` blocker.2 at i020; fulcrums `F04`/`F05`).
   *
   * ⚠️ .note = the behavior under test is a SHIPPED GUESS, never a ruled one. `F04` (70%) and
   *            `F05` (75%) ask whether the guard should hunt for a near-miss and accept it;
   *            the council has ruled neither. this case does NOT settle that — it PINS what
   *            ships today, so a later verdict changes a snapshot rather than a mystery.
   *
   * 🔴 .note = the case therefore clamps the ORDER of the verdicts, which is a real design
   *            commitment: the path is checked with both operands in hand and BEFORE the file
   *            is stat'd, so the driver is told about the flag they mistyped rather than about
   *            a file that rests exactly where it belongs.
   */
  given('[case17] a misplaced declaration whose owed file is present', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case17',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-review.self-case17', {
        cwd: tempDir,
      });

      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — so a trigger is on record and `challenge:unasked` cannot pre-empt
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      // 🔴 the whole point of the case: a REAL articulation, at the OWED path, written
      //    AFTER the ask. every gate downstream of the path check would pass it
      const owed = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(owed), { recursive: true });
      await fs.writeFile(
        owed,
        '# self-review\n\nread it line by line; the guard path is the one defect found.',
      );

      return { tempDir, owed };
    });

    when('[t0] only the DECLARED path is wrong', () => {
      const result = useThen('returns challenge:mismatch', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            // the stale `rN`-shaped path a driver copies from an older prompt
            into: './review/self/for.1._.r1.all-done.md',
          },
          cwd: scene.tempDir,
        }),
      );

      then('the owed file really is there, and really is fresh', async () => {
        // ⚠️ the case's own precondition, asserted rather than assumed — without this the
        //    mismatch below could be a plain `absent` scene under a different name
        expect(await isPathFound(scene.owed)).toEqual(true);
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('the verdict is the PATH, not the absence', () => {
        expect(result.stdout).toContain('not quite there');
        expect(result.stdout).toContain('you named');
        expect(result.stdout).toContain('it is owed');
      });

      then('🔴 it does NOT claim the articulation is absent', () => {
        // 🔴 THE bite of this case, and the one `[case8][t0]` cannot make: a file IS on disk
        //    at the owed path, so an `absent` verdict here would be a flat lie to a driver
        //    who did the work. `[case8][t0]` passes this string check for free, because no
        //    file is on disk there either way
        expect(result.stdout).not.toContain('articulation is absent');
        expect(result.stdout).not.toContain('promise without words');
      });

      then('does NOT tell the driver to slow down', () => {
        // .why = this driver was thorough. the haste cue is last in the order precisely so a
        //        path defect is never dressed up as impatience
        expect(result.stdout).not.toContain('what is the rush');
      });

      then('the promise is NOT recorded', async () => {
        // .why = a refusal that still filed the promise would be the worst of both — the
        //        driver is scolded and the checkpoint lands anyway
        const routeFiles = await getRouteDirFiles(
          path.join(scene.tempDir, '.route'),
        );
        const promises = routeFiles.filter((file) =>
          file.includes('guard.promise.all-done'),
        );
        expect(promises).toEqual([]);
      });

      then('🔴 it burns no FIRST-NESS either', async () => {
        // 🔴 .why = MEASURED, never assumed — `[t1]` met the haste cue on the first run of
        //    this case, and this is why: a mismatch refusal returns before any `.uptil` is
        //    claimed, so the driver's one-per-slug confrontation is still unspent.
        //
        //    ⇒ that is the RIGHT behavior and it is worth a clamp. the alternative — burn
        //    first-ness on a path typo — would spend a driver's single haste cue on a
        //    verdict that never read their articulation at all, and no later attempt could
        //    ever earn it back (the claim is an atomic `wx`, so it is won exactly once)
        const routeFiles = await getRouteDirFiles(
          path.join(scene.tempDir, '.route'),
        );
        const uptils = routeFiles.filter((file) =>
          file.endsWith('.triggered.uptil'),
        );
        expect(uptils).toEqual([]);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the same driver re-declares with the owed path', () => {
      const result = useThen('the promise lands', async () => {
        // ⚠️ the back-date is what makes this step test the PATH rather than the clock.
        //    without it the ask is seconds old — the suite is fast, a real driver is not —
        //    and the promise meets `challenge:rushed` instead. measured: the first run of
        //    this case returned exit 2 with `what is the rush?`, because `[t0]`'s mismatch
        //    left first-ness unspent (clamped above)
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1',
            route: '.',
            as: 'promised',
            that: 'all-done',
            into: asOwedPath({ stone: '1', slug: 'all-done' }),
          },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0 — the work was always sufficient', () => {
        // 🔴 the counter-half, and it is what makes `[t0]` a statement about the FLAG rather
        //    than about the review. the very same file on disk, untouched, now passes the
        //    path gate, the presence gate and the freshness bar — so `[t0]`'s refusal was
        //    about one mistyped string and naught else
        //
        // ⚠️ .note = the EXIT CODE is the assertion that carries this case, and it is the one
        //    a stdout check cannot stand in for. `promised` appears in the refusal prose too,
        //    so a stdout-only clamp would stay green under a guard that printed the word and
        //    returned 2 — which is precisely the failure this case exists to catch
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('promised');
        expect(result.stdout).not.toContain('not quite there');
      });

      then('the promise IS recorded now', async () => {
        const routeFiles = await getRouteDirFiles(
          path.join(scene.tempDir, '.route'),
        );
        const promises = routeFiles.filter((file) =>
          file.includes('guard.promise.all-done'),
        );
        expect(promises).toHaveLength(1);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case18] a rewind that clears LIVE self-review triggers', () => {
    /**
     * 🔴 .what = the `cleared: … N triggers` emit, with N > 0, driven through the real cli
     * .why = every extant acceptance case that rewinds a stone emits `0 triggers`, because
     *        no rewound stone in those scenes had ever been asked for a self review. so the
     *        non-zero branch — the one `F10` exists for, the one that invalidates `.since` —
     *        was proven at UNIT grain only (`setStoneAsRewound.test.ts [case16]`) and no
     *        snapshot in the repo had ever shown a driver what that line looks like.
     *
     * ⇒ this is the same "correct at unit grain, blind at cli" shape the round already
     *   closed for `challenge:unasked` (`[case14]`) and `challenge:mismatch` (`[case17]`).
     *   it was the one emit line left, and it was found by `enroll-impl-behavior-intent`
     *   at i021 — the only concern raised across twenty-one rounds that no lane, and no
     *   self review, had named before.
     *
     * ⚠️ `[case14]` already builds this exact scene and throws the rewind's stdout away. so
     *    the gap was never an absent SETUP; it was an un-read return value.
     */
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case18',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-review.self-case18', {
        cwd: tempDir,
      });

      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // the ask — this is what mints the triggers the rewind must clear
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      const triggersBefore = (
        await getRouteDirFiles(path.join(tempDir, '.route'))
      ).filter((file) => file.includes('guard.selfreview.'));

      // 🔴 the rewind, and THIS time its stdout is kept
      const rewind = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', route: '.', as: 'rewound' },
        cwd: tempDir,
      });

      const triggersAfter = (
        await getRouteDirFiles(path.join(tempDir, '.route'))
      ).filter((file) => file.includes('guard.selfreview.'));

      return { tempDir, rewind, triggersBefore, triggersAfter };
    });

    when('[t0] the rewind reports what it cleared', () => {
      then('the precondition holds — triggers really were on disk', () => {
        // .why = without this the case is vacuous: `0 triggers` would be the CORRECT emit
        //        for a stone that never carried one, which is exactly why every extant
        //        acceptance snapshot shows a zero
        expect(scene.triggersBefore.length).toBeGreaterThan(0);
      });

      then('the rewind succeeds', () => {
        expect(scene.rewind.code).toEqual(0);
      });

      then('🔴 exactly one cascade line reports a NON-ZERO trigger count', () => {
        // 🔴 THE bite, and it is the assertion no snapshot in this repo could make before,
        //    because none of them had a live trigger to clear. under a regression that
        //    stops the clear, every line reads `0 triggers` and this goes red
        //
        // ⚠️ .note = it reads ONE cascade line, never the whole emit, and the first draft
        //    got that wrong. a rewind cascades downstream, so the stdout legitimately
        //    carries a `0 triggers` line for the stone that never held one — a whole-stdout
        //    `not.toContain('0 triggers')` therefore fails on CORRECT behavior, and the only
        //    repairs available are to scope it or to delete it. deletion would have removed
        //    the case's whole bite, so the scope is what was owed
        const counts = asClearedTriggerCounts(scene.rewind.stdout);
        expect(counts.filter((count) => count > 0)).toHaveLength(1);
      });

      then('the count the emit prints equals the count on disk', () => {
        // .why = an emit that reports a plausible number it did not measure is the defect
        //        `rule.require.judge-derived-counts` forbids. this pins the emit to the
        //        filesystem rather than to a constant — and paired with the precondition
        //        above (`triggersBefore.length > 0`) it is the second, independent bite
        const counts = asClearedTriggerCounts(scene.rewind.stdout);
        expect(counts.filter((count) => count > 0)).toEqual([
          scene.triggersBefore.length,
        ]);
      });

      then('and the triggers are gone from .route', () => {
        // ⚠️ the emit and the disk are two claims, and only both together prove the clear.
        //    an emit alone could count files it never removed
        expect(scene.triggersAfter).toEqual([]);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(scene.rewind.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case19] a NAMED route, bound, with --route omitted', () => {
    /**
     * 🔴 .what = the articulation path the guard prints, when the route is a real
     *            directory name looked up from the BIND rather than handed in as a flag
     *
     * 🔴 .why = every other case in this corpus passes `route: '.'`, so every blackbox
     *           snapshot of an articulation path reads `./review/self/…`. that is a route
     *           segment ONE character wide, and the `c8′` defect this round repaired is
     *           exactly a dropped route segment: `setStoneAsPassed` built its emit with no
     *           `route` field, `formatRouteStoneEmit` collapsed it, and the guard told a
     *           driver to write to `/review/self/…` while it read `$route/review/self/…`.
     *
     *           ⇒ under `route: '.'` that regression renders `/review/self/…` against an
     *           expected `./review/self/…` — a ONE-CHARACTER diff, and the only reason the
     *           extant snapshots would catch it is the leading slash. that is luck, not a
     *           clamp. this case makes the route segment WIDE, so a drop is unmissable.
     *
     * 🔴 .why the flag is OMITTED = it is the second half of the claim. the unit snapshots
     *    (`formatWalkTheWay.test.ts.snap`, `formatRouteStoneEmit.test.ts.snap`) already pin
     *    a real route name, so the FORMATTER is proven. what no test covered is the wiring
     *    that carries a BOUND route from `route.bind.set` through the cli into the emit —
     *    and a flag-supplied route does not exercise it. the bind is the path a driver
     *    actually walks (`rhx route.drive` prints no `--route`), so it is the path that owes
     *    a clamp.
     *
     * .found = the wisher, after reading `./review/self/for.1._.all-done.md` in an emit and
     *          asking where the proof was that a real route renders its own relpath.
     */
    const ROUTE = '.behavior/my-feature';

    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case19',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-review.self-case19', {
        cwd: tempDir,
      });

      // 🔴 relocate the route into a NAMED directory — the whole point of the case.
      //    the fixture clones at the temp-dir root, where a route of '.' is the only
      //    option; a named route must be a real subdirectory for the bind to find it
      const routeDir = path.join(tempDir, ROUTE);
      await fs.mkdir(routeDir, { recursive: true });
      for (const file of ['0.wish.md', '1.stone', '1.stone.guard', '2.stone'])
        await fs.rename(path.join(tempDir, file), path.join(routeDir, file));

      await fs.writeFile(
        path.join(routeDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // bind, so the cli derives the route with NO --route flag on any later command
      const bind = await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: ROUTE },
        cwd: tempDir,
      });

      // 🔴 the ask — and note the absent `route:` key. that omission IS the test
      const ask = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', as: 'passed' },
        cwd: tempDir,
      });

      return { tempDir, bind, ask };
    });

    when('[t0] the guard asks for a self review', () => {
      then('the precondition holds — the bind took', () => {
        // .why = without this the case is vacuous. an unbound cli would refuse for an
        //        absent --route, and a refusal carries no articulation path at all, so
        //        every assertion below would read an empty string and this would go green
        //        for the wrong reason (rule.forbid.failhide)
        expect(scene.bind.code).toEqual(0);
      });

      then('🔴 the articulation path carries the FULL bound route', () => {
        // 🔴 THE bite. under the `c8′` regression this renders
        //    `/review/self/for.1._.all-done.md` and the route name is simply absent —
        //    a 20-character diff here, where the `route: '.'` cases see one character
        expect(scene.ask.stdout).toContain(
          `${ROUTE}/review/self/for.1._.all-done.md`,
        );
      });

      then('and the promise command it hands back carries it too', () => {
        // ⚠️ two call sites, two claims. `--as passed` and the `--into` it prints are
        //    rendered by DIFFERENT operations (`formatWalkTheWay` vs `formatPromiseCommand`),
        //    and the round measured the guard contradicting itself across exactly such a
        //    pair — the path was right in one emit and wrong in the other, four minutes
        //    apart. one assertion each, so a divergence cannot hide behind the other
        expect(scene.ask.stdout).toContain(
          `--into ${ROUTE}/review/self/for.1._.all-done.md`,
        );
      });

      then('no path is rendered root-absolute', () => {
        // 🔴 the negative half, and it is the one a re-take cannot absorb. a snapshot
        //    would silently adopt `/review/self/…` on the next `--resnap`; this bar
        //    cannot be re-taken, so the dropped-segment shape stays forbidden.
        //    the lookbehind lets `my-feature/review/self/` pass and refuses a bare
        //    leading slash — which is exactly what a collapsed route segment leaves
        expect(scene.ask.stdout).not.toMatch(/(?<![\w./-])\/review\/self\//);
      });

      then('stdout has good vibes', () => {
        // .why = the pin is what a reviewer reads to see the real shape — every extant
        //        articulation snapshot in this corpus shows `./review/self/…`, so this is
        //        the only one that shows a driver what a named route looks like
        expect(sanitizeTimeForSnapshot(scene.ask.stdout)).toMatchSnapshot();
      });
    });
  });
});

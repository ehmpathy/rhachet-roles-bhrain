import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-overrule-contemplation-discriminate',
);

/**
 * .what = R6 end-to-end — a preemptively-overruled LOWER level must not forgive a
 *         DIFFERENT (higher) level's contemplation, AND the block is proven to
 *         come from the CONTEMPLATION gate, not the reviewed? judge.
 * .why = the pure filter is unit-proven (computePeerUncontemplatedUnforgiven
 *        case3), but no acceptance journey exercised the composed CLI path where
 *        an l1 overrule leaves an uncontemplated l3 that still owes a reply. this
 *        suite discriminates the two hold-points that overrule-skip case1 (A2)
 *        conflated:
 *          - overrule-skip A2: judge budget 0, so the reviewed? JUDGE blocks l3
 *          - this suite:       judge budget 9, so the judge PASSES l3's blockers
 *                              on the tally and the CONTEMPLATION gate is what holds
 *
 * the 'the reviewers await your reply' prompt renders ONLY from the contemplation
 * gate (it lives inside allJudgesPassed in setStoneAsPassed). so its presence,
 * paired with a `judge.1 - allowed` verdict, is the discrimination: the reviewed?
 * judge already passed, and the hold is the l3 contemplation the l1 overrule did
 * NOT forgive.
 *
 * setup shape: l1 (basic-checker) is overruled BEFORE it ever runs (a preemptive
 * overrule targets the lowest level, l1); l3 (premium-checker) then runs, rejects,
 * and its blockers sit within the generous judge budget.
 */
describe('driver.route.overrule-contemplation-discriminate.acceptance', () => {
  const genScene = async (input: { slug: string }) => {
    const tempDir = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });
    await fs.writeFile(
      path.join(tempDir, '1.feature.md'),
      '# Feature\n\nImplemented.',
    );
    return tempDir;
  };

  const setStone = (input: {
    tempDir: string;
    as: 'passed' | 'overruled' | 'contemplated';
    that?: string;
  }) =>
    invokeRouteSkill({
      skill: 'route.stone.set',
      args: {
        stone: '1.feature',
        route: '.',
        as: input.as,
        ...(input.that ? { that: input.that } : {}),
      },
      cwd: input.tempDir,
    });

  given('[case1] l1 preemptively overruled, l3 blockers within judge budget → the contemplation gate holds passage', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-contemplation-discriminate' });
      // preemptive overrule: no review has run, so the active level is l1 — this
      // waves l1 (and never runs it), so no l1 contemplation is ever owed
      await setStone({ tempDir, as: 'overruled' });
      return { tempDir };
    });

    when('[t0] driver passes with l1 pre-overruled (l3 runs, rejects)', () => {
      const result = useThen('the contemplation gate holds passage', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage is BLOCKED (exit 2, constraint — not a malfunction)', () => {
        expect(result.code).toEqual(2);
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('DISCRIMINATION: the reviewed? judge ALLOWED, yet the stone is held', () => {
        // .why = the reviewed? judge tolerated l3's blockers (budget 9), so the
        //        judge is NOT the hold-point. an allowed judge + a still-blocked
        //        stone can only mean the contemplation gate is what holds — the
        //        exact seam overrule-skip A2 (judge budget 0, judge-blocked) could
        //        not reach.
        expect(result.stdout).toContain('judge.1 - allowed');
      });

      then('the hold is the CONTEMPLATION gate, scoped to l3 (premium-checker)', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('premium-checker');
      });

      then('R6: the l1 overrule forgave l1 but NOT l3 — l1 is never the awaited reviewer', () => {
        // .why = l1 (basic-checker) was overruled before it ran, so it owes no
        //        .taken and is never in the await list; only l3 (premium-checker,
        //        un-overruled) is held. a lower overrule is a key for one gate,
        //        never a skeleton key for the corridor.
        expect(result.stdout).not.toContain('slug = basic-checker');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] driver writes l3\'s .taken then signals --as contemplated', () => {
      const result = useThen('the contemplation is acknowledged', async () => {
        // find premium-checker's current given, derive + write its paired taken
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);
        const givenName = files.find(
          (f) =>
            f.includes('_.given.by_peer.premium-checker.md') &&
            !f.endsWith('.report.md'),
        )!;
        const takenName = givenName.replace(
          '._.given.by_peer.',
          '._.taken.by_self.',
        );
        await fs.writeFile(
          path.join(reviewsDir, takenName),
          '# taken\n\nheld my ground: the l3 blockers are false positives, evidence cited.\n',
        );
        return setStone({
          tempDir: scene.tempDir,
          as: 'contemplated',
          that: 'premium-checker',
        });
      });

      then('is acknowledged (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('confirms l3\'s contemplation was recorded', () => {
        expect(result.stdout).toContain('contemplated: premium-checker');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] driver passes with l3 answered (judge tolerates the blockers)', () => {
      const result = useThen('the stone passes once l3 is contemplated', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('exit code is 0 — passage now granted', () => {
        expect(result.code).toEqual(0);
      });

      then('passage = overruled (l1 waved, l3 answered within budget)', () => {
        expect(result.stdout).toContain('passage = overruled');
      });

      then('the reply-prompt no longer fires (l3 contemplation satisfied)', () => {
        expect(result.stdout).not.toContain('the reviewers await your reply');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

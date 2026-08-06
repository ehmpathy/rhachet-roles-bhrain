import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-overrule-legacy');

/**
 * .what = acceptance coverage for the judges-only overrule path (the judge rung).
 * .why = a judges-only stone (a guard with judges but no peer reviews) is a one-rung ladder whose
 *        sole rung is the judge (JUDGE_LEVEL). an `--as overruled` on it forgives THAT rung — the
 *        judge — with no stone-wide skeleton key: `judgeReviewed` passes it via
 *        `overruledLevels.has(JUDGE_LEVEL)`, and no peer level below is forgiven (there are none).
 *
 *        this suite pins the two things that path must do:
 *          1. the overrule emit names the judge rung ("judge, overruled") — never a stone-wide
 *             full-forgive alert.
 *          2. the judge-rung overrule lets the stone pass (`passage`, "human overruled").
 *
 *        (the legacy level-less passage record maps to JUDGE_LEVEL, so an old stone-wide marker
 *        reads as a judge-rung overrule under the top-rung model — see getStoneGuardOverruledLevels.)
 */
describe('driver.route.overrule-legacy.acceptance', () => {
  given('[case1] a judges-only stone (one-rung ladder), reviewed? judge blocks', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'overrule-legacy',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create the artifact the guard protects
      await fs.writeFile(
        path.join(tempDir, '1.check.md'),
        '# Check\n\nno peer reviews configured — the reviewed? judge blocks on absent review files.',
      );

      // precondition: a bare pass is blocked (no review files for the reviewed? judge)
      const passResult = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.check', route: '.', as: 'passed' },
        cwd: tempDir,
      });
      if (passResult.code === 0) {
        throw new Error(
          'precondition failed: a bare pass should be blocked by the reviewed? judge',
        );
      }

      return { tempDir };
    });

    when('[t0] human runs --as overruled on the judges-only stone', () => {
      const result = useThen('the judge-rung overrule', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.check', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('RUNG: the emit names the judge rung, not a stone-wide forgive', () => {
        // .why = the judge is the top rung; the overrule forgives THAT rung alone, so the emit
        //        reads "judge, overruled" and never the old stone-wide skeleton-key alert
        expect(result.stdout).toContain('judge, overruled');
        expect(result.stdout).not.toContain('stone-wide');
      });

      then('SCOPE: no peer "level N, overruled" line (the only rung is the judge)', () => {
        expect(result.stdout).not.toContain('level 1, overruled');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] pass attempted after the judge-rung overrule', () => {
      const result = useThen('the pass', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.check', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('FORGIVE: the judge-rung overrule lets the stone pass (human overruled)', () => {
        expect(result.stdout.toLowerCase()).toContain('overruled');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // =========================================================================
  // the legacy record on a PEER+JUDGE stone: the narrow read (r11 review 2).
  // under the old model a level-less record read as a stone-wide skeleton key
  // that forgave every peer level AND the judge. under the top-rung model it
  // maps to JUDGE_LEVEL alone, so a peer level that rejects still gates passage.
  // this pins that narrow read for the shape it threatens.
  // =========================================================================

  const TIER_ESCALATION_ASSETS_DIR = path.join(
    __dirname,
    '.test/assets/route-tier-escalation',
  );

  given(
    '[case2] a peer+judge stone with a legacy level-less record still blocks a peer that rejects',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'overrule-legacy-peer',
          clone: TIER_ESCALATION_ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
        await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

        await fs.writeFile(
          path.join(tempDir, '1.feature.md'),
          '# Feature\n\nl1 rejects; a pre-fix legacy level-less overrule sits on record.',
        );

        // seed a LEGACY level-less overrule record (as written before this fix shipped).
        // under the old model it read as a stone-wide skeleton key; under the top-rung
        // model getStoneGuardOverruledLevels maps it to JUDGE_LEVEL alone.
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });
        await fs.appendFile(
          path.join(routeDir, 'passage.jsonl'),
          `${JSON.stringify({ stone: '1.feature', status: 'overruled' })}\n`,
        );

        return { tempDir };
      });

      when('[t0] pass attempted (l1 rejects; legacy record forgives the judge rung only)', () => {
        const result = useThen('the pass', async () =>
          invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.feature', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          }),
        );

        then('exit code is 2 (l1 constraint block), not 1 (malfunction)', () => {
          // .why = l1's rejection gates via the reviewed? tally (blockers exceed threshold), a
          //        constraint that exits 2 — a loose .not.toEqual(0) would let a malfunction slip by
          expect(result.code).toEqual(2);
        });

        then('NARROW: the legacy record does NOT fully forgive the stone', () => {
          // .why = the old stone-wide skeleton key is ripped; a legacy level-less
          //        record forgives only the judge rung (JUDGE_LEVEL), never a peer
          //        level. so l1's rejection still gates passage — the stone does not pass.
          expect(result.stdout).not.toContain('passage = overruled');
          expect(result.stdout).not.toContain('passage = allowed');
        });

        then('the l1 reviewer is what blocks', () => {
          expect(result.stdout).toContain('basic-checker');
        });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });
    },
  );
});

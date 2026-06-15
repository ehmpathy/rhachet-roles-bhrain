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
  '.test/assets/route-peer-budget-exhaustion-unlocks-level',
);

/**
 * .what = acceptance test for exhaustion to unlock higher levels
 * .why = verifies that when l1 becomes exhausted (terminal), l3 unlocks
 *
 * key insight: exhaustion is terminal, so higher levels should unlock
 *
 * flow:
 *   - round 1/2: l1 rejected → l3 awaits (l1 not terminal)
 *   - round 2/2: l1 runs, rejected → l3 still awaits (terminal computed AFTER run)
 *   - round 3/2: l1 SKIPPED (exhausted) → l3 unlocks and runs
 *
 * invariant (define.invariant.review.peer.exhausted):
 *   - 'exhausted' only when review was SKIPPED, never when it ran
 *   - round 2/2 runs → shows 'rejected'
 *   - round 3/2 skipped → shows 'exhausted'
 */
describe('driver.route.peer-budget-exhaustion-unlocks-level.acceptance', () => {
  given('[journey] exhaustion unlocks higher level', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-exhaustion-unlocks',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: round 1/2 - l1 rejected, l3 awaits
    // =========================================================================

    when('[t0] round 1/2: l1 rejected, l3 awaits', () => {
      const result = useThen('l1 runs, l3 awaits', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('l1 shows 1/2 and rejected', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toContain('l1, 1/2');
        expect(result.stdout).toContain('rejected');
      });

      then('l3 awaits l1 (not terminal yet)', () => {
        expect(result.stdout).toMatch(/l3-reviewer.*awaits/s);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: round 2/2 - l1 runs (rejected), l3 still awaits
    // =========================================================================

    when('[t1] round 2/2: l1 rejected, l3 awaits', () => {
      const result = useThen('l1 rejected, l3 awaits', async () => {
        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('l1 shows 2/2 and rejected (ran, not skipped)', () => {
        // .note = review RAN at 2/2, so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only applies when review is SKIPPED (rounds >= budget BEFORE attempt)
        //         budget depletes AFTER this review runs
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toContain('l1, 2/2');
        expect(result.stdout).toMatch(/rejected/i);
      });

      then('l3 still awaits (l1 terminal AFTER round)', () => {
        // .note = l1 becomes terminal AFTER round 2/2 completes
        //         l3 checks terminal state BEFORE it can run
        //         so l3 awaits in this iteration; unlocks in next
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toMatch(/l3-reviewer.*awaits/s);
      });

      then('no premature halt (proceeds to judge)', () => {
        // judge should run, not "halted: exhausted"
        expect(result.stdout).toContain('judge.1');
        expect(result.stdout).toContain('blocked');
        expect(result.stdout).not.toContain('halted');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: round 3/2 - l1 skipped (exhausted), l3 unlocks
    // =========================================================================

    when('[t2] round 3/2: l1 exhausted, l3 unlocks', () => {
      const result = useThen('l1 exhausted, l3 runs', async () => {
        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('l1 shows exhausted (skipped)', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toContain('exhausted');
      });

      then('l3 runs (l1 terminal unlocks level 3)', () => {
        // .note = l1 is terminal (exhausted), so l3 should unlock and run
        //         l3 runs with 1/5 budget (first round for l3)
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toContain('l3, 1/5');
        expect(result.stdout).toMatch(/l3-reviewer.*rejected/s);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: verify exhausted state persists
    // =========================================================================

    when('[t3] exhausted state persists across hash changes', () => {
      const result = useThen('l1 still exhausted', async () => {
        // change artifact to trigger re-check
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4-changed";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('l1 shows exhausted (skipped, uses cached)', () => {
        // .note = l1 exhausted persists across hash changes
        //         uses cached review from prior iteration
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toMatch(/exhausted/i);
      });

      then('l3 runs again (l1 still terminal)', () => {
        // .note = l1 remains terminal (exhausted), so l3 still unlocked
        //         l3 runs with 2/5 budget (second round for l3)
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toContain('l3, 2/5');
        expect(result.stdout).toMatch(/l3-reviewer.*rejected/s);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

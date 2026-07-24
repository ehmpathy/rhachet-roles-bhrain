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
  '.test/assets/route-peer-mixed-verdict-halt',
);

/**
 * .what = acceptance clamp for a halt that names EVERY reason at once
 * .why = the guard has three gates (malfunction > constraint > exhaustion) that can
 *        fire in the SAME pass. the prior code took a separate early return per gate, so
 *        an exhausted l1 hid a malfunctioned l3 that unlocked in that same pass: the halt
 *        named only the exhaustion and offered only approve/budget, never the overrule the
 *        malfunction needs — so a human who followed that guidance hit a SECOND, unwarned
 *        block on the next arrive. this clamps the fix: one halt surfaces every reason +
 *        every remedy, so the human is pulled in ONCE, at the very end.
 *
 * journey:
 *   - round 1/2: l1 rejected → l3 awaits (l1 not terminal)
 *   - round 2/2: l1 rejected (ran) → l3 still awaits
 *   - round 3/2: l1 SKIPPED (exhausted, terminal) → l3 unlocks + MALFUNCTIONS (exit 1)
 *                → the halt must name BOTH the malfunction AND the exhaustion, and offer
 *                  BOTH overrule AND budget/approve
 */
describe('driver.route.peer-mixed-verdict-halt.acceptance', () => {
  given('[journey] exhausted l1 + malfunctioned l3 in one pass', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-mixed-verdict-halt',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      // arm l3 to malfunction the moment it unlocks
      await fs.writeFile(
        path.join(tempDir, '.test', 'l3-should-malfunction'),
        '',
      );

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: round 1/2 — l1 rejected, l3 awaits
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

      then('l1 shows 1/2 rejected, l3 awaits', () => {
        expect(result.stdout).toContain('l1, 1/2');
        expect(result.stdout).toMatch(/l3-reviewer.*awaits/s);
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: round 2/2 — l1 rejected (ran), l3 still awaits
    // =========================================================================

    when('[t1] round 2/2: l1 rejected, l3 awaits', () => {
      const result = useThen('l1 rejected at limit, l3 awaits', async () => {
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

      then('l1 shows 2/2 rejected (ran, not skipped)', () => {
        expect(result.stdout).toContain('l1, 2/2');
        expect(result.stdout).toMatch(/rejected/i);
      });

      then('no premature halt (proceeds to judge, not halted)', () => {
        expect(result.stdout).not.toContain('halted');
        expect(result.stdout).not.toContain('budget exhausted');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: round 3/2 — l1 exhausted, l3 unlocks + MALFUNCTIONS
    //          the halt must name BOTH reasons + offer BOTH remedies
    // =========================================================================

    when('[t2] round 3/2: l1 exhausted, l3 unlocks + malfunctions', () => {
      const result = useThen('halt names both reasons', async () => {
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

      then('passage is malfunction (highest-precedence reason drives it)', () => {
        // .why = malfunction outranks exhaustion, so the persisted + headline kind is
        //        malfunction — the primary remedy the human needs is the overrule
        expect(result.stdout).toContain('passage = malfunction');
      });

      then('l1 shows exhausted (skipped, terminal)', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toContain('exhausted');
      });

      then('l3 ran and malfunctioned (unlocked by l1 terminal)', () => {
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toMatch(/l3-reviewer.*malfunction/s);
      });

      // ---- the core clamp: NEITHER reason may hide the other ----

      then('CLAMP: reason names BOTH the malfunction AND the exhaustion', () => {
        // .why = the halt-precedence bug named only the first gate found in code order.
        //        the fix surfaces the FULL set: both markers must appear in the reason.
        expect(result.stdout).toMatch(/malfunction/i);
        expect(result.stdout).toContain('budget exhausted');
      });

      then('CLAMP: options offer the overrule remedy (for the malfunction)', () => {
        // .why = the prior halt offered only approve/budget, never the overrule the
        //        malfunction needs — the exact guidance gap that caused a second block
        expect(result.stdout).toContain('overrule the malfunction');
        expect(result.stdout).toContain('--as overruled');
      });

      then('CLAMP: options offer the budget/approve remedy (for the exhaustion)', () => {
        // .why = the human should address every reason in ONE sitting, so the exhausted
        //        level's remedies ride beside the overrule — no second round-trip
        expect(result.stdout).toContain('increase budget');
        expect(result.stdout).toContain('approve as-is');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-defaults');

/**
 * .what = acceptance test for backwards compatibility - peer reviews without budget/level use defaults
 * .why = legacy routes without budget/level declarations must still work with:
 *        - budget: Infinity (unlimited)
 *        - level: 1
 *
 * journey:
 *   1. parse guard with peer review that lacks budget/level fields
 *   2. verify reviewer runs (not immediately exhausted)
 *   3. run many iterations without exhaustion (budget = Infinity)
 *   4. verify level defaults to 1 (no higher level lock)
 */
describe('driver.route.peer-budget-defaults.acceptance', () => {
  given('[journey] peer reviews without budget/level use defaults', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-defaults',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: verify parse works without budget/level
    // =========================================================================

    when('[t0] artifact created, first review attempt', () => {
      const result = useThen('review runs (parse succeeded)', async () => {
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

      then('exit code is non-zero (blocked by review)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('reviewer ran successfully (not parse error)', () => {
        // should show rejected due to blockers, not parse error
        expect(result.stdout).toMatch(/rejected/i);
      });

      then('no exhaustion message (budget = Infinity default)', () => {
        expect(result.stdout.toLowerCase()).not.toContain('exhaust');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: verify budget = Infinity - run many iterations
    // =========================================================================

    when('[t1] multiple review iterations without exhaustion', () => {
      const result = useThen('still active after 5 iterations', async () => {
        // run 5 iterations - with finite budget this would exhaust
        for (let i = 2; i <= 5; i++) {
          await fs.writeFile(
            path.join(scene.tempDir, 'src', 'feature.ts'),
            `export const feature = () => "v${i}";`,
          );
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.execute', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          });
        }

        // change artifact one more time and check
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v6";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('reviewer is NOT exhausted (budget = Infinity)', () => {
        // should still show rejected, not exhausted
        expect(result.stdout).toMatch(/rejected/i);
        expect(result.stdout.toLowerCase()).not.toContain('exhaust');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: verify can still pass when review passes
    // =========================================================================

    when('[t2] review passes, stone can proceed', () => {
      const result = useThen('stone passes', async () => {
        // make review pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');

        // change artifact to trigger review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v-final";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

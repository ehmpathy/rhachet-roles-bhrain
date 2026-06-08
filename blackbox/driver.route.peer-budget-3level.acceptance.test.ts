import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-3level');

/**
 * .what = acceptance test for 3-level peer review hierarchy
 * .why = verifies l3 waits for l2, l2 waits for l1
 *
 * levels:
 *   - l1: basic-checker (runs first)
 *   - l2: advanced-checker (awaits l1 terminal)
 *   - l3: premium-checker (awaits l2 terminal)
 */
describe('driver.route.peer-budget-3level.acceptance', () => {
  given('[journey] 3-level hierarchy: l3 awaits l2 awaits l1', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-3level',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-basic.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-advanced.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-premium.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: only l1 runs, l2 and l3 await
    // =========================================================================

    when('[t0] artifact created, only l1 runs', () => {
      const result = useThen('basic-checker runs, others await', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('basic-checker (l1) ran', () => {
        expect(result.stdout).toContain('basic-checker');
        expect(result.stdout).toContain('l1');
      });

      then('advanced-checker (l2) awaits l1', () => {
        expect(result.stdout).toMatch(/advanced-checker.*awaits/);
      });

      then('premium-checker (l3) awaits l2', () => {
        expect(result.stdout).toMatch(/premium-checker.*awaits/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: make l1 pass, l2 runs, l3 still awaits
    // =========================================================================

    when('[t1] l1 passes, l2 unlocks, l3 still awaits', () => {
      const result = useThen('advanced-checker runs, premium awaits', async () => {
        // make basic-checker pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'basic-should-pass'), '');

        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked by l2)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('basic-checker (l1) approved', () => {
        expect(result.stdout).toMatch(/basic-checker.*approved/);
      });

      then('advanced-checker (l2) ran', () => {
        // l2 should have run and failed (no flag file)
        expect(result.stdout).toContain('advanced-checker');
      });

      then('premium-checker (l3) still awaits l2', () => {
        expect(result.stdout).toMatch(/premium-checker.*awaits/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: make l2 pass, l3 unlocks
    // =========================================================================

    when('[t2] l2 passes, l3 unlocks and runs', () => {
      const result = useThen('premium-checker runs', async () => {
        // make advanced-checker pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'advanced-should-pass'), '');

        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked by l3)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('advanced-checker (l2) approved', () => {
        expect(result.stdout).toMatch(/advanced-checker.*approved/);
      });

      then('premium-checker (l3) ran', () => {
        // l3 should have run and failed (no flag file)
        expect(result.stdout).toContain('premium-checker');
        expect(result.stdout).not.toMatch(/premium-checker.*awaits/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: make l3 pass, stone passes
    // =========================================================================

    when('[t3] l3 passes, stone passes', () => {
      const result = useThen('all levels pass', async () => {
        // make premium-checker pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'premium-should-pass'), '');

        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4-final";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('all 3 levels approved', () => {
        expect(result.stdout).toMatch(/basic-checker.*approved/);
        expect(result.stdout).toMatch(/advanced-checker.*approved/);
        expect(result.stdout).toMatch(/premium-checker.*approved/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

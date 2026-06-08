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
  '.test/assets/route-peer-budget-parallel-l1',
);

/**
 * .what = acceptance test for parallel L1 reviewers
 * .why = proves L2 waits for ALL L1 reviewers to be terminal
 *
 * levels:
 *   - l1: alpha-checker, beta-checker (run in parallel)
 *   - l2: final-checker (awaits ALL l1 reviewers)
 */
describe('driver.route.peer-budget-parallel-l1.acceptance', () => {
  given('[journey] parallel L1: L2 awaits ALL L1s', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-parallel-l1',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-alpha.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-beta.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-final.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: both L1 reviewers run, L2 awaits
    // =========================================================================

    when('[t0] artifact created, both L1s run, L2 awaits', () => {
      const result = useThen('both L1 reviewers run', async () => {
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

      then('alpha-checker (L1) ran', () => {
        expect(result.stdout).toContain('alpha-checker');
        expect(result.stdout).toContain('l1');
      });

      then('beta-checker (L1) ran', () => {
        expect(result.stdout).toContain('beta-checker');
      });

      then('final-checker (L2) awaits L1', () => {
        expect(result.stdout).toMatch(/final-checker.*awaits/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: only alpha passes, beta still fails, L2 STILL awaits
    // =========================================================================

    when('[t1] alpha passes but beta fails, L2 STILL awaits', () => {
      const result = useThen('L2 still awaits (beta not terminal)', async () => {
        // make ONLY alpha-checker pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'alpha-should-pass'),
          '',
        );

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

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('alpha-checker (L1) approved', () => {
        expect(result.stdout).toMatch(/alpha-checker.*approved/);
      });

      then('beta-checker (L1) rejected (still has blockers)', () => {
        expect(result.stdout).toMatch(/beta-checker.*rejected/);
      });

      then('final-checker (L2) STILL awaits (not all L1s terminal)', () => {
        // this is the key assertion: L2 should still await because beta is rejected, not terminal
        expect(result.stdout).toMatch(/final-checker.*awaits/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: both L1s pass, L2 finally unlocks
    // =========================================================================

    when('[t2] both L1s pass, L2 unlocks', () => {
      const result = useThen('L2 runs after both L1s approve', async () => {
        // make beta-checker pass too
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'beta-should-pass'),
          '',
        );

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

      then('exit code is non-zero (blocked by L2)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('alpha-checker (L1) approved', () => {
        expect(result.stdout).toMatch(/alpha-checker.*approved/);
      });

      then('beta-checker (L1) approved', () => {
        expect(result.stdout).toMatch(/beta-checker.*approved/);
      });

      then('final-checker (L2) ran (no longer awaits)', () => {
        expect(result.stdout).toContain('final-checker');
        expect(result.stdout).not.toMatch(/final-checker.*awaits/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: L2 passes, stone passes
    // =========================================================================

    when('[t3] L2 passes, stone passes', () => {
      const result = useThen('all levels pass', async () => {
        // make final-checker pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'final-should-pass'),
          '',
        );

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

      then('all reviewers approved', () => {
        expect(result.stdout).toMatch(/alpha-checker.*approved/);
        expect(result.stdout).toMatch(/beta-checker.*approved/);
        expect(result.stdout).toMatch(/final-checker.*approved/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget');

/**
 * .what = acceptance test for peer review budget feature
 * .why = exercises budget exhaustion and extension workflow
 *
 * journey:
 *   1. execute stone with peer reviewer (budget: 2)
 *   2. peer review fails repeatedly, budget consumed
 *   3. budget exhausts, triggers implicit approval gate
 *   4. route.guard.budget extends budget
 *   5. route continues after budget extension
 */
describe('driver.route.peer-budget.acceptance', () => {
  given('[journey] peer review budget exhaustion and extension', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock-review.sh executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: initial attempt with failed reviews
    // =========================================================================

    when('[t0] artifact created and pass attempted with failed reviews', () => {
      const result = useThen('pass blocked by peer review blockers', async () => {
        // create artifact
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

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output shows review blockers', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/block|fail/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] second pass attempt (consumes more budget)', () => {
      const result = useThen('still blocked by peer review blockers', async () => {
        // update artifact to force re-review
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

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: budget exhaustion
    // =========================================================================

    when('[t2] third pass attempt (budget should exhaust)', () => {
      const result = useThen('blocked with budget exhaustion', async () => {
        // update artifact again
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

      then('output mentions exhaustion', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/exhaust|budget/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: extend budget
    // =========================================================================

    when('[t3] budget is extended via route.guard.budget', () => {
      const result = useThen('budget extension succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', peer: 'mock-reviewer', stone: '1.execute' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output confirms extension', () => {
        expect(result.stdout.toLowerCase()).toContain('budget');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: pass after budget extension
    // =========================================================================

    when('[t4] pass attempted after budget extension with passed reviews', () => {
      const result = useThen('pass succeeds', async () => {
        // make reviews pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');

        // update artifact to trigger fresh review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4-fixed";',
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

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 5: verify cached review does not consume budget
    // =========================================================================

    when('[t5] pass re-attempted (cached review, same artifact hash)', () => {
      const result = useThen('pass succeeds (cached)', async () =>
        // no artifact change — same hash triggers cache hit
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('review is cached (not re-run)', () => {
        expect(result.stdout).toContain('cached');
      });

      then('budget unchanged (3/4, not 4/4)', () => {
        // budget should still be 3/4 (same as [t4]), not incremented
        expect(result.stdout).toContain('3/4');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

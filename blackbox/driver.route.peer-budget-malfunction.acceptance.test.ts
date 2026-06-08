import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-malfunction');

/**
 * .what = acceptance test for peer review budget on malfunction
 * .why = per wish: "only on successful review completion... not on malfunction"
 *        budget must NOT be consumed when review exits with code 1
 *
 * journey:
 *   1. review malfunctions (exit 1) - budget NOT consumed
 *   2. review succeeds with blockers - budget consumed
 *   3. repeat until exhaustion
 *   4. verify malfunction didn't count toward exhaustion
 */
describe('driver.route.peer-budget-malfunction.acceptance', () => {
  given('[journey] review malfunction does not consume budget', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-malfunction',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-malfunction.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: malfunction does NOT consume budget
    // =========================================================================

    when('[t0] artifact created, review malfunctions (exit 1)', () => {
      const result = useThen('review malfunctions', async () => {
        // set up malfunction
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-malfunction'), '');

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

      then('exit code is non-zero (malfunction)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output indicates malfunction (not exhaustion)', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        // should NOT mention exhaustion
        expect(output).not.toContain('exhaust');
        // should mention malfunction or error
        expect(output).toMatch(/malfunction|error|failed/);
      });

      then('budget NOT consumed (still 0/2)', () => {
        // if budget was consumed, it would show 1/2
        // malfunction should leave it at 0/2
        const output = result.stdout + result.stderr;
        expect(output).not.toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: successful review DOES consume budget
    // =========================================================================

    when('[t1] malfunction cleared, review succeeds with blockers', () => {
      const result = useThen('review runs, blocked by blockers', async () => {
        // remove malfunction flag
        await fs.rm(path.join(scene.tempDir, '.test', 'review-should-malfunction'));

        // update artifact to trigger fresh review
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

      then('budget consumed (now 1/2)', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] second successful review consumes second budget', () => {
      const result = useThen('review runs, blocked by blockers', async () => {
        // update artifact to trigger fresh review
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

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('budget consumed (now 2/2)', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('2/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: budget exhausted after 2 successful reviews (not 3)
    // =========================================================================

    when('[t3] third attempt after exhaustion', () => {
      const result = useThen('blocked with exhaustion', async () => {
        // update artifact again
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4";',
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
    // PHASE 4: verify malfunction while exhausted also doesn't consume
    // =========================================================================

    when('[t4] malfunction after budget extension', () => {
      const result = useThen('malfunction preserves budget', async () => {
        // extend budget first
        await invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '1', route: '.', peer: 'flaky-reviewer', stone: '1.execute' },
          cwd: scene.tempDir,
        });

        // set malfunction
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-malfunction'), '');

        // update artifact
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v5";',
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

      then('budget NOT consumed by malfunction (still 2/3)', () => {
        const output = result.stdout + result.stderr;
        // extended to 3, was at 2, malfunction should keep it at 2
        expect(output).toContain('2/3');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 5: recover from malfunction, pass succeeds
    // =========================================================================

    when('[t5] recover from malfunction, review passes', () => {
      const result = useThen('pass succeeds', async () => {
        // remove malfunction, enable pass
        await fs.rm(path.join(scene.tempDir, '.test', 'review-should-malfunction'));
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');

        // update artifact
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v6-final";',
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

      then('budget consumed (now 3/3)', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('3/3');
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

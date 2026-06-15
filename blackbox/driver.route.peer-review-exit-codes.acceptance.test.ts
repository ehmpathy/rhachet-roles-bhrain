import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-review-exit-codes');

/**
 * .what = acceptance test for peer review exit code scenarios
 * .why = validates correct treatment of exit codes:
 *        - exit 0 with blockers = rejected (blockers shown)
 *        - exit 2 without blockers = constraint (constraint error shown)
 *        - exit 1 = malfunction (malfunction shown)
 *
 * journey:
 *   1. exit 0 with blockers - rejected, budget consumed
 *   2. exit 2 genuine constraint - constraint shown, budget NOT consumed
 *   3. exit 1 malfunction - malfunction shown, budget NOT consumed
 *   4. exit 0 pass - approved, budget consumed
 */
describe('driver.route.peer-review-exit-codes.acceptance', () => {
  given('[journey] exit code scenarios', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-review-exit-codes',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-exit-codes.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // SCENARIO 1: exit 0 with blockers = rejected, budget consumed
    // =========================================================================

    when('[t0] exit 0 with blockers (rejected)', () => {
      const result = useThen('review rejected with blockers', async () => {
        // create artifact
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        // default scenario: exit 0 with blockers
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output shows rejected with blocker count', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('rejected');
        expect(output).toContain('1 blocker');
      });

      then('budget consumed (1/2)', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // SCENARIO 2: exit 2 genuine constraint = constraint shown, budget NOT consumed
    // =========================================================================

    when('[t1] exit 2 genuine constraint (no blockers)', () => {
      const result = useThen('constraint error shown', async () => {
        // set constraint flag
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-constraint'), '');

        // update artifact to trigger fresh review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );

        const r = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // clean up flag
        await fs.rm(path.join(scene.tempDir, '.test', 'review-should-constraint'));

        return r;
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output shows constraint (not rejected)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('constraint');
        // should NOT show as rejected since there were no blockers to parse
        expect(output).not.toMatch(/rejected.*\d+ blocker/);
      });

      then('budget NOT consumed (still 1/2)', () => {
        // constraint should not consume budget (same as malfunction)
        const output = result.stdout + result.stderr;
        const finalSection = output.split('🗿 route.stone.set')[1] ?? '';
        expect(finalSection).toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // SCENARIO 3: exit 1 malfunction = malfunction shown, budget NOT consumed
    // =========================================================================

    when('[t2] exit 1 malfunction', () => {
      const result = useThen('malfunction shown', async () => {
        // set malfunction flag
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-malfunction'), '');

        // update artifact to trigger fresh review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );

        const r = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // clean up flag
        await fs.rm(path.join(scene.tempDir, '.test', 'review-should-malfunction'));

        return r;
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output shows malfunction', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toContain('malfunction');
      });

      then('budget NOT consumed (still 1/2)', () => {
        const output = result.stdout + result.stderr;
        const finalSection = output.split('🗿 route.stone.set')[1] ?? '';
        expect(finalSection).toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // SCENARIO 4: exit 0 with no blockers = approved, budget consumed
    // =========================================================================

    when('[t3] exit 0 pass (approved)', () => {
      const result = useThen('approved, passage allowed', async () => {
        // set pass flag
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');

        // update artifact to trigger fresh review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4-final";',
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

      then('output shows approved', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('approved');
      });

      then('budget consumed (2/2)', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('2/2');
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

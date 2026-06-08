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
 * .what = acceptance test for --as rewound resets peer reviewer budget
 * .why = matrix.2 row 3: `0 (exhausted) | --as rewound | active | full`
 *
 * journey:
 *   1. exhaust peer reviewer budget
 *   2. rewind the stone
 *   3. verify budget is reset to full
 *   4. verify reviewer runs again (not exhausted)
 */
describe('driver.route.peer-budget-rewound.acceptance', () => {
  given('[journey] rewound resets exhausted budget to full', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-rewound',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: exhaust the budget
    // =========================================================================

    when('[t0] artifact created, first review attempt fails', () => {
      const result = useThen('first budget consumed', async () => {
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

      then('budget shows 1/2 used', () => {
        expect(result.stdout).toContain('1/2');
      });
    });

    when('[t1] second attempt exhausts budget', () => {
      const result = useThen('budget exhausted', async () => {
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

      then('budget shows exhausted', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('exhaust');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: rewind the stone
    // =========================================================================

    when('[t2] stone is rewound', () => {
      const result = useThen('rewind succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'rewound' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: verify budget is reset to full
    // =========================================================================

    when('[t3] attempt after rewind - budget should be fresh', () => {
      const result = useThen('reviewer runs with fresh budget', async () => {
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

      then('exit code is non-zero (still blocked by review)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('budget shows 1/2 (reset from exhausted)', () => {
        // budget should be back to 1/2, not 3/2 or still exhausted
        expect(result.stdout).toContain('1/2');
      });

      then('reviewer is NOT exhausted', () => {
        const output = result.stdout.toLowerCase();
        // should show rejected, not exhausted
        expect(output).not.toContain('exhaust');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: can still pass after rewind
    // =========================================================================

    when('[t4] pass after rewind with review that passes', () => {
      const result = useThen('stone passes', async () => {
        // make review pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');

        // change artifact to trigger review
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

      then('passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

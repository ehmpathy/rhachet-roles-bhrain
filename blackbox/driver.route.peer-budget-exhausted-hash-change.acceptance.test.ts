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
 * .what = acceptance test: hash change after exhaustion does NOT reset budget
 * .why = matrix.2 row 2: `| 0 (exhausted) | hash changes | exhausted | 0 |`
 *
 * vision explicitly states:
 * > "if exhausted on hash A, and the artifact changes to hash B:
 * >  stay exhausted — hash change does NOT reset exhaustion"
 *
 * journey:
 *   1. exhaust peer reviewer budget on hash A
 *   2. change artifact to hash B
 *   3. attempt to pass
 *   4. verify reviewer is still exhausted (NOT re-run)
 */
describe('driver.route.peer-budget-exhausted-hash-change.acceptance', () => {
  given('[matrix.2.row2] hash change after exhaustion stays exhausted', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-exhausted-hash-change',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: exhaust the budget on hash A
    // =========================================================================

    when('[t0] first review attempt (hash A)', () => {
      const result = useThen('first budget consumed', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "hash-A-v1";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('blocked with 1/2 used', () => {
        expect(result.code).not.toEqual(0);
        expect(result.stdout).toContain('1/2');
      });
    });

    when('[t1] second attempt exhausts budget (hash A variant)', () => {
      const result = useThen('budget exhausted', async () => {
        // change to hash A variant to trigger new review (otherwise cached)
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "hash-A-v2";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('budget at limit, reviewer rejected', () => {
        // .note = at 2/2, review RAN so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only when review SKIPPED (rounds >= budget BEFORE attempt)
        expect(result.code).not.toEqual(0);
        expect(result.stdout.toLowerCase()).toContain('rejected');
        expect(result.stdout).toContain('2/2');
      });

      then('snapshot [t1]: rejected at limit on hash A', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1.5] third attempt, review SKIPPED (exhausted)', () => {
      const result = useThen('reviewer is exhausted', async () => {
        // .note = change artifact to trigger re-check
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "hash-A-v3";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('reviewer is exhausted (review was SKIPPED at 3/2)', () => {
        // .note = at 3/2, rounds >= budget BEFORE attempt, so review is SKIPPED
        //         verdict is 'exhausted' not 'rejected'
        expect(result.code).not.toEqual(0);
        expect(result.stdout.toLowerCase()).toContain('exhausted');
      });

      then('snapshot [t1.5]: exhausted on hash A', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: change hash and verify still exhausted
    // =========================================================================

    when('[t2] artifact changes to hash B, attempt to pass', () => {
      const result = useThen('reviewer stays exhausted, no re-run', async () => {
        // change artifact to a different hash (hash B)
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "hash-B-different-content";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('still blocked (hash change does NOT reset)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('reviewer is still exhausted (not re-run)', () => {
        const output = result.stdout.toLowerCase();
        // key assertion: still exhausted, budget NOT reset
        expect(output).toContain('exhaust');
      });

      then('budget still shows 2/2 (not reset to 0/2 or 1/2)', () => {
        // the budget should remain at 2/2 exhausted
        // NOT reset to a fresh budget
        expect(result.stdout).toContain('2/2');
      });

      then('snapshot [t2]: hash B, still exhausted', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: verify another hash change also stays exhausted
    // =========================================================================

    when('[t3] artifact changes to hash C, still exhausted', () => {
      const result = useThen('stays exhausted across hash changes', async () => {
        // change to yet another hash (hash C)
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "hash-C-yet-another-version";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('reviewer remains exhausted', () => {
        expect(result.code).not.toEqual(0);
        expect(result.stdout.toLowerCase()).toContain('exhaust');
        expect(result.stdout).toContain('2/2');
      });

      then('snapshot [t3]: hash C, exhausted persists', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

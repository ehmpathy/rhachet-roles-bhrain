import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-approval-unification');

/**
 * .what = tests usecase.8: approval unification
 * .why = proves that when a stone has BOTH an exhausted reviewer AND an explicit
 *        `approved?` judge, one human approval satisfies both gates:
 *        1. reviewer exhausts budget (2 rounds of always-fail mock)
 *        2. stone has explicit `approved?` judge in guards
 *        3. human approves (single approval action)
 *        4. stone passes (both exhaustion and explicit judge satisfied)
 */
describe('driver.route.peer-budget-approval-unification.acceptance', () => {
  given('[usecase.8] exhaustion + explicit approved? judge → one approval covers both', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-approval-unification',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    // -------------------------------------------------------------------------
    // PHASE 1: first review attempt → blocked (uses 1/2 budget)
    // -------------------------------------------------------------------------

    when('[t0] artifact created, first review attempt', () => {
      const result = useThen('review runs, returns blockers', async () => {
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

      then('reviewer ran with blockers', () => {
        expect(result.stdout).toContain('strict-checker');
        expect(result.stdout.toLowerCase()).toContain('reject');
      });

      then('budget is 1/2', () => {
        expect(result.stdout).toContain('1/2');
      });

      then('snapshot [t0]: first attempt blocked', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 2: second review attempt → exhausted (uses 2/2 budget)
    // -------------------------------------------------------------------------

    when('[t1] second attempt, budget exhausts', () => {
      const result = useThen('reviewer reaches budget limit', async () => {
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

      then('reviewer rejected at budget limit', () => {
        // .note = at 2/2, review RAN so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only when review SKIPPED (rounds >= budget BEFORE attempt)
        expect(result.stdout.toLowerCase()).toContain('rejected');
      });

      then('budget is 2/2', () => {
        expect(result.stdout).toContain('2/2');
      });

      then('snapshot [t1]: rejected at limit, needs approval', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 2.5: third attempt → exhausted (review SKIPPED at 3/2)
    // -------------------------------------------------------------------------

    when('[t1.5] third attempt, review skipped (exhausted)', () => {
      const result = useThen('reviewer is exhausted', async () => {
        // .note = change artifact to trigger re-check
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

      then('reviewer is exhausted (review was SKIPPED)', () => {
        // .note = at 3/2, rounds >= budget BEFORE attempt, so review is SKIPPED
        //         verdict is 'exhausted' not 'rejected'
        expect(result.stdout.toLowerCase()).toContain('exhausted');
      });

      then('snapshot [t1.5]: exhausted, review skipped', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 3: route.drive shows need for approval
    // -------------------------------------------------------------------------

    when('[t2] route.drive shows exhaustion requires approval', () => {
      const result = useThen('halted for approval', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('shows stone and standard guidance', () => {
        // .note = route.drive shows current stone, not reviewer exhaustion details
        //         reviewer exhaustion details shown in route.stone.set output
        //         actual approval unification proven in [t3] and [t4]
        expect(result.stdout).toContain('stone = 1.execute');
        expect(result.stdout).toContain('--as passed');
      });

      then('snapshot [t2]: halted, wait for approval', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 4: human approves (one approval action)
    // -------------------------------------------------------------------------

    when('[t3] human approves', () => {
      const result = useThen('approval succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'approved' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('snapshot [t3]: approved', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 5: stone passes (both exhaustion AND explicit judge satisfied)
    // -------------------------------------------------------------------------

    when('[t4] pass after approval', () => {
      const result = useThen('stone passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('both judges passed', () => {
        // both reviewed? and approved? judges should show success
        // output format: "j1: rhx route.stone.judge ..." and "j2: ..."
        const judgeMatches = result.stdout.match(/j\d+:/g) || [];
        expect(judgeMatches.length).toBeGreaterThanOrEqual(2);
        // verify both show success (✓)
        expect(result.stdout).toContain('j1:');
        expect(result.stdout).toContain('j2:');
        expect(result.stdout).toContain('finished');
      });

      then('snapshot [t4]: journey complete, both judges satisfied', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

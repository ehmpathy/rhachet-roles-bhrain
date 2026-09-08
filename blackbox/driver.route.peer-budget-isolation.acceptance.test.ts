import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-isolation');

/**
 * .what = acceptance test for per-stone budget isolation
 * .why = wish declares: "Budget Scope: Per-stone, per-reviewer"
 *
 * test scenario:
 *   - same reviewer slug "shared-reviewer" on both stones
 *   - exhaust budget on stone 1.alpha
 *   - verify stone 2.beta has fresh budget (not exhausted)
 */
describe('driver.route.peer-budget-isolation.acceptance', () => {
  given('[journey] per-stone budget isolation', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-isolation',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-alpha.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-beta.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: exhaust budget on stone 1.alpha
    // =========================================================================

    when('[t0] alpha artifact created, first review fails', () => {
      const result = useThen('alpha budget consumed (1/2)', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'alpha'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'alpha', 'feature.ts'),
          'export const alpha = () => "v1";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.alpha' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.alpha', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('budget shows 1/2', () => {
        expect(result.stdout).toContain('1/2');
      });

      then('the alpha tree is pinned — the shared reviewer rejected at 1 of 2 on alpha', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] second alpha attempt exhausts budget', () => {
      const result = useThen('alpha budget exhausted (2/2)', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, 'alpha', 'feature.ts'),
          'export const alpha = () => "v2";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.alpha' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.alpha', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shared-reviewer rejected at budget limit', () => {
        // .note = at 2/2, review RAN so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only when review SKIPPED (rounds >= budget BEFORE attempt)
        const output = result.stdout.toLowerCase();
        expect(output).toContain('rejected');
        expect(output).toContain('2/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 1.5: third attempt → exhausted (review SKIPPED at 3/2)
    // =========================================================================

    when('[t1.5] third alpha attempt, review skipped (exhausted)', () => {
      const result = useThen('shared-reviewer is exhausted', async () => {
        // .note = change artifact to trigger re-check
        await fs.writeFile(
          path.join(scene.tempDir, 'alpha', 'feature.ts'),
          'export const alpha = () => "v3";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.alpha' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.alpha', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shared-reviewer is exhausted (review was SKIPPED)', () => {
        // .note = at 3/2, rounds >= budget BEFORE attempt, so review is SKIPPED
        //         verdict is 'exhausted' not 'rejected'
        const output = result.stdout.toLowerCase();
        expect(output).toContain('exhausted');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: pass stone 1.alpha with approval
    // =========================================================================

    when('[t2] approve and pass alpha', () => {
      const result = useThen('alpha passes', async () => {
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.alpha', route: '.', as: 'approved' },
          cwd: scene.tempDir,
        });

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.alpha' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.alpha', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('the alpha-passage tree is pinned — the shared reviewer exhausted at 2 of 2, judge allowed', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: verify stone 2.beta has fresh budget
    // =========================================================================

    when('[t3] beta artifact created, verify fresh budget', () => {
      const result = useThen('beta has fresh budget (1/2)', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'beta'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'beta', 'module.ts'),
          'export const beta = () => "v1";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '2.beta' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.beta', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked by review)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('budget shows 1/2 (NOT exhausted, NOT 3/2)', () => {
        // beta's shared-reviewer should start fresh at 1/2
        // NOT continue from alpha's exhausted state
        expect(result.stdout).toContain('1/2');
      });

      then('shared-reviewer is NOT exhausted', () => {
        const output = result.stdout.toLowerCase();
        // should show rejected, not exhausted
        expect(output).not.toContain('exhaust');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: pass beta normally
    // =========================================================================

    when('[t4] beta passes within budget', () => {
      const result = useThen('beta passes', async () => {
        // make beta review pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'beta-should-pass'), '');

        // change artifact to trigger fresh review
        await fs.writeFile(
          path.join(scene.tempDir, 'beta', 'module.ts'),
          'export const beta = () => "v2-fixed";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '2.beta' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.beta', route: '.', as: 'passed' },
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

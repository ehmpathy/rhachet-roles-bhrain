import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-all-terminal-halt');

/**
 * .what = verifies route waits for ALL reviewers to be terminal before halt
 * .why = cheap reviewers (level 1) may infiloop due to lack of brain depth.
 *        we must wait for all levels to reach terminal state before halt
 *        with exhaustion message. otherwise, expensive reviewers (level 2)
 *        would never get a chance to run and find the real issues.
 *
 * critical behavior:
 *   - level 2 only unlocks when level 1 is TERMINAL (approved or exhausted)
 *   - "rejected" is NOT terminal (driver should fix and retry)
 *   - route halts ONLY when ALL reviewers across ALL levels are terminal
 *
 * fixture setup:
 *   - level 1: quick-fail (budget: 1) - always rejects
 *   - level 2: thorough (budget: 2) - always rejects
 *
 * expected timeline:
 *   [t0]: quick-fail runs (1/1, rejected)
 *         - quick-fail NOT terminal (rejected means retry possible)
 *         - thorough AWAITS (level 1 not terminal)
 *   [t1]: artifact changes, quick-fail SKIPPED (2/1, exhausted), thorough unlocks (1/2, rejected)
 *         - quick-fail NOW terminal (exhausted)
 *         - thorough unlocks and runs, rejected
 *         - thorough NOT terminal (rejected)
 *   [t2]: artifact changes, quick-fail cached (exhausted), thorough runs (2/2, rejected)
 *         - thorough at budget limit, review RAN → rejected (NOT exhausted)
 *         - thorough still NOT terminal
 *   [t2.5]: artifact changes, both SKIPPED (exhausted)
 *         - thorough now 3/2, review SKIPPED → exhausted
 *         - ALL terminal, route halts with exhaustion message
 */
describe('driver.route.peer-budget-all-terminal-halt.acceptance', () => {
  given('[case1] level 1 exhausts but level 2 still has budget', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-all-terminal-halt',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-quick-fail.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-thorough.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] artifact created, first attempt', () => {
      const result = useThen('quick-fail runs, thorough awaits', async () => {
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

      then('quick-fail rejected at budget limit (1/1)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('quick-fail');
        // .note = at 1/1, review RAN so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only when review SKIPPED (rounds >= budget BEFORE attempt)
        expect(output).toMatch(/quick-fail.*1\/1.*reject/s);
      });

      then('thorough AWAITS (level 1 NOT terminal - rejected is not terminal)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('thorough');
        // .note = thorough awaits because 'rejected' is NOT terminal
        //         level 2 only unlocks when level 1 is terminal (approved or exhausted)
        expect(output).toMatch(/thorough.*await/s);
      });

      then('route does NOT halt (level 1 not even terminal yet)', () => {
        const output = result.stdout.toLowerCase();
        // should not show the exhaustion halt message yet
        expect(output).not.toContain('peer reviewer budget exhausted');
      });

      then('route is blocked by judge (blockers > 0)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('blocked');
        expect(output).toContain('blocker');
      });

      then('snapshot [t0]: l1 rejected, l2 awaits, no halt', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] second attempt, level 1 exhausts, level 2 unlocks', () => {
      const result = useThen('quick-fail exhausted, thorough unlocks and runs', async () => {
        // change artifact to force re-review
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

      then('quick-fail is exhausted (review SKIPPED at 2/1)', () => {
        // .note = quick-fail had budget 1, ran at 1/1 (rejected)
        //         now at round 2/1, review is SKIPPED → 'exhausted'
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/quick-fail.*exhausted/s);
      });

      then('thorough now unlocked, rejected at 1/2', () => {
        // .note = thorough just unlocked (level 1 is now terminal)
        //         first run, 1/2, found blockers → rejected
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/thorough.*1\/2.*reject/s);
      });

      then('route does NOT halt yet (thorough not terminal)', () => {
        const output = result.stdout.toLowerCase();
        // thorough is rejected (not terminal), so route doesn't halt
        expect(output).not.toContain('peer reviewer budget exhausted');
      });

      then('snapshot [t1]: l1 exhausted, l2 rejected (1/2)', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] third attempt, thorough at budget limit', () => {
      const result = useThen('thorough runs at 2/2', async () => {
        // change artifact to force re-review
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

      then('quick-fail remains exhausted (cached)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/quick-fail.*exhausted/s);
      });

      then('thorough rejected at budget limit (2/2)', () => {
        // .note = at 2/2, review RAN so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only when review SKIPPED (rounds >= budget BEFORE attempt)
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/thorough.*2\/2.*reject/s);
      });

      then('route still does NOT halt (rejected is not terminal)', () => {
        // .note = at 2/2, review ran and found blockers → 'rejected'
        //         'rejected' is NOT terminal, driver should fix and retry
        const output = result.stdout.toLowerCase();
        expect(output).not.toContain('peer reviewer budget exhausted');
      });

      then('snapshot [t2]: l1 exhausted, l2 rejected (2/2)', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2.5] fourth attempt, thorough now exhausted (review SKIPPED)', () => {
      const result = useThen('both exhausted, route halts', async () => {
        // .note = change artifact to trigger re-check
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('quick-fail remains exhausted', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/quick-fail.*exhausted/s);
      });

      then('thorough now exhausted (review was SKIPPED at 3/2)', () => {
        // .note = at 3/2, rounds >= budget BEFORE attempt, so review is SKIPPED
        //         verdict is 'exhausted' not 'rejected'
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/thorough.*exhausted/s);
      });

      then('NOW route halts (ALL reviewers terminal)', () => {
        const output = result.stdout.toLowerCase();
        // NOW should show the exhaustion halt message - all reviewers exhausted
        expect(output).toContain('peer reviewer budget exhausted');
      });

      then('lists exhausted reviewers', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('quick-fail');
        expect(output).toContain('thorough');
      });

      then('offers options to increase budget or approve', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/increase budget|approve/);
      });

      then('snapshot [t2.5]: both exhausted, route halted', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

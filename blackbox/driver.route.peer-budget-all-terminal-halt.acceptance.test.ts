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
 *   - level 1 exhausts (budget 1), level 2 unlocks immediately
 *   - route does NOT halt until level 2 also exhausts
 *   - route halts ONLY when ALL reviewers across ALL levels are terminal
 *
 * fixture setup:
 *   - level 1: quick-fail (budget: 1) - exhausts after first run
 *   - level 2: thorough (budget: 2) - continues after level 1 exhausts
 *
 * expected timeline:
 *   [t0]: quick-fail runs (1/1, exhausted), thorough unlocks and runs (1/2, rejected)
 *         - route blocked by judge but NOT halted (thorough still active)
 *   [t1]: artifact changes, thorough runs (2/2, exhausted)
 *         - NOW all terminal, route halts with exhaustion message
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
      const result = useThen('both levels run in first attempt', async () => {
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

      then('quick-fail exhausts immediately (1/1)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('quick-fail');
        // budget 1 + blockers = exhausted after first run
        expect(output).toMatch(/quick-fail.*1\/1.*exhaust/s);
      });

      then('thorough unlocks and runs (level 1 now terminal)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('thorough');
        // thorough should show rejected (ran and found blockers), not awaits
        expect(output).toMatch(/thorough.*1\/2.*reject/s);
      });

      then('route does NOT halt (thorough still active)', () => {
        const output = result.stdout.toLowerCase();
        // should not show the exhaustion halt message yet
        expect(output).not.toContain('peer reviewer budget exhausted');
      });

      then('route is blocked by judge (blockers > 0)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('blocked');
        expect(output).toContain('blocker');
      });

      then('snapshot [t0]: l1 exhausted, l2 rejected, no halt', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] second attempt, level 2 also exhausts', () => {
      const result = useThen('thorough exhausts at 2/2', async () => {
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

      then('quick-fail remains exhausted (no re-run)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/quick-fail.*1\/1.*exhaust/s);
      });

      then('thorough now exhausted (2/2)', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/thorough.*2\/2.*exhaust/s);
      });

      then('NOW route halts (all reviewers terminal)', () => {
        const output = result.stdout.toLowerCase();
        // NOW should show the exhaustion halt message
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

      then('snapshot [t1]: all terminal, route halted', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

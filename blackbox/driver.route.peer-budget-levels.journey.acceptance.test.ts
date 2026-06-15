import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-levels');

/**
 * .what = comprehensive journey test for peer review budgets with levels
 * .why = proves exhaustion, levels, and approval scenarios work correctly
 *
 * stones:
 *   1.execute: extreme case - exhaustion + levels
 *     - level 1 (cheapo) runs first, exhausts
 *     - level 2 (primo) continues, exhausts
 *     - all exhausted → requires human approval
 *
 *   2.deploy: within-budget pass (no approval needed)
 *     - reviewer passes within budget
 *     - no explicit approved? judge
 *     - stone passes automatically
 *
 *   3.release: within-budget + explicit approval judge
 *     - reviewer passes within budget
 *     - explicit approved? judge
 *     - still requires human approval
 */
describe('driver.route.peer-budget-levels.journey.acceptance', () => {
  // ===========================================================================
  // STONE 1: EXHAUSTION + LEVELS (extreme case)
  // ===========================================================================

  given('[journey] stone 1.execute: exhaustion and levels', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-levels-execute',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-primo.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-cheapo.sh', { cwd: tempDir });

      return { tempDir };
    });

    // -------------------------------------------------------------------------
    // PHASE 1: level 1 (cheapo) runs first
    // -------------------------------------------------------------------------

    when('[t0] artifact created, level 1 (cheapo) runs first', () => {
      const result = useThen('cheapo review runs and fails', async () => {
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

      then('cheapo review ran (level 1 first)', () => {
        expect(result.stdout).toContain('cheapo');
      });

      then('primo did NOT run yet (level 2 waits)', () => {
        // primo appears in peer reviewers section but with "awaits" status
        expect(result.stdout).toContain('awaits');
        // primo's review didn't run, so no mock-review-primo in reviews section
        expect(result.stdout).not.toContain('mock-review-primo.sh');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] second attempt, cheapo uses more budget', () => {
      const result = useThen('cheapo review runs again', async () => {
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

    when('[t2] third attempt, cheapo exhausts budget', () => {
      const result = useThen('cheapo exhausts, primo can now run', async () => {
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

      then('cheapo is exhausted', () => {
        const output = result.stdout.toLowerCase();
        // .note = use /s flag to match across newlines (dotAll mode)
        expect(output).toMatch(/cheapo.*exhaust|exhaust.*cheapo/s);
      });

      then('primo now runs (level 2 activated)', () => {
        expect(result.stdout).toContain('primo');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 2: level 2 (primo) continues after level 1 exhausted
    // -------------------------------------------------------------------------

    when('[t3] fourth attempt, primo uses budget', () => {
      const result = useThen('primo review runs', async () => {
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

      then('primo ran', () => {
        expect(result.stdout).toContain('primo');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t4] fifth attempt, primo exhausts budget', () => {
      const result = useThen('all reviewers exhausted', async () => {
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

      then('all reviewers exhausted', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('exhaust');
      });

      then('requires human approval', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/approv|human/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 3: human approval bypasses exhausted reviewers
    // -------------------------------------------------------------------------

    when('[t5] human approves despite exhaustion', () => {
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

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t6] pass after human approval', () => {
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

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // STONE 2: WITHIN-BUDGET PASS (no approval needed)
  // ===========================================================================

  given('[journey] stone 2.deploy: within-budget pass, no approval needed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-levels-deploy',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-deployer.sh', { cwd: tempDir });

      // pre-pass stone 1 to get to stone 2
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'src', 'feature.ts'), 'export const f = 1;');
      await fs.writeFile(path.join(tempDir, '.test', 'primo-should-pass'), '');
      await fs.writeFile(path.join(tempDir, '.test', 'cheapo-should-pass'), '');
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.execute', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] artifact created, reviewer passes within budget', () => {
      const result = useThen('stone passes automatically', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'deploy'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'deploy', 'config.yaml'),
          'replicas: 3',
        );

        // make deployer pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'deployer-should-pass'), '');

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.deploy', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage allowed (no approval needed)', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('no approval judge ran', () => {
        expect(result.stdout.toLowerCase()).not.toContain('approved?');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // STONE 3: WITHIN-BUDGET + EXPLICIT APPROVAL JUDGE
  // ===========================================================================

  given('[journey] stone 3.release: within-budget + explicit approval judge', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-levels-release',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-releaser.sh', { cwd: tempDir });

      // pre-pass stones 1 and 2 to get to stone 3
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'src', 'feature.ts'), 'export const f = 1;');
      await fs.writeFile(path.join(tempDir, '.test', 'primo-should-pass'), '');
      await fs.writeFile(path.join(tempDir, '.test', 'cheapo-should-pass'), '');
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.execute', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      await fs.mkdir(path.join(tempDir, 'deploy'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'deploy', 'config.yaml'), 'replicas: 3');
      await fs.writeFile(path.join(tempDir, '.test', 'deployer-should-pass'), '');
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '2.deploy', route: '.', as: 'passed' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] artifact created, reviewer passes but approval still needed', () => {
      const result = useThen('blocked by explicit approval judge', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'release'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'release', 'notes.md'),
          '# Release Notes\n\nv1.0.0',
        );

        // make releaser pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'releaser-should-pass'), '');

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.release', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('reviewer passed', () => {
        expect(result.stdout).toContain('releaser');
      });

      then('blocked by approval judge', () => {
        expect(result.stdout.toLowerCase()).toContain('approved?');
      });

      then('requires human approval', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toMatch(/approv|wait/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] human approves', () => {
      const result = useThen('approval succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.release', route: '.', as: 'approved' },
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

    when('[t2] pass after approval', () => {
      const result = useThen('stone passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.release', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

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

import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-journey');

/**
 * .what = full journey acceptance test for the driver role
 * .why = exercises complete user workflow through route navigation
 *
 * journey:
 *   0.wish.md (fixture)
 *   1.vision.stone (guarded by human approval)
 *   2.research.stone (no guard - auto-pass on artifact)
 *   3.blueprint.stone (guarded by reviews + human approval)
 *   5.execute.stone (guarded by reviews only)
 *
 * structure:
 *   - sequential when blocks for each user action
 *   - state accumulates in tempDir filesystem across the journey
 *   - runs with --runInBand to ensure sequential execution
 */
describe('driver.route.journey.acceptance', () => {
  given('[journey] weather api route', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'journey',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock-review.sh executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: vision stone with human approval gate
    // =========================================================================

    when('[t0] route is initialized', () => {
      const result = useThen('route.stone.get succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains 1.vision', () => {
        expect(result.stdout).toContain('1.vision');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] 1.vision artifact is created and pass attempted', () => {
      const result = useThen('pass without approval fails', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.vision.md'),
          '# Vision\n\nWeather emoji api with temp and description.',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions approval needed', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/approv|wait|blocked|failed/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] 1.vision is approved by human', () => {
      const result = useThen('approval succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
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

    when('[t3] 1.vision pass is reattempted after approval', () => {
      const result = useThen('pass succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('passage marker is created', async () => {
        const exists = await fs
          .access(path.join(scene.tempDir, '.route', '1.vision.passed'))
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: research stone with no guard (auto-pass on artifact)
    // =========================================================================

    when('[t4] next stone is requested after 1.vision', () => {
      const result = useThen('route.stone.get succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains 2.research', () => {
        expect(result.stdout).toContain('2.research');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t5] 2.research pass attempted without artifact', () => {
      const result = useThen('pass fails', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.research', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('error mentions artifact not found', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/artifact|not found/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t6] 2.research artifact created and pass attempted', () => {
      const result = useThen('pass auto-succeeds (no guard)', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '2.research.md'),
          '# Research\n\nPrior art reviewed. Vision is sound.',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.research', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains "unguarded"', () => {
        expect(result.stdout).toContain('unguarded');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: blueprint stone with reviews + human approval
    // =========================================================================

    when('[t7] next stone is requested after 2.research', () => {
      const result = useThen('route.stone.get succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains 3.blueprint', () => {
        expect(result.stdout).toContain('3.blueprint');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t8] 3.blueprint artifact created and pass attempted', () => {
      const result = useThen('pass fails due to review', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '3.blueprint.md'),
          '# Blueprint\n\n## API\n\nGET /weather',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('error mentions blockers or failure', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/block|fail|not passed/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t9] 3.blueprint issues fixed and pass reattempted', () => {
      const result = useThen('review passes but approval still needed', async () => {
        // make review pass + update artifact (changes hash)
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');
        await fs.writeFile(
          path.join(scene.tempDir, '3.blueprint.md'),
          '# Blueprint\n\n## API\n\nGET /weather\n\n## Fixed\n\nIssues addressed.',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('error mentions approval needed', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/approv|wait/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t10] 3.blueprint approved and pass reattempted', () => {
      const result = useThen('pass succeeds after approval', async () => {
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'approved' },
          cwd: scene.tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: execute stone with reviews only (no human approval)
    // =========================================================================

    when('[t11] next stone is requested after 3.blueprint', () => {
      const result = useThen('route.stone.get succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains 5.execute', () => {
        expect(result.stdout).toContain('5.execute');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t12] 5.execute artifact created and pass attempted', () => {
      const result = useThen('pass succeeds (review passes, no approval needed)', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'weather.ts'),
          'export const getWeather = () => ({ emoji: "☀️", temp: 22 });',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '5.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 5: journey complete
    // =========================================================================

    when('[t13] next stone is requested after all stones passed', () => {
      const result = useThen('route.stone.get returns completion', async () =>
        invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains "all stones passed"', () => {
        expect(result.stdout.toLowerCase()).toContain('all stones passed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

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
 * .what = backdate triggered report mtime to bypass time enforcement
 * .why = tests need to verify promise flow without 90 second wait
 *
 * .note = backdates ALL matched .since files (there may be multiple with different hashes)
 */
const backdateTriggeredReport = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<void> => {
  const routeDir = path.join(input.tempDir, '.route');
  const files = await fs.readdir(routeDir).catch(() => []);
  const triggeredFiles = files.filter(
    (f) =>
      f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
      f.endsWith('.triggered.since'),
  );
  const mtimePast = new Date(Date.now() - 31 * 1000);
  for (const triggeredFile of triggeredFiles) {
    const filepath = path.join(routeDir, triggeredFile);
    await fs.utimes(filepath, mtimePast, mtimePast);
  }
};

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

      then('guidance includes --as approved command', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('--as approved');
      });

      then('guidance includes --as passed command', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('--as passed');
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

      then('passage marker is created in passage.jsonl', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');
        const exists = passageContent
          .split('\n')
          .filter(Boolean)
          .some((line) => {
            const entry = JSON.parse(line);
            return entry.stone === '1.vision' && entry.status === 'passed';
          });
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
      const result = useThen('pass blocked by review.self', async () => {
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

      then('shows review.self required', () => {
        expect(result.stdout.toLowerCase()).toContain('review.self');
      });

      then('shows design-complete slug', () => {
        expect(result.stdout).toContain('design-complete');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t8.5] 3.blueprint review.self is promised', () => {
      const result = useThen('promise succeeds', async () => {
        // backdate triggered report to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '3.blueprint',
          slug: 'design-complete',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'promised', that: 'design-complete' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progress 1/1', () => {
        expect(result.stdout).toContain('1/1');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t9] 3.blueprint pass reattempted after promise', () => {
      const result = useThen('blocked by peer review (review.self satisfied)', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('error mentions blockers', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/block|fail/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t9.5] 3.blueprint review set to pass and pass reattempted', () => {
      const result = useThen('review passes but approval still needed', async () => {
        // make review pass via marker
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');

        // update artifact to change hash (triggers re-review with new marker)
        await fs.writeFile(
          path.join(scene.tempDir, '3.blueprint.md'),
          '# Blueprint\n\nFixed API design.',
        );

        // trigger review.self for new hash (artifact changed)
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // backdate triggered report to bypass 30-second time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '3.blueprint',
          slug: 'design-complete',
        });

        // re-promise review.self for new hash
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'promised', that: 'design-complete' },
          cwd: scene.tempDir,
        });

        // try to pass (will fail on approval)
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

    when('[t10] 3.blueprint approved and self-review completed', () => {
      const result = useThen('pass succeeds after approval and self-review', async () => {
        // grant approval
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'approved' },
          cwd: scene.tempDir,
        });

        // start self-review promise (triggers challenge:first)
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'promised', that: 'design-complete' },
          cwd: scene.tempDir,
        });

        // backdate triggered files to bypass 90s time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '3.blueprint',
          slug: 'design-complete',
        });

        // create articulation file
        await fs.mkdir(path.join(scene.tempDir, 'review', 'self'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'review', 'self', '3.blueprint.design-complete.md'),
          '# design review\n\napi design is complete with all endpoints documented.',
        );

        // fulfill promise (articulation file now exists)
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'promised', that: 'design-complete' },
          cwd: scene.tempDir,
        });

        // now pass the stone (all guards satisfied)
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

import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
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
 *   - single sequential test that executes all steps in order
 *   - state accumulates naturally through the journey
 */
describe('driver.route.journey.acceptance', () => {
  given('[journey] weather api route', () => {
    let tempDir: string;

    beforeAll(async () => {
      tempDir = genTempDirForRhachet({
        slug: 'journey',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock-review.sh executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] journey executes sequentially', () => {
      then('completes full route from 1.vision through 5.execute', async () => {
        // =========================================================================
        // PHASE 1: vision stone with human approval
        // =========================================================================

        // get first stone
        const firstStone = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });
        expect(firstStone.code).toEqual(0);
        expect(firstStone.stdout).toContain('1.vision');

        // create artifact
        await fs.writeFile(
          path.join(tempDir, '1.vision.md'),
          '# Vision\n\nWeather emoji api with temp and description.',
        );

        // attempt pass without approval (should fail)
        const passWithoutApproval = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(passWithoutApproval.code).not.toEqual(0);
        expect(
          passWithoutApproval.stdout.toLowerCase() +
            passWithoutApproval.stderr.toLowerCase(),
        ).toMatch(/approv|wait|blocked|failed/);

        // human approves
        const approve1 = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: tempDir,
        });
        expect(approve1.code).toEqual(0);

        // now pass should succeed
        const pass1 = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(pass1.code).toEqual(0);
        expect(pass1.stdout).toContain('passed');

        // verify passage marker
        const passage1Exists = await fs
          .access(path.join(tempDir, '.route', '1.vision.passed'))
          .then(() => true)
          .catch(() => false);
        expect(passage1Exists).toBe(true);

        // =========================================================================
        // PHASE 2: research stone with no guard (auto-pass on artifact)
        // =========================================================================

        // get next stone
        const nextAfter1 = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });
        expect(nextAfter1.code).toEqual(0);
        expect(nextAfter1.stdout).toContain('2.research');

        // attempt pass without artifact (should fail)
        const passWithoutArtifact = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.research', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(passWithoutArtifact.code).not.toEqual(0);
        expect(
          passWithoutArtifact.stdout.toLowerCase() +
            passWithoutArtifact.stderr.toLowerCase(),
        ).toMatch(/artifact|not found/);

        // create artifact
        await fs.writeFile(
          path.join(tempDir, '2.research.md'),
          '# Research\n\nPrior art reviewed. Vision is sound.',
        );

        // pass should auto-succeed (no guard)
        const pass2 = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.research', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(pass2.code).toEqual(0);
        expect(pass2.stdout).toContain('no guard');

        // =========================================================================
        // PHASE 3: blueprint stone with reviews + human approval
        // =========================================================================

        // get next stone
        const nextAfter2 = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });
        expect(nextAfter2.code).toEqual(0);
        expect(nextAfter2.stdout).toContain('3.blueprint');

        // create blueprint artifact
        await fs.writeFile(
          path.join(tempDir, '3.blueprint.md'),
          '# Blueprint\n\n## API\n\nGET /weather',
        );

        // attempt pass (review will fail by default)
        const passWithFailedReview = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(passWithFailedReview.code).not.toEqual(0);
        expect(
          passWithFailedReview.stdout.toLowerCase() +
            passWithFailedReview.stderr.toLowerCase(),
        ).toMatch(/block|fail|not passed/);

        // make review pass by:
        // 1. set external flag (mock-review checks this)
        // 2. update artifact content (changes hash, bypasses cache)
        // in real usage: fix the code → hash changes → fresh review
        await fs.writeFile(path.join(tempDir, '.test', 'review-should-pass'), '');
        await fs.writeFile(
          path.join(tempDir, '3.blueprint.md'),
          '# Blueprint\n\n## API\n\nGET /weather\n\n## Fixed\n\nIssues addressed.',
        );

        // attempt pass (review passes but approval still needed)
        const passWithoutApproval3 = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(passWithoutApproval3.code).not.toEqual(0);
        expect(
          passWithoutApproval3.stdout.toLowerCase() +
            passWithoutApproval3.stderr.toLowerCase(),
        ).toMatch(/approv|wait/);

        // human approves
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'approved' },
          cwd: tempDir,
        });

        // now pass should succeed
        const pass3 = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.blueprint', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(pass3.code).toEqual(0);
        expect(pass3.stdout).toContain('passed');

        // =========================================================================
        // PHASE 4: execute stone with reviews only (no human approval)
        // =========================================================================

        // get next stone
        const nextAfter3 = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });
        expect(nextAfter3.code).toEqual(0);
        expect(nextAfter3.stdout).toContain('5.execute');

        // create execute artifact (src directory with ts files)
        await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, 'src', 'weather.ts'),
          'export const getWeather = () => ({ emoji: "☀️", temp: 22 });',
        );

        // pass execute (review should pass from prior flag)
        const pass5 = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '5.execute', route: '.', as: 'passed' },
          cwd: tempDir,
        });
        expect(pass5.code).toEqual(0);

        // =========================================================================
        // PHASE 5: journey complete
        // =========================================================================

        // get next stone (should be none)
        const nextAfterAll = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });
        expect(nextAfterAll.code).toEqual(0);
        expect(nextAfterAll.stdout.toLowerCase()).toContain('all stones passed');
      });
    });
  });
});

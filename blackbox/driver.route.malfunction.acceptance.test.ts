import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-malfunction');

/**
 * .what = acceptance tests for malfunction behavior
 * .why = verifies two behaviors:
 *   1. malfunction then pass unblocks hook (last status wins)
 *   2. reviewer malfunction not cached (only successes cached)
 */
describe('driver.route.malfunction.acceptance', () => {
  given('[case1] malfunction then pass unblocks hook', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'malfunction-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-malfunction-case1', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );

      // write malfunction status to passage.jsonl (prior malfunction state)
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        '{"stone":"1.feature","status":"malfunction"}\n',
      );

      return { tempDir };
    });

    when('[t0] route.drive hook mode with only malfunction in passage', () => {
      const result = useThen('route.drive halts on malfunction', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 3 (malfunction escalate)', () => {
        expect(result.code).toEqual(3);
      });

      then('stderr mentions malfunction', () => {
        const combined = result.stdout + result.stderr;
        expect(combined.toLowerCase()).toContain('malfunction');
      });
    });

    when('[t1] passed status is appended after malfunction', () => {
      const result = useThen('append passed and drive hook', async () => {
        // append passed status (last entry wins)
        await fs.appendFile(
          path.join(scene.tempDir, '.route', 'passage.jsonl'),
          '{"stone":"1.feature","status":"passed"}\n',
        );

        return invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0 (hook allows stop)', () => {
        expect(result.code).toEqual(0);
      });

      then('passage.jsonl has both entries', async () => {
        const content = await fs.readFile(
          path.join(scene.tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(2);
        expect(lines[0]).toContain('"malfunction"');
        expect(lines[1]).toContain('"passed"');
      });
    });
  });

  given('[case2] reviewer malfunction not cached', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'malfunction-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-malfunction-case2', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // make mock-reviewer.sh executable
      await execAsync('chmod +x .test/mock-reviewer.sh', { cwd: tempDir });

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );

      return { tempDir };
    });

    when('[t0] reviewer malfunctions (exit 1)', () => {
      const result = useThen('route.stone.set triggers malfunction', async () => {
        // set flag to make reviewer malfunction
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-malfunction'),
          '',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (malfunction)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions malfunction', () => {
        const combined = result.stdout + result.stderr;
        expect(combined.toLowerCase()).toContain('malfunction');
      });

      then('review artifact was created with malfunction', async () => {
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await fs.readdir(routeDir);
        const reviewFiles = files.filter(
          (f) => f.includes('.guard.review.') && f.endsWith('.md'),
        );
        expect(reviewFiles.length).toBeGreaterThan(0);

        // check first review artifact contains malfunction
        const reviewPath = path.join(routeDir, reviewFiles[0]!);
        const content = await fs.readFile(reviewPath, 'utf-8');
        expect(content).toContain('malfunction');
      });
    });

    when('[t1] reviewer is fixed and re-run', () => {
      const result = useThen('fresh review runs (not cached)', async () => {
        // remove malfunction flag
        await fs.rm(
          path.join(scene.tempDir, '.test', 'reviewer-should-malfunction'),
        );

        // set flag to make reviewer pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-pass'),
          '',
        );

        // count review artifacts before
        const routeDir = path.join(scene.tempDir, '.route');
        const filesBefore = await fs.readdir(routeDir);
        const reviewFilesBefore = filesBefore.filter(
          (f) => f.includes('.guard.review.') && f.endsWith('.md'),
        );
        const countBefore = reviewFilesBefore.length;

        // attempt pass again
        const passResult = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });

        // count review artifacts after
        const filesAfter = await fs.readdir(routeDir);
        const reviewFilesAfter = filesAfter.filter(
          (f) => f.includes('.guard.review.') && f.endsWith('.md'),
        );
        const countAfter = reviewFilesAfter.length;

        return {
          passResult,
          countBefore,
          countAfter,
          reviewFilesAfter,
        };
      });

      then('exit code is 0 (pass succeeds)', () => {
        expect(result.passResult.code).toEqual(0);
      });

      then('new review artifact was created (not cached malfunction)', () => {
        // fresh review should have created a new artifact
        expect(result.countAfter).toBeGreaterThan(result.countBefore);
      });

      then('latest review artifact shows pass (not malfunction)', async () => {
        // sort by name to get latest (includes iteration number)
        const sorted = result.reviewFilesAfter.sort();
        const latestFile = sorted[sorted.length - 1]!;
        const routeDir = path.join(scene.tempDir, '.route');
        const content = await fs.readFile(
          path.join(routeDir, latestFile),
          'utf-8',
        );
        expect(content).toContain('review passed');
        expect(content).not.toContain('malfunction');
      });
    });
  });

  given('[case3] reviewer constraint not cached', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'malfunction-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-malfunction-case3', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // make mock-reviewer.sh executable
      await execAsync('chmod +x .test/mock-reviewer.sh', { cwd: tempDir });

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );

      return { tempDir };
    });

    when('[t0] reviewer finds constraints (exit 2)', () => {
      const result = useThen('route.stone.set triggers constraint', async () => {
        // set flag to make reviewer find constraints
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-constraint'),
          '',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (constraint blocks)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('review artifact was created', async () => {
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await fs.readdir(routeDir);
        const reviewFiles = files.filter(
          (f) => f.includes('.guard.review.') && f.endsWith('.md'),
        );
        expect(reviewFiles.length).toBeGreaterThan(0);
      });
    });

    when('[t1] artifact fixed and re-run', () => {
      const result = useThen('fresh review runs (not cached)', async () => {
        // remove constraint flag
        await fs.rm(
          path.join(scene.tempDir, '.test', 'reviewer-should-constraint'),
        );

        // set flag to make reviewer pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-pass'),
          '',
        );

        // count review artifacts before
        const routeDir = path.join(scene.tempDir, '.route');
        const filesBefore = await fs.readdir(routeDir);
        const reviewFilesBefore = filesBefore.filter(
          (f) => f.includes('.guard.review.') && f.endsWith('.md'),
        );
        const countBefore = reviewFilesBefore.length;

        // attempt pass again
        const passResult = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });

        // count review artifacts after
        const filesAfter = await fs.readdir(routeDir);
        const reviewFilesAfter = filesAfter.filter(
          (f) => f.includes('.guard.review.') && f.endsWith('.md'),
        );
        const countAfter = reviewFilesAfter.length;

        return {
          passResult,
          countBefore,
          countAfter,
          reviewFilesAfter,
        };
      });

      then('exit code is 0 (pass succeeds)', () => {
        expect(result.passResult.code).toEqual(0);
      });

      then('new review artifact was created (not cached constraint)', () => {
        // fresh review should have created a new artifact
        expect(result.countAfter).toBeGreaterThan(result.countBefore);
      });

      then('latest review artifact shows pass', async () => {
        // sort by name to get latest (includes iteration number)
        const sorted = result.reviewFilesAfter.sort();
        const latestFile = sorted[sorted.length - 1]!;
        const routeDir = path.join(scene.tempDir, '.route');
        const content = await fs.readFile(
          path.join(routeDir, latestFile),
          'utf-8',
        );
        expect(content).toContain('review passed');
      });
    });
  });
});

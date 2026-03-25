import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-artifact-expansion');

/**
 * .what = acceptance tests for $route variable in guard artifact globs
 * .why = verifies fix for $route not expanded in getAllStoneArtifacts
 *
 * the bug: getAllStoneArtifacts used `cwd: input.route` and did not
 * expand `$route` in artifact patterns, so patterns like
 * `$route/1.vision*.md` were searched literally instead of expanded
 *
 * the fix: expand $route to input.route and run globs from repo root
 */
describe('driver.route.artifact-expansion.acceptance', () => {
  given('[case1] guard with $route in artifact pattern (root route)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'artifact-exp-root',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-artifact-expansion', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] no artifact present', () => {
      const result = useThen('pass is blocked', async () => {
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions blocked (not path error)', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        // if $route was not expanded, glob would look for literal "$route/" dir
        // and we'd see weird errors, not clean "blocked" or "artifact" messages
        expect(output).toMatch(/blocked|artifact/);
      });
    });

    when('[t1] artifact created at route path', () => {
      const result = useThen('artifact is detected', async () => {
        // create the artifact where $route expansion should find it
        await fs.writeFile(
          path.join(scene.tempDir, '1.vision.md'),
          '# Vision\n\nTest vision document.',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked by approval, not artifact)', () => {
        // with the fix, artifact is found but approval is still required
        expect(result.code).not.toEqual(0);
      });

      then('output mentions approval (artifact was found)', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        // if $route was broken, we'd get "artifact not found" error
        // correct behavior: artifact found, wait for approval
        expect(output).toMatch(/approv|wait/);
        expect(output).not.toContain('artifact not found');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] approval granted and pass reattempted', () => {
      const result = useThen('pass succeeds', async () => {
        // grant approval
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: scene.tempDir,
        });
        // attempt pass
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage is allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] guard with $route in nested route directory', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'artifact-exp-nested',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-artifact-expansion-nested', {
        cwd: tempDir,
      });

      // move route assets into a nested directory to simulate real-world usage
      // where routes are in .behavior/feature-name/
      const nestedRoute = '.behavior/test-feature';
      await fs.mkdir(path.join(tempDir, nestedRoute), { recursive: true });
      await fs.copyFile(
        path.join(tempDir, '0.wish.md'),
        path.join(tempDir, nestedRoute, '0.wish.md'),
      );
      await fs.copyFile(
        path.join(tempDir, '1.vision.stone'),
        path.join(tempDir, nestedRoute, '1.vision.stone'),
      );
      await fs.copyFile(
        path.join(tempDir, '1.vision.guard'),
        path.join(tempDir, nestedRoute, '1.vision.guard'),
      );

      // bind the nested route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: nestedRoute },
        cwd: tempDir,
      });

      return { tempDir, nestedRoute };
    });

    when('[t0] artifact created in nested route', () => {
      const result = useThen('artifact is detected via $route expansion', async () => {
        // create artifact in nested route directory
        await fs.writeFile(
          path.join(scene.tempDir, scene.nestedRoute, '1.vision.md'),
          '# Vision\n\nNested test vision.',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: scene.nestedRoute, as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked by approval, not path error)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions approval (artifact was found at expanded path)', () => {
        // the key assertion: if $route was not expanded, glob would look for
        // ".behavior/test-feature/$route/1.vision*.md" which doesn't exist
        // correct behavior: $route -> ".behavior/test-feature", finds artifact
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/approv|wait/);
        expect(output).not.toContain('not found');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] approval granted on nested route', () => {
      const result = useThen('pass succeeds', async () => {
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: scene.nestedRoute, as: 'approved' },
          cwd: scene.tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: scene.nestedRoute, as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage is allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

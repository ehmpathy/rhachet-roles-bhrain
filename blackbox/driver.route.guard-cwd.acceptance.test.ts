import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-guard-cwd');

/**
 * .what = acceptance tests for $route variable in guard judge commands
 * .why = verifies fix for doubled path bug when cwd was set to route
 *
 * the bug: runOneStoneGuardJudge used `cwd: input.route` which caused
 * $route to be substituted with a path relative to the route dir,
 * which led to doubled paths like `route/route/stone.guard`
 *
 * the fix: commands now run from repo root, so $route paths resolve correctly
 */
describe('driver.route.guard-cwd.acceptance', () => {
  given('[case1] guard with $route in judge command', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'guard-cwd',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-guard-cwd', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] artifact created but no approval', () => {
      const result = useThen('pass is blocked by judge', async () => {
        // create the artifact
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

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions approval needed (not path error)', () => {
        // the key assertion: if $route was broken, we'd see a path error
        // instead, we should see "approval" or "wait" which means the judge ran correctly
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/approv|wait/);
        // should not contain doubled path errors
        expect(output).not.toContain('not found');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] approval granted and pass reattempted', () => {
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

  given('[case2] guard with $route works from nested route directory', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'guard-cwd-nested',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-guard-cwd-nested', {
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

    when('[t0] judge runs on nested route', () => {
      const result = useThen('judge finds stone at correct path', async () => {
        // create artifact in nested route
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

      then('output mentions approval (judge found the stone)', () => {
        // if $route was broken, we'd get "stone not found" from doubled path
        // correct behavior: judge finds stone but needs approval
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/approv|wait/);
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

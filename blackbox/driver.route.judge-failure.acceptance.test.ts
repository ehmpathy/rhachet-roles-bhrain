import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when, useBeforeAll } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-judge-failure');

/**
 * .what = acceptance tests for judge failure error messages and cache behavior
 * .why = verifies failed judges show informative errors and don't cache as passed
 */
describe('driver.route.judge-failure.acceptance', () => {
  given('[case1] judge command fails without proper passed: metadata', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'judge-fail-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-judge-fail-case1', {
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
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature done.',
      );

      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('judge fails', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (failure)', () => {
        expect(result.code).toEqual(2);
      });

      then('stdout shows informative error (not "no reason captured")', () => {
        expect(result.stdout).not.toContain('no reason captured');
        // should show the actual error or exit code info
        expect(result.stdout).toMatch(/reason:|command exited|stderr:/);
      });

      then('stderr shows detailed failure reason', () => {
        // stderr should contain the detailed judge failure reason
        expect(result.stderr).toContain('judge 1');
        expect(result.stderr).toContain('exit code: 1');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] route.stone.set --as passed is invoked again', () => {
      const result = useThen('judge still fails (not cached as passed)', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (failure)', () => {
        expect(result.code).toEqual(2);
      });

      then('judge is NOT cached as passed (should re-run or show failed)', () => {
        // if it were wrongly cached as passed, it would exit 0
        // the judge should either re-run and fail, or show cached failure
        expect(result.stdout).toContain('judge');
        expect(result.stdout).toContain('blocked');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });
});

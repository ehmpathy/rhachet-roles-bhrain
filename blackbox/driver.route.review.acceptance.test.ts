import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-review');

/**
 * .what = acceptance tests for route.review skill
 * .why = verifies foremen can scan artifacts and review in editor
 */
describe('driver.route.review.acceptance', () => {
  given('[case1] route with single stone artifact', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-review-case1', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.review is invoked for stone 1', () => {
      const result = useThen('route.review succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.review',
          args: { stone: '1' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows owl header', () => {
        expect(result.stdout).toContain('look for the light');
      });

      then('shows route and stone', () => {
        expect(result.stdout).toContain('route =');
        expect(result.stdout).toContain('stone = 1');
      });

      then('shows artifact count', () => {
        expect(result.stdout).toContain('1 file to review');
      });

      then('shows artifact path with symbol', () => {
        expect(result.stdout).toMatch(/\[([\+\~\-])\]/);
        expect(result.stdout).toContain('1.stone.i1.md');
      });

      then('shows approve command', () => {
        expect(result.stdout).toContain('route.stone.set');
        expect(result.stdout).toContain('--as approved');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] route bound but stone not found', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-review-case2', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.review is invoked for nonexistent stone', () => {
      const result = useThen('route.review fails', async () =>
        invokeRouteSkill({
          skill: 'route.review',
          args: { stone: 'nonexistent' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr shows stone not found', () => {
        expect(result.stderr).toContain('not found');
      });

      then('stderr has treestruct format', () => {
        expect(result.stderr).toContain('🦉 look for the light');
        expect(result.stderr).toContain('🗿 route.review');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] no route bound', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role but do NOT bind route
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] route.review is invoked', () => {
      const result = useThen('route.review fails', async () =>
        invokeRouteSkill({
          skill: 'route.review',
          args: { stone: '1' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr shows no route bound', () => {
        expect(result.stderr).toContain('no route bound');
      });

      then('stderr has treestruct format', () => {
        expect(result.stderr).toContain('🦉 look for the light');
        expect(result.stderr).toContain('🗿 route.review');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] explicit route without bind', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] route.review is invoked with --route', () => {
      const result = useThen('route.review succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.review',
          args: { route: '.', stone: '1' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows artifact info', () => {
        expect(result.stdout).toContain('1 file to review');
        expect(result.stdout).toContain('1.stone.i1.md');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] opener command not found in PATH', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review-case5',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-review-case5', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.review is invoked with invalid opener', () => {
      const result = useThen('route.review fails', async () =>
        invokeRouteSkill({
          skill: 'route.review',
          args: { stone: '1', open: 'nonexistent-editor-xyz' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr shows opener not found', () => {
        expect(result.stderr).toContain('not found in PATH');
      });

      then('stderr has treestruct format', () => {
        expect(result.stderr).toContain('🦉 look for the light');
        expect(result.stderr).toContain('🗿 route.review');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });
});

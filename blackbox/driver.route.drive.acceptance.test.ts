import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-drive');

/**
 * .what = acceptance tests for route.drive skill
 * .why = verifies GPS-like guidance shows current stone and pass command
 */
describe('driver.route.drive.acceptance', () => {
  given('[case1] route bound with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case1', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.drive is invoked', () => {
      const result = useThen('route.drive succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows current stone name', () => {
        expect(result.stdout).toContain('stone = 1');
      });

      then('shows stone content', () => {
        expect(result.stdout).toContain('implement the feature');
      });

      then('shows pass command', () => {
        expect(result.stdout).toContain('route.stone.set');
        expect(result.stdout).toContain('--as passed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] route bound with all stones passed (hook mode)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case2', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifacts and pass all stones
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );
      await fs.writeFile(
        path.join(tempDir, '2.stone.i1.md'),
        '# Docs\n\nDocumentation written.',
      );

      // mark both stones as passed (manually via .route/)
      // note: passage files use stone name without extension (e.g., "1.passed" not "1.stone.passed")
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', '1.passed'), '');
      await fs.writeFile(path.join(tempDir, '.route', '2.passed'), '');

      return { tempDir };
    });

    when('[t0] route.drive is invoked with --mode hook', () => {
      const result = useThen('route.drive exits silently', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { mode: 'hook' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout is empty (silent)', () => {
        expect(result.stdout.trim()).toEqual('');
      });
    });
  });

  given('[case3] route bound with all stones passed (direct mode)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case3', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifacts and pass all stones
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );
      await fs.writeFile(
        path.join(tempDir, '2.stone.i1.md'),
        '# Docs\n\nDocumentation written.',
      );

      // mark both stones as passed
      // note: passage files use stone name without extension (e.g., "1.passed" not "1.stone.passed")
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', '1.passed'), '');
      await fs.writeFile(path.join(tempDir, '.route', '2.passed'), '');

      return { tempDir };
    });

    when('[t0] route.drive is invoked without mode', () => {
      const result = useThen('route.drive shows completion', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows route complete', () => {
        expect(result.stdout.toLowerCase()).toContain('complete');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] no route bound', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role but do NOT bind route
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] route.drive is invoked', () => {
      const result = useThen('route.drive exits silently', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout is empty (silent)', () => {
        expect(result.stdout.trim()).toEqual('');
      });
    });
  });
});

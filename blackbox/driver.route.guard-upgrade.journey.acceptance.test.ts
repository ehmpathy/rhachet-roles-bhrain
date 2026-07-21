import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-guard-upgrade');

/**
 * .what = end-to-end journey for route.guard.upgrade (t0 → t4)
 * .why = walks the full driver workflow against ONE temp route: preview → apply
 *        → re-run (idempotency) → blocked → re-preview. snapshots at every step.
 */
describe('driver.route.guard-upgrade.journey.acceptance', () => {
  given('[case1] a bound route two guards behind its supplier', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'guard-upgrade-journey',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      return { tempDir };
    });

    const readGuard = async (name: string): Promise<string> =>
      fs.readFile(path.join(scene.tempDir, 'route', name), 'utf-8');

    const upgrade = async (
      args: Record<string, string | boolean>,
    ): Promise<{ stdout: string; stderr: string; code: number }> =>
      invokeRouteSkill({
        skill: 'route.guard.upgrade',
        args: { route: 'route', ...args },
        cwd: scene.tempDir,
      });

    when('[t0] a driver previews all guards (plan, default)', () => {
      const result = useThen('the command succeeds', async () => upgrade({}));

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the execution guard shows an upgrade-available diff', () => {
        expect(result.stdout).toContain('upgrade available');
      });

      then('the vision guard reports skipped, no provenance', () => {
        expect(result.stdout).toContain('skipped, no provenance');
      });

      then('no guard file was written', async () => {
        expect(await readGuard('5.1.execution.guard')).toContain('old frame');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the driver applies a single stone', () => {
      const result = useThen('the command succeeds', async () =>
        upgrade({ stone: '5.1.execution', mode: 'apply' }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the execution guard now equals the source template', async () => {
        expect(await readGuard('5.1.execution.guard')).toContain('new frame');
      });

      then('the decision reads upgraded, by provenance', () => {
        expect(result.stdout).toContain('upgraded, by provenance');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] the driver re-runs the same upgrade (idempotency)', () => {
      const result = useThen('the command succeeds', async () =>
        upgrade({ stone: '5.1.execution', mode: 'apply' }),
      );

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the decision now reads kept, no change', () => {
        expect(result.stdout).toContain('kept, no change');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] the driver hits the blocked guard (absent source)', () => {
      const result = useThen('the command fails', async () =>
        upgrade({ stone: '9.broken', mode: 'apply' }),
      );

      then('exit code is 2 (constraint)', () => {
        expect(result.code).toBe(2);
      });

      then('the error names the broken guard', () => {
        expect(result.stderr).toContain('9.broken');
      });

      then('the guard file was NOT modified', async () => {
        expect(await readGuard('9.broken.guard')).toContain(
          'uri: templates/absent.guard',
        );
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t4] the driver re-previews the whole route (final state)', () => {
      const result = useThen('the command succeeds', async () => upgrade({}));

      then('exit code is 0', () => {
        expect(result.code).toBe(0);
      });

      then('the upgraded guard now reports kept, no change', () => {
        expect(result.stdout).toContain('kept, no change');
      });

      then('the skip guard still reports skipped, no provenance', () => {
        expect(result.stdout).toContain('skipped, no provenance');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

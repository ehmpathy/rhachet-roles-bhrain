import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-contemplation');

/**
 * .what = acceptance test that admin overrides bypass the contemplation gate (usecase 7)
 * .why = --as overruled / --as forced are admin escapes; the contemplation gate
 *        lives inside setStoneAsPassed, NOT the override handlers, so an admin
 *        override is never re-gated by a driver requirement (design-note B6)
 */
describe('driver.route.peer-contemplation-override.acceptance', () => {
  given('[case1] a stone with an uncontemplated architect blocker', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation-override',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      // trigger the reviews so an uncontemplated .given exists
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.execute', route: '.', as: 'passed' },
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] driver signals --as overruled with no .taken', () => {
      const result = useThen('the override is applied', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        }),
      );

      then('the contemplation gate does not block the override (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('no contemplation reply-prompt is shown', () => {
        expect(result.stdout).not.toContain('the reviewers await your reply');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] driver signals --as forced with no .taken', () => {
      const result = useThen('the override is applied', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        }),
      );

      then('the contemplation gate does not block the override (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('no contemplation reply-prompt is shown', () => {
        expect(result.stdout).not.toContain('the reviewers await your reply');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

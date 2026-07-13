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
 * .what = acceptance test for the discoverability of the new contemplated status
 * .why = a driver learns the verb from `route.stone.set --help`; the new
 *        status and its --that flag must appear there (rule.forbid.friction-hazards)
 */
describe('driver.route.contemplated-help.acceptance', () => {
  given('[case1] a linked driver role', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'contemplated-help',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] driver runs route.stone.set --help', () => {
      const result = useThen('help renders', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { help: true },
          cwd: scene.tempDir,
        }),
      );

      then('the help lists the contemplated status', () => {
        expect(result.stdout).toContain('contemplated');
      });

      then('the help explains contemplated is a peer-review response', () => {
        expect(result.stdout).toContain('peer review response articulated');
      });

      then('the help shows the --as contemplated --that example', () => {
        expect(result.stdout).toContain('--as contemplated --that');
      });

      then('[t0] help output matches snapshot', () => {
        // .why = the --help text is a user-visible contract surface; snapshot it so
        //        drift in the contemplated-status docs is visible in the pr diff
        //        (rule.require.snapshots + blueprint test-tree)
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

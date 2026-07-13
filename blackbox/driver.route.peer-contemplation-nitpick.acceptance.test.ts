import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-nitpick');

/**
 * .what = acceptance test for the nitpick-only contemplation quadrant (usecase 12)
 * .why = contemplation is required iff blockers > 0. a review with 0 blockers and
 *        N nitpicks must NOT gate passage — a driver need not formally answer a
 *        non-gate suggestion, since nitpicks never gate elsewhere (design-note B8)
 */
describe('driver.route.peer-contemplation-nitpick.acceptance', () => {
  given('[case1] a stone gated on a nitpick-only reviewer (0 blockers, 2 nitpicks)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-nitpick',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-nitpick.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      return { tempDir };
    });

    when('[t0] driver attempts --as passed with no .taken', () => {
      const result = useThen('guard runs the review', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('the nitpick-only reviewer does not gate — passage allowed (exit 0)', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('passage = allowed');
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

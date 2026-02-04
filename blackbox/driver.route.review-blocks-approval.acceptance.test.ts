import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-review-blocks');

/**
 * .what = acceptance test that proves reviews block passage even with approval
 * .why = verifies that human approval alone is insufficient when reviews have blockers
 *
 * scenario:
 *   - stone has a guard with both review and approval judges
 *   - human creates artifact
 *   - human approves the stone
 *   - human tries to pass → blocked because reviews still have blockers
 *   - human fixes the artifact (makes review pass)
 *   - human tries to pass → succeeds (both judges now pass)
 */
describe('driver.route.review-blocks-approval.acceptance', () => {
  given('[review-blocks] stone with review + approval guard', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review-blocks',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock-review.sh executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] artifact created', () => {
      const result = useThen('artifact is written', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.plan.md'),
          '# Plan\n\nThis plan has issues that will be flagged by review.',
        );
        return { created: true };
      });

      then('artifact exists', () => {
        expect(result.created).toBe(true);
      });
    });

    when('[t1] human approves the stone', () => {
      const result = useThen('approval succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'approved' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms approval', () => {
        expect(result.stdout).toContain('approval = granted');
      });

      then('stdout has good vibes', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t2] pass attempted with approval but reviews still fail', () => {
      const result = useThen('pass fails despite approval', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions blockers or review failure', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/block|fail|not passed/);
      });

      then('stdout has good vibes', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t3] artifact fixed to pass review', () => {
      const result = useThen('review-should-pass marker created', async () => {
        // create the marker that makes mock-review.sh pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'review-should-pass'),
          '',
        );
        // update artifact to change hash (triggers re-review)
        await fs.writeFile(
          path.join(scene.tempDir, '1.plan.md'),
          '# Plan\n\nThis plan has been fixed and will now pass review.',
        );
        return { fixed: true };
      });

      then('marker exists', () => {
        expect(result.fixed).toBe(true);
      });
    });

    when('[t4] pass reattempted after fix', () => {
      const result = useThen('pass succeeds (both judges pass)', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });
});

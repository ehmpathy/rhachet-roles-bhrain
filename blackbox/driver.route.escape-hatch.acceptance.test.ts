import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-escape-hatch');

/**
 * .what = escape hatch acceptance test for the driver role
 * .why = proves that humans can bypass stuck reviews via guard file edit
 *
 * scenario:
 *   - stone has a guard with a review that ALWAYS fails (perma-blocker)
 *   - human creates artifact and tries to pass → blocked by review
 *   - human edits guard file to remove the reviews section
 *   - human tries to pass again → succeeds (guard with artifacts only)
 */
describe('driver.route.escape-hatch.acceptance', () => {
  given('[escape-hatch] stone with perma-fail review', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'escape-hatch',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make perma-fail-review.sh executable
      await execAsync('chmod +x .test/perma-fail-review.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] artifact created and pass attempted', () => {
      const result = useThen('pass fails due to perma-blocker', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.design.md'),
          '# Design\n\nThis design will never pass the perma-fail review.',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions blockers', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/block|fail/);
      });

      then('stdout has good vibes', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] human edits guard to remove reviews (escape hatch)', () => {
      const result = useThen('guard is updated', async () => {
        // human edits guard file to remove reviews section
        await fs.writeFile(
          path.join(scene.tempDir, '1.design.guard'),
          [
            'artifacts:',
            '  - 1.design*.md',
            '',
            'reviews: []',
            '',
            'judges: []',
          ].join('\n'),
        );
        return { updated: true };
      });

      then('guard file is modified', () => {
        expect(result.updated).toBe(true);
      });
    });

    when('[t2] pass is reattempted after guard edit', () => {
      const result = useThen('pass succeeds (artifacts only)', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout mentions artifacts only', () => {
        expect(result.stdout).toContain('artifacts only');
      });

      then('stdout has good vibes', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });
});

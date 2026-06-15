import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-review-timeout');

/**
 * .what = acceptance test for peer review timeout
 * .why = per wish: "when there's a failure of the reviewer, we need to failfast
 *        and mark the malfunction clearly"
 *
 * journey:
 *   1. review times out - surfaces as malfunction with clear message
 *   2. budget NOT consumed on timeout (same as malfunction)
 */
describe('driver.route.peer-review-timeout.acceptance', () => {
  given('[journey] review timeout surfaces as malfunction', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-review-timeout',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-timeout.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] artifact created, review times out', () => {
      const result = useThen('review times out', async () => {
        // create artifact
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        // invoke with short timeout (100ms) to trigger timeout fast
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
          env: {
            RHACHET_REVIEW_TIMEOUT_MS: '100', // 100ms timeout
          },
        });
      });

      then('exit code is non-zero (malfunction)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output indicates malfunction from timeout', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('malfunction');
        expect(output).toContain('timed out');
      });

      then('budget NOT consumed (still 0/2)', () => {
        // timeout should not consume budget (same as other malfunctions)
        // .note = progress output shows 1/2 when attempted, final output shows 0/2
        //         only check the final output section (after 🗿 route.stone.set)
        const output = result.stdout + result.stderr;
        const finalSection = output.split('🗿 route.stone.set')[1] ?? '';
        expect(finalSection).toContain('0/2');
        expect(finalSection).not.toContain('1/2');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

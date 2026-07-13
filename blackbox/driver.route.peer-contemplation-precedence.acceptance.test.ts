import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, useBeforeAll, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-precedence');

/**
 * .what = acceptance test for concurrent multi-blocker precedence (usecase 13)
 * .why = a stone can be BOTH malfunctioned (a reviewer's verdict is
 *        unreadable) AND uncontemplated (a reviewer holds an unanswered
 *        blocker) at once. the persisted blocker holds ONE value, so the
 *        gate ORDER decides which the driver sees. the malfunction halt
 *        must outrank the contemplation prompt — a driver cannot
 *        contemplate an unparseable critique, so the lower-priority
 *        contemplation prompt must never mask the malfunction that
 *        actually needs a fix (design-note B10; contemplation is LAST)
 *
 * scenario:
 *   - two L1 reviewers, each at budget 3
 *   - "malfunctioner" emits no numeric counts → its verdict is unreadable
 *     → malfunction (the guard cannot infer zero)
 *   - "uncontemplated" holds 1 blocker → a live, unanswered blocker
 *   - the malfunction gate fires unconditionally before the contemplation
 *     gate, so the contemplation prompt is suppressed
 */
describe('driver.route.peer-contemplation-precedence.acceptance', () => {
  given('[case1] one reviewer malfunctions while another holds a blocker', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-precedence',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-malfunction.sh', {
        cwd: tempDir,
      });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'src', 'feature.ts'),
        'export const feature = () => "v1";\n',
      );
      return { tempDir };
    });

    when('[t0] the driver attempts to pass while both reviewers run', () => {
      const result = useThen('the gate halts on the higher-precedence halt', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit non-zero)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('the malfunction halt is surfaced', () => {
        // the unreadable reviewer trips the malfunction gate
        expect(result.stdout.toLowerCase()).toContain('malfunction');
      });

      then('the contemplation prompt is SUPPRESSED by the higher-precedence malfunction', () => {
        // the core precedence guarantee: an unreadable-critique malfunction
        // outranks the driver-fixable contemplation prompt — contemplation
        // is LAST (B10)
        expect(result.stdout).not.toContain('the reviewers await your reply');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

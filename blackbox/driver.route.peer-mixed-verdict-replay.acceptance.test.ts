import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-mixed-verdict-halt',
);

/**
 * .what = acceptance clamp for the REPLAY of a mixed-verdict halt on the
 *         onBoot/onStop surface (route.drive), not just the live route.stone.set pass
 * .why = the halt-precedence fix made the LIVE pass name every reason + remedy, but
 *        a malfunction/constraint halt persisted only a bare status — so a session
 *        restart (onBoot) or stop-hook (onStop) replayed a bare "tell a human",
 *        which drops the also-present exhaustion reason + its overrule/budget
 *        remedies. this clamps the second-surface fix: the replay names every reason
 *        + every remedy too, so the fix reaches every surface a driver actually meets.
 *
 * journey:
 *   - drive 3 rounds → l1 exhausts (budget 2), l3 unlocks + MALFUNCTIONS (exit 1)
 *     → the stone halts with passage=malfunction (persisted with blocker + reason)
 *   - THEN route.drive --when hook.onBoot / hook.onStop must render the SAME reason +
 *     remedies the live pass showed — never the bare malfunction escalation alone
 */
describe('driver.route.peer-mixed-verdict-replay.acceptance', () => {
  given('[journey] a mixed-verdict halt, then replayed via route.drive', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-mixed-verdict-replay',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      // arm l3 to malfunction the moment it unlocks
      await fs.writeFile(
        path.join(tempDir, '.test', 'l3-should-malfunction'),
        '',
      );

      // drive to the mixed-verdict halt: l1 exhausts (budget 2), then l3 malfunctions.
      // each round edits the subject so its hash changes and the reviews re-run.
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
      for (const version of ['v1', 'v2', 'v3']) {
        await fs.writeFile(
          path.join(tempDir, 'src', 'feature.ts'),
          `export const feature = () => "${version}";`,
        );
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: tempDir,
        });
      }

      return { tempDir };
    });

    // =========================================================================
    // the replay surface: route.drive --when hook.onBoot
    // =========================================================================

    when('[t0] route.drive --when hook.onBoot replays the halt', () => {
      const result = useThen('replay renders the halt', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.', when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('CLAMP: replay names BOTH the malfunction AND the exhaustion', () => {
        // .why = the bare replay message dropped the reason entirely; the fix must
        //        carry every reason that co-occurs to the second surface too
        expect(result.stdout).toMatch(/malfunction/i);
        expect(result.stdout).toContain('budget exhausted');
      });

      then('CLAMP: replay offers the overrule remedy', () => {
        expect(result.stdout).toContain('overrule the malfunction');
        expect(result.stdout).toContain('--as overruled');
      });

      then('CLAMP: replay offers the budget + approve remedies', () => {
        // .why = a reviewer is also exhausted beside the malfunction, so the human
        //        should address every reason in ONE pass on replay too. the label is
        //        'increase budget' — the SAME the live guard tree emits, since both
        //        read the shared getAllStoneGuardBlockRemedies list (no drift)
        expect(result.stdout).toContain('increase budget');
        expect(result.stdout).toContain('--as approved');
      });

      then('replay snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // the replay surface: route.drive --when hook.onStop
    // =========================================================================

    when('[t1] route.drive --when hook.onStop replays the halt', () => {
      const result = useThen('replay renders the halt', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.', when: 'hook.onStop' },
          cwd: scene.tempDir,
        }),
      );

      then('CLAMP: onStop replay also names both reasons + remedies', () => {
        expect(result.stdout).toMatch(/malfunction/i);
        expect(result.stdout).toContain('budget exhausted');
        expect(result.stdout).toContain('--as overruled');
      });

      then('replay snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

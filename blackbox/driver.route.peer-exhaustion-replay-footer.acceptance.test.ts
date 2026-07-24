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
  '.test/assets/route-peer-exhaustion-replay-footer',
);

/**
 * .what = acceptance clamp for the "path continues" footer on the REPLAY surface
 *         (route.drive --when hook.onBoot), the pure-exhaustion case
 * .why = the footer (D5, the wish's headline UX deliverable) was wired only into the
 *        LIVE route.stone.set pass. a fresh session that reboots after a human grants
 *        budget to a HIGHER level lands on the route.drive replay — arguably where the
 *        "l3 has engaged, re-drive with --as arrived" guidance matters MOST, since a
 *        restarted session has the least context. this proves the footer reaches that
 *        second surface too, gated by the SAME unlockTransition (so it never renders in
 *        the all-terminal case, where the budget/approve remedies guide instead).
 *
 * journey (budgets l1=1, l3=1 so exhaustion is fast):
 *   - drive v1: l1 runs (1/1) rejects; l3 awaits (l1 not terminal until after run)
 *   - drive v2: l1 SKIPPED (exhausted) → l3 unlocks + runs (1/1) rejects
 *   - drive v3: l1 exhausted (cached); l3 SKIPPED (exhausted) → ALL terminal →
 *               budget-exhausted halt persisted (blocker = review.peer.exhausted)
 *   - grant budget: +2 to l3-reviewer → l3 now non-terminal (a live HIGHER gate)
 *   - REPLAY route.drive --when hook.onBoot → the halt renders WITH the footer, because
 *     l1 stays terminal (exhausted) beneath the now-live l3 (a true upward unlock)
 */
describe('driver.route.peer-exhaustion-replay-footer.acceptance', () => {
  given('[journey] all levels exhausted, l3 re-budgeted, then replayed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-exhaustion-replay-footer',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      // drive to all-exhausted: each round edits the subject so its hash changes and
      // the reviews re-run. v1 runs l1, v2 exhausts l1 + runs l3, v3 exhausts l3.
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

      // a human grants l3 more budget — l3 goes non-terminal (a live HIGHER gate),
      // while l1 stays exhausted (terminal) below it: the true upward-unlock shape
      await invokeRouteSkill({
        skill: 'route.guard.budget',
        args: {
          for: 'review',
          add: '2',
          peer: 'l3-reviewer',
          stone: '1.execute',
          route: '.',
        },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.drive --when hook.onBoot replays the budget-exhausted halt', () => {
      const result = useThen('replay renders the halt', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.', when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('replay shows the reviews (l1 exhausted, l3 re-budgeted + live)', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toMatch(/l1-reviewer[\s\S]*exhausted/);
        expect(result.stdout).toContain('l3-reviewer');
      });

      then('CLAMP: no FALSE HALT — the re-budgeted replay never claims the ladder is spent', () => {
        // .why = the vision's core invariant forbids any "budget exhausted / halted / human
        //        required" read while a higher, non-terminal level still has work. l3 has
        //        been re-budgeted and is live, so this replay must NOT frame the ladder as
        //        halted — that halt text would directly contradict the footer's "a human is
        //        only needed once every level is terminal" (two opposite reads in one stdout)
        expect(result.stdout).not.toContain('budget exhausted');
        expect(result.stdout).not.toContain('halted');
        expect(result.stdout).not.toContain('please ask a human');
      });

      then('CLAMP: the "path continues" footer reaches the replay surface', () => {
        // .why = the D5 deliverable — the replay a fresh session lands on must name the
        //        terminal level, the live level, and the re-drive command, not just the
        //        live route.stone.set pass. the footer self-gates on unlockTransition, so
        //        it renders here precisely because l1 (exhausted) sits below live l3
        expect(result.stdout).toContain('the path continues');
        expect(result.stdout).toContain(
          'l1 is terminal (exhausted 🌙) — it no longer blocks you',
        );
        expect(result.stdout).toContain('l3 has engaged');
        expect(result.stdout).toMatch(/l3 has engaged[\s\S]*--as arrived/);
        expect(result.stdout).toContain(
          'a human is only needed once every level is terminal',
        );
      });

      then('replay snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

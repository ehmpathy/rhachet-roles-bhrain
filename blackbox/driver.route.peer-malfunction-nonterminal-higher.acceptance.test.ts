import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

// reuse the mixed-verdict-halt assets: guard already declares l1 (budget 2, level 1) +
// l3 (budget 5, level 3); the l1 mock gained a backward-compatible malfunction branch
const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-mixed-verdict-halt',
);

/**
 * .what = acceptance clamp for a lower-level MALFUNCTION unlocking a still-NON-terminal higher level
 * .why = malfunction is terminal-for-unlock (like exhaustion), so an l1 malfunction unlocks l3
 *        in the SAME pass — but unlike the mixed-verdict-halt case (where l3 ALSO went terminal
 *        via malfunction), here l3 runs and merely REJECTS, with budget remaining (non-terminal).
 *        this is the distinct state only a synthetic unit test (formatGuardReviewLadderFooter
 *        case6) covered before: prove it end-to-end through the real pipeline —
 *          1. the footer stays SILENT (a malfunction terminal is NOT deferrable, so
 *             unlockTransition is false — the "path continues" hint must never contradict the
 *             overrule-now remedy the malfunction needs)
 *          2. the halt names the MALFUNCTION, not a false "budget exhausted" / "all done"
 *          3. the tree shows l3's REAL rejected verdict + remaining budget, so a driver is never
 *             left guessing whether l3 actually ran
 *
 * journey (single pass):
 *   - l1 MALFUNCTIONS (exit 1, terminal) → l3 unlocks same pass → l3 REJECTS (1/5, non-terminal)
 */
describe('driver.route.peer-malfunction-nonterminal-higher.acceptance', () => {
  given('[journey] l1 malfunctions (terminal), l3 unlocks + rejects (non-terminal)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-malfunction-nonterminal-higher',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      // arm l1 to malfunction the moment it runs (terminal on the first pass)
      await fs.writeFile(
        path.join(tempDir, '.test', 'l1-should-malfunction'),
        '',
      );

      return { tempDir };
    });

    when('[t0] one pass: l1 malfunctions, l3 unlocks + rejects', () => {
      const result = useThen('l1 malfunctions, l3 runs and rejects', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('passage is malfunction (the terminal l1 malfunction drives it)', () => {
        expect(result.stdout).toContain('passage = malfunction');
      });

      then('l1 shows malfunction (terminal)', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toMatch(/l1-reviewer[\s\S]*malfunction/);
      });

      then('l3 ran and REJECTED with budget remaining (unlocked, non-terminal)', () => {
        // .why = the whole point — a driver must see l3 actually ran (not awaits), with a real
        //        rejected verdict and rounds < budget, so it is not left guessing
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toMatch(/l3-reviewer[\s\S]*rejected/);
        expect(result.stdout).toContain('l3, 1/5');
      });

      then('CLAMP: the footer stays SILENT (malfunction is not deferrable)', () => {
        // .why = unlockTransition requires every terminal level be deferrable (approved/exhausted);
        //        a malfunction terminal flips it false, so the "path continues" hint must not appear —
        //        its "human only needed once every level is terminal" line would contradict the halt's
        //        own overrule-now remedy
        expect(result.stdout).not.toContain('the path continues');
        expect(result.stdout).not.toContain('has engaged');
      });

      then('CLAMP: the halt names the malfunction + offers overrule, not a false exhaustion', () => {
        expect(result.stdout).toContain('overrule the malfunction');
        expect(result.stdout).toContain('--as overruled');
        // no level was exhausted here, so the halt must NOT claim a budget exhaustion
        expect(result.stdout).not.toContain('budget exhausted');
      });

      then('KNOWN LIMITATION: live header over-shows the round for a non-consuming malfunction', () => {
        // .why = the live stream seals each reviewer header at inflight START with
        //        rounds + 1 (the optimistic "this round consumes budget" read, true for
        //        passed/rejected). a malfunction does NOT consume a round, and a streamed
        //        line cannot be un-written, so the LIVE tree shows l1 at 1/2 while the
        //        PERSISTED guard tree — rendered from the FINAL meters — shows the
        //        authoritative 0/2 (the count a driver acts on). this pins that bounded
        //        divergence so it cannot drift further unnoticed. it is an extant
        //        stream-emit artifact (genContextCliEmit inflight-seal), out of scope for
        //        the exhaustion-unlock wish — flagged for the wisher, not fixed here.
        expect(result.stdout).toContain('r1: l1-reviewer (l1, 1/2)'); // live (optimistic)
        expect(result.stdout).toContain('r1: l1-reviewer (l1, 0/2)'); // persisted (authoritative)
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

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
  '.test/assets/route-peer-exhaustion-boundary',
);

/**
 * .what = acceptance test for the exhaustion boundary invariants
 * .why = the wish's non-negotiable bar: there is NO observable state where a level reads
 *        `exhausted` while a higher level has not run, and NO "halted" stdout unless every
 *        level is terminal. this test clamps the boundaries the happy-path test does not:
 *
 *   - multi-reviewer level: l3 unlocks only when the LAST l1 reviewer turns terminal,
 *     and it unlocks that SAME pass (not the next)
 *   - order independence: l3 is declared FIRST in the guard, yet runs only after l1
 *     (the guard sorts reviewers low-level-first before it runs them)
 *   - the human halt is the ONLY halt: "budget exhausted" appears exactly once, at the
 *     very end, when every level is terminal — never mid-ladder
 *
 * ladder (see 1.execute.guard):
 *   - l1-alpha (level 1, budget 1)  — exhausts one pass before beta
 *   - l1-beta  (level 1, budget 2)  — the LAST l1 to turn terminal
 *   - l3-reviewer (level 3, budget 1) — declared first, runs last
 */
describe('driver.route.peer-exhaustion-boundary.acceptance', () => {
  given('[journey] multi-reviewer exhaustion unlocks only on last-terminal', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-exhaustion-boundary',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1-alpha.sh', {
        cwd: tempDir,
      });
      await execAsync('chmod +x .test/mock-review-l1-beta.sh', {
        cwd: tempDir,
      });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      return { tempDir };
    });

    // helper: write a fresh artifact to trigger a re-review, then arrive the stone
    const arriveWith = async (input: { version: string }) => {
      await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(scene.tempDir, 'src', 'feature.ts'),
        `export const feature = () => "${input.version}";`,
      );
      return invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.execute', route: '.', as: 'passed' },
        cwd: scene.tempDir,
      });
    };

    // =========================================================================
    // PHASE 1: both l1 reviewers run + reject; l3 awaits (l1 level not terminal)
    // =========================================================================

    when('[t0] both l1 reviewers reject, l3 awaits', () => {
      const result = useThen('l1 pair runs, l3 awaits', async () =>
        arriveWith({ version: 'v1' }),
      );

      then('both l1 reviewers ran and rejected', () => {
        expect(result.stdout).toContain('l1-alpha');
        expect(result.stdout).toContain('l1-beta');
        expect(result.stdout).toMatch(/l1-alpha.*rejected/s);
        expect(result.stdout).toMatch(/l1-beta.*rejected/s);
      });

      then('l3 awaits (l1 level not terminal)', () => {
        expect(result.stdout).toMatch(/l3-reviewer.*awaits/s);
      });

      then('CLAMP: no halt while the ladder still has work', () => {
        expect(result.stdout).not.toContain('budget exhausted');
        expect(result.stdout).not.toContain('halted');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: alpha exhausts (terminal), beta still rejects — l3 STILL awaits
    //          because the l1 LEVEL is not yet fully terminal
    // =========================================================================

    when('[t1] alpha exhausted but beta not — l3 still awaits', () => {
      const result = useThen('alpha terminal, beta not, l3 awaits', async () =>
        arriveWith({ version: 'v2' }),
      );

      then('alpha is exhausted (budget 1 spent, skipped this pass)', () => {
        expect(result.stdout).toMatch(/l1-alpha.*exhausted/s);
      });

      then('beta ran again and rejected (budget 2, still has a round)', () => {
        expect(result.stdout).toContain('l1-beta');
        expect(result.stdout).toContain('l1, 2/2');
        expect(result.stdout).toMatch(/l1-beta.*rejected/s);
      });

      then('CLAMP: one l1 terminal is NOT enough — l3 awaits until the LAST turns terminal', () => {
        // .why = the level unlocks only when EVERY reviewer at it is terminal. alpha is
        //        exhausted but beta still rejects, so l3 must still await. this is the
        //        multi-reviewer boundary the single-reviewer happy path cannot cover.
        expect(result.stdout).toMatch(/l3-reviewer.*awaits/s);
      });

      then('CLAMP: no false halt — alpha exhausted alone must not read as halted', () => {
        // .why = a lower reviewer exhausted while the level is not yet terminal must never
        //        produce a "budget exhausted"/halt. the halt is for all-terminal only.
        expect(result.stdout).not.toContain('budget exhausted');
        expect(result.stdout).not.toContain('halted');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: beta exhausts — the LAST l1 turns terminal — l3 unlocks + runs
    //          THIS SAME PASS. l3 was declared first, yet runs last (order independence).
    // =========================================================================

    when('[t2] beta exhausts, l1 level all terminal, l3 unlocks + runs same pass', () => {
      const result = useThen('last l1 terminal, l3 runs now', async () =>
        arriveWith({ version: 'v3' }),
      );

      then('both l1 reviewers are terminal (exhausted)', () => {
        expect(result.stdout).toMatch(/l1-alpha.*exhausted/s);
        expect(result.stdout).toMatch(/l1-beta.*exhausted/s);
      });

      then('CLAMP: last l1 terminal unlocks l3 — it runs THIS pass, not the next', () => {
        // .why = the instant the final l1 reviewer turns terminal, l3 runs in the same
        //        pass. l3 shows a real round (1/1) and a verdict, never `awaits`.
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toContain('l3, 1/1');
        expect(result.stdout).toMatch(/l3-reviewer.*rejected/s);
        expect(result.stdout).not.toMatch(/l3-reviewer.*awaits/s);
      });

      then('CLAMP: order independence — l3 declared first, yet ran only after l1 terminal', () => {
        // .why = the guard sorts reviewers low-level-first before it runs them, so a
        //        higher level declared earlier still waits for the lower level. l3 ran
        //        (has a verdict) only now that l1 is terminal — proof the sort holds.
        expect(result.stdout).toMatch(/l3-reviewer.*rejected/s);
      });

      then('CLAMP: no false halt — l3 non-terminal means the ladder is not done', () => {
        expect(result.stdout).not.toContain('budget exhausted');
        expect(result.stdout).not.toContain('halted');
      });

      then('CLAMP: exhaustion narrative present on the terminal l1 reviewers', () => {
        expect(result.stdout).toContain('exhausted 🌙');
        expect(result.stdout).toContain('terminal — does not block higher levels');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: l3 exhausts — EVERY level terminal, none approved — the human halt
    //          fires. this is the FIRST and ONLY time a halt appears.
    // =========================================================================

    when('[t3] l3 exhausts, all levels terminal, the human halt is the only halt', () => {
      const result = useThen('all terminal, halt for human', async () =>
        arriveWith({ version: 'v4' }),
      );

      then('every reviewer is terminal (all exhausted)', () => {
        expect(result.stdout).toMatch(/l1-alpha.*exhausted/s);
        expect(result.stdout).toMatch(/l1-beta.*exhausted/s);
        expect(result.stdout).toMatch(/l3-reviewer.*exhausted/s);
      });

      then('CLAMP: the human halt appears now — and only now, at the true end', () => {
        // .why = the halt is the single human-touch point, reached ONLY when every level
        //        is terminal and none approved. phases t0-t2 asserted its absence; here it
        //        must be present, with the overrule/budget options for the human.
        expect(result.stdout).toContain('budget exhausted');
        expect(result.stdout).toContain('approve');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

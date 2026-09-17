import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import { getAllPourAnnounceLines } from './.test/getAllPourAnnounceLines';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-budget-exhaustion-unlocks-level',
);

/**
 * .mock = the peer reviewer subprocesses (`mock-review-l1.sh`, `mock-review-l3.sh`)
 * .why = a real reviewer costs LLM tokens and needs credentials; this journey must drive
 *        an EXACT budget sequence (reject → reject → skip) across four arrivals, which a
 *        real reviewer cannot be made to reproduce deterministically. the subject here is
 *        the ladder's budget/terminal arithmetic, never the reviewer's judgment.
 * .real = the `--scope peer-budget` acceptance suites drive real reviewer subprocesses
 *         through `rhx review`; that path is the live boundary contract.
 *
 * ⚠️ .note = raised as blocker.1 by `mech-test-scope-purity` at i018. the annotation was
 *    added to every peer suite across i009–i011 and this file was missed by each sweep —
 *    so a reader could not part a deliberately-mocked boundary from one the feature
 *    forgot to document (`rule.forbid.acceptance.mocks`).
 */

/**
 * .what = acceptance test for exhaustion to unlock higher levels
 * .why = verifies that when l1 becomes exhausted (terminal), l3 unlocks
 *
 * key insight: exhaustion is terminal, so higher levels should unlock
 *
 * flow:
 *   - round 1/2: l1 rejected → l3 awaits (l1 not terminal)
 *   - round 2/2: l1 runs, rejected → l3 still awaits (terminal computed AFTER run)
 *   - round 3/2: l1 SKIPPED (exhausted) → l3 unlocks and runs
 *
 * invariant (define.invariant.review.peer.exhausted):
 *   - 'exhausted' only when review was SKIPPED, never when it ran
 *   - round 2/2 runs → shows 'rejected'
 *   - round 3/2 skipped → shows 'exhausted'
 *
 * 🔴 .why each round pins the POUR ANNOUNCE as well as stdout = the announce is a
 *    deterministic stderr contract a driver reads, and its byte string carries the roster
 *    SLUG — `└─ r1:l1-reviewer` is a distinct string from the solo suite's `└─ r1:solo`,
 *    so a 1-wide format pinned elsewhere does not pin this variant.
 *
 * 🔴 .why it earns a snapshot on THIS journey in particular = the announce is composed
 *    from the roster a level is about to pour, so the rounds that SKIP a level emit a
 *    different set of announces than the rounds that run it. that makes the announce
 *    sequence a second, independent witness to the same unlock arithmetic the stdout
 *    oracle asserts — and one that would ship red if a skip ever announced a pour it
 *    did not perform. raised i023/r002 blocker.1
 */
describe('driver.route.peer-budget-exhaustion-unlocks-level.acceptance', () => {
  given('[journey] exhaustion unlocks higher level', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-exhaustion-unlocks',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: round 1/2 - l1 rejected, l3 awaits
    // =========================================================================

    when('[t0] round 1/2: l1 rejected, l3 awaits', () => {
      const result = useThen('l1 runs, l3 awaits', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute', severity: 'urgent' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('l1 shows 1/2 and rejected', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toContain('l1, 1/2');
        expect(result.stdout).toContain('rejected');
      });

      then('l3 awaits l1 (not terminal yet)', () => {
        expect(result.stdout).toMatch(/l3-reviewer.*awaits/s);
      });

      // 🔴 the announce a SKIP suppresses — see the docblock for what each round pins
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: round 2/2 - l1 runs (rejected), l3 still awaits
    // =========================================================================

    when('[t1] round 2/2: l1 rejected, l3 awaits', () => {
      const result = useThen('l1 rejected, l3 awaits', async () => {
        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute', severity: 'urgent' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('l1 shows 2/2 and rejected (ran, not skipped)', () => {
        // .note = review RAN at 2/2, so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only applies when review is SKIPPED (rounds >= budget BEFORE attempt)
        //         budget depletes AFTER this review runs
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toContain('l1, 2/2');
        expect(result.stdout).toMatch(/rejected/i);
      });

      then('l3 still awaits (l1 terminal AFTER round)', () => {
        // .note = l1 becomes terminal AFTER round 2/2 completes
        //         l3 checks terminal state BEFORE it can run
        //         so l3 awaits in this iteration; unlocks in next
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toMatch(/l3-reviewer.*awaits/s);
      });

      then('no premature halt (proceeds to judge)', () => {
        // judge should run, not "halted: exhausted"
        expect(result.stdout).toContain('judge.1');
        expect(result.stdout).toContain('blocked');
        expect(result.stdout).not.toContain('halted');
      });

      // 🔴 the announce a SKIP suppresses — see the docblock for what each round pins
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: round 3/2 - l1 skipped (exhausted), l3 unlocks
    // =========================================================================

    when('[t2] round 3/2: l1 exhausted, l3 unlocks', () => {
      const result = useThen('l1 exhausted, l3 runs', async () => {
        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute', severity: 'urgent' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('l1 shows exhausted (skipped)', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toContain('exhausted');
      });

      then('l3 runs (l1 terminal unlocks level 3)', () => {
        // .note = l1 is terminal (exhausted), so l3 should unlock and run
        //         l3 runs with 1/5 budget (first round for l3)
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toContain('l3, 1/5');
        expect(result.stdout).toMatch(/l3-reviewer.*rejected/s);
      });

      // ---- core invariant clamps (the wish's non-negotiable bar) ----

      then('CLAMP: no exhausted-alone pass — l3 never reads awaits while l1 is exhausted', () => {
        // .why = the driver must NEVER see l1 exhausted while l3 still awaits in the SAME
        //        stdout. the instant l1 turns terminal, l3 runs that pass. an `awaits` here
        //        would be the exact "oh, it is all halted" confusion the wish forbids.
        expect(result.stdout).toContain('exhausted');
        expect(result.stdout).not.toMatch(/l3-reviewer.*awaits/s);
      });

      then('CLAMP: no false halt — no "budget exhausted"/"halted" while l3 is non-terminal', () => {
        // .why = the human-overrule halt fires ONLY when every level is terminal. here l3
        //        ran and rejected (non-terminal), so no exhaustion halt may appear. a
        //        "budget exhausted" or "halted" line mid-ladder is the forbidden false halt.
        expect(result.stdout).not.toContain('budget exhausted');
        expect(result.stdout).not.toContain('halted');
      });

      then('CLAMP: exhaustion narrative present — states terminal + does not block higher', () => {
        // .why = at exhaustion the stdout must guide the driver plainly: the level is
        //        terminal and does not hold the ladder. this is the D5 unlock narrative.
        expect(result.stdout).toContain('exhausted 🌙');
        expect(result.stdout).toContain('terminal — does not block higher levels');
      });

      then('CLAMP: the "path continues" footer names the live level + re-drive command', () => {
        // .why = the vision's headline UX deliverable — the aggregate footer that answers
        //        "so where do i go now?" once a lower level goes terminal. it must name l1
        //        terminal, l3 now live, and the exact --as arrived command to re-drive.
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

      // 🔴 the announce a SKIP suppresses — see the docblock for what each round pins
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: verify exhausted state persists
    // =========================================================================

    when('[t3] exhausted state persists across hash changes', () => {
      const result = useThen('l1 still exhausted', async () => {
        // change artifact to trigger re-check
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4-changed";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute', severity: 'urgent' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('l1 shows exhausted (skipped, uses cached)', () => {
        // .note = l1 exhausted persists across hash changes
        //         uses cached review from prior iteration
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toMatch(/exhausted/i);
      });

      then('l3 runs again (l1 still terminal)', () => {
        // .note = l1 remains terminal (exhausted), so l3 still unlocked
        //         l3 runs with 2/5 budget (second round for l3)
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toContain('l3, 2/5');
        expect(result.stdout).toMatch(/l3-reviewer.*rejected/s);
      });

      then('CLAMP: l1 already terminal on entry — l3 runs this pass, never awaits', () => {
        // .why = when a stone is entered with l1 already exhausted (terminal), l3 must run
        //        on THIS arrive — not wait for a second. an `awaits` here would force the
        //        driver to re-arrive needlessly, the exact stall the wish removes.
        expect(result.stdout).toMatch(/l1-reviewer.*exhausted/s);
        expect(result.stdout).not.toMatch(/l3-reviewer.*awaits/s);
        expect(result.stdout).not.toContain('budget exhausted');
      });

      // 🔴 the announce a SKIP suppresses — see the docblock for what each round pins
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 5: same-hash arrival — l1 exhausted, l3 still runs
    // =========================================================================

    when('[t4] same hash: l1 exhausted at the SAME artifact hash, l3 still runs', () => {
      const result = useThen(
        'l1 exhausted same hash, l3 runs',
        async () => {
          // 🔴 NO artifact change — the hash is identical to [t3].
          // .why = proves l3 unlocks even when the exhausted l1 reviewer's
          //        cached verdict matches the current hash. without the fix,
          //        `computeVerdicts` reads the cached rejected review as
          //        `hasReviewForHash = true` and `wasExhausted = false`, so
          //        the verdict is `rejected` (non-terminal) and l3 never runs

          await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute' });

          return invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.execute', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          });
        },
      );

      then('l1 is exhausted (same hash, no fresh run)', () => {
        expect(result.stdout).toContain('l1-reviewer');
        expect(result.stdout).toMatch(/exhausted/i);
      });

      then('CLAMP: l3 runs — same hash does NOT block level unlock', () => {
        // 🔴 .why = the defect this clamps: l1's own stale rejection happened to sit
        //    at the CURRENT hash (no artifact moved since [t3]), so a hash-only test
        //    read the skipped reviewer as one that ran — verdict `rejected`,
        //    non-terminal, and l3 pinned at `awaits` forever. the driver could not
        //    break the deadlock either, because the only work left was at the level
        //    that would not open.
        //    the fix reads the authoritative `exhaustedReviewerSlugs` set first
        //    (define.invariant.review.peer.level-unlock-on-budget-exhaustion).
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).not.toMatch(/l3-reviewer.*awaits/s);
      });

      then('CLAMP: l3 genuinely RAN — its round count advanced', () => {
        // 🔴 .why = `not awaits` alone is too weak: a level that reads as unlocked
        //    and still pours no lane would satisfy it. [t3] left l3 at 2/5, so a
        //    real pour here reads 3/5 — the round count is the proof of execution,
        //    and it is what parts "unlocked" from "unlocked AND poured".
        expect(result.stdout).toContain('l3, 3/5');
        expect(result.stdout).toMatch(/l3-reviewer.*rejected/s);
      });

      then('CLAMP: l1 stays exhausted — the invariant is not inverted', () => {
        // ⚠️ .why = the opposite error is equally available and much quieter: relax
        //    the test to a bare `rounds >= budget` and a reviewer reads `exhausted`
        //    on the very pass it RAN (define.invariant.review.peer.exhausted).
        //    here l1 truly was skipped, so `exhausted` is correct — and the judge
        //    must agree with the tree, never report a level as unlocked-but-unrun.
        expect(result.stdout).toMatch(/l1-reviewer.*exhausted/s);
        expect(result.stdout).not.toContain('not yet run (still queued)');
      });

      // 🔴 the announce a SKIP suppresses — see the docblock for what each round pins
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

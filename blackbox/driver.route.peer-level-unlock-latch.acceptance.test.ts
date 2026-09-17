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

// reuse the mixed-verdict-halt assets: the l1 mock already carries a flag-driven
// malfunction branch, which is the exact transition this latch exists for
const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-mixed-verdict-halt',
);

/**
 * .mock = reviewer subprocesses (mock-review-l1.sh, mock-review-l3.sh)
 * .why = real reviewers cost LLM tokens and credentials; synthetic scripts let this
 *        suite drive the exact verdict transition (malfunction → reject) the latch
 *        turns on, with no live brain call
 * .real = the full acceptance suite at `--scope peer-budget` exercises real reviewer
 *         subprocesses via `rhx review`; that suite is the live boundary contract
 */

/**
 * .what = reads every `poured` row out of the passage ledger
 * .why = the latch is only as durable as its record, so this journey reads the LEDGER
 *        rather than only the render — a render can be right for a wrong reason
 */
const getPourRows = async (input: {
  cwd: string;
}): Promise<{ status: string; stone: string; level?: number }[]> => {
  const passage = await fs.readFile(
    path.join(input.cwd, '.route', 'passage.jsonl'),
    'utf-8',
  );
  return passage
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
};

/**
 * 🔴 .what = the LEVEL-UNLOCK LATCH, end to end
 *            define.invariant.review.peer.level-unlock-is-a-latch
 *
 * .why = `terminal` is recomputed from the current verdicts on EVERY pass, so a lower
 *        level that reads terminal once can read non-terminal later. absent a latch the
 *        level above it is re-gated after it has already spoken — the driver holds l3's
 *        `.given`, owes it a `.taken`, and the lane silently disappears. the work to
 *        answer l1 is what removes l3.
 *
 * 🔴 .why a malfunction is THE case = `reviewCompleted` excludes it, so a malfunction
 *        spends NO round. it therefore never reaches `rounds >= budget`, never enters
 *        the budget-locked skip, and re-runs every pass forever. the exhaustion path
 *        cannot rescue this; only a latch can.
 *
 * journey:
 *   [t0] l1 MALFUNCTIONS (terminal, 0 rounds) → l3 unlocks and pours
 *   [t1] the reviewer is REPAIRED and now rejects (non-terminal) → l3 MUST still pour
 *   [t2] `--as rewound` → the latch resets → l3 is gated again
 */
describe('driver.route.peer-level-unlock-latch.acceptance', () => {
  given('[journey] a level that poured is never re-gated', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-level-unlock-latch',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });

      // arm l1 to malfunction on its first run — terminal, and it spends no round
      await fs.writeFile(
        path.join(tempDir, '.test', 'l1-should-malfunction'),
        '',
      );

      return { tempDir };
    });

    // =========================================================================
    // [t0] l1 malfunctions (terminal) → l3 unlocks and POURS. the latch is written.
    // =========================================================================

    when('[t0] l1 malfunctions, so l3 pours for the first time', () => {
      const result = useThen('l1 malfunctions, l3 runs', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('l1 shows malfunction (terminal-for-unlock)', () => {
        expect(result.stdout).toMatch(/l1-reviewer[\s\S]*malfunction/);
      });

      then('l3 poured — it ran and rejected', () => {
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).toMatch(/l3-reviewer[\s\S]*rejected/);
        expect(result.stdout).toContain('l3, 1/5');
      });

      then('the pour is recorded in the passage ledger', async () => {
        // 🔴 .why = every later assertion in this journey rests on the row on disk. a
        //    latch that held in-process and wrote no row would pass the NEXT step on
        //    the same invocation and fail it across a fresh one — so the record is
        //    asserted directly, never inferred from the render
        const pours = (await getPourRows({ cwd: scene.tempDir })).filter(
          (r) => r.status === 'poured',
        );
        // .note = BOTH levels latch. l1 poured too — it is always unlocked (no lower
        //         level holds it), so it pours on every pass it has members for. the
        //         latch is written per level that actually poured, never only the
        //         higher ones, which is what keeps the rule one sentence long
        expect(pours.map((r) => r.level).sort()).toEqual([1, 3]);
        expect(pours.every((r) => r.stone === '1.execute')).toEqual(true);
      });

      /**
       * 🔴 .why = the ledger row above proves a level POURED; this proves what the
       *           driver was TOLD about it. they are different oracles over the same
       *           event, and only the second one a human ever reads.
       *
       *           this suite sequences two single-member pours across two levels in
       *           one pass — `🦉 l1 pours 1 lane` then `🦉 l3 pours 1 lane` — which is
       *           the identical shape i023/r002 graded a BLOCKER in
       *           `peer-budget-exhaustion-unlocks-level`. it was untracked at the
       *           time, so no round had seen it. raised i024/r012
       *
       * ⚠️ .note = the precedent is `i019/r9`: a roster filter silently dropped 3 of 4
       *       members and `--resnap` wrote the truncation as the new green. an
       *       unobserved announce is a contract nobody can catch when it drifts
       */
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // [t1] 🔴 THE CLAMP — l1 is repaired and now REJECTS (non-terminal).
    //      absent the latch, l3 would be withdrawn. it must still pour.
    // =========================================================================

    when('[t1] l1 is repaired and now rejects — non-terminal again', () => {
      const result = useThen('l1 rejects, l3 still runs', async () => {
        // 🔴 the repair: drop the malfunction flag, so the l1 mock falls through to
        //    its reject branch. l1 goes terminal → NON-terminal between passes, which
        //    is the transition no other acceptance test in this repo exercises
        await fs.rm(path.join(scene.tempDir, '.test', 'l1-should-malfunction'));

        // move the artifact so l1 genuinely re-runs rather than reads a cache
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('l1 now REJECTS — it is no longer terminal', () => {
        // .why = this is the precondition the clamp below turns on. were l1 still
        //        malfunctioned, l3 would pour on the ordinary ladder read and the
        //        latch would be untested
        expect(result.stdout).toMatch(/l1-reviewer[\s\S]*rejected/);
        expect(result.stdout).not.toMatch(/l1-reviewer[\s\S]*malfunction/);
      });

      then('CLAMP: l3 STILL pours — the latch holds it open', () => {
        // 🔴 .why = the whole invariant. l1 is non-terminal, so the ordinary ladder
        //    read would gate l3 — and l3 has already spoken, so to withdraw it now
        //    strands a conversation the driver is mid-way through
        expect(result.stdout).toContain('l3-reviewer');
        expect(result.stdout).not.toMatch(/l3-reviewer[\s\S]*awaits/);
      });

      then('CLAMP: l3 genuinely RAN again — its round advanced', () => {
        // .why = `not awaits` alone is too weak: a level that reads unlocked and
        //        pours no lane would satisfy it. the round count is the proof
        expect(result.stdout).toContain('l3, 2/5');
      });

      then('the latch stays ONE row — it is not re-appended each pass', async () => {
        // .why = the ledger is append-only, so an unguarded write would add a row per
        //        level per pass forever. one row per (stone, level) is the whole fact,
        //        and the `!has` guard in runStoneGuardReviews is what holds it to one
        const pours = (await getPourRows({ cwd: scene.tempDir })).filter(
          (r) => r.status === 'poured' && r.level === 3,
        );
        expect(pours).toHaveLength(1);
      });

      // 🔴 the LATCH pass — l1 is non-terminal and l3 pours anyway, so this announce
      //    is the one that proves the latch to a human. see [t0] for the full why
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // [t2] 🔴 THE RESET — a rewind is the ONE lever that clears the latch
    // =========================================================================

    when('[t2] the stone is rewound', () => {
      const result = useThen('rewind, then arrive again', async () => {
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'rewound' },
          cwd: scene.tempDir,
        });

        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.execute' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('CLAMP: l3 is GATED again — the rewind reset the latch', () => {
        // 🔴 .why = the latch must be resettable, or a level poured once could never
        //    be re-gated for the life of the route. a rewind is the one lever, and it
        //    is the human's — so this pins that the door the latch holds open can
        //    still be shut deliberately
        expect(result.stdout).toMatch(/l1-reviewer[\s\S]*rejected/);
        expect(result.stdout).toMatch(/l3-reviewer[\s\S]*awaits/);
      });

      then('l3 holds no latch after the rewind', async () => {
        // .why = read the record, never only the render — the render could be right
        //        for a wrong reason (say, l3 out of budget) while the latch persists
        // ⚠️ .note = pours DO legitimately reappear after a rewind: the arrive that
        //    follows it pours l1 again, and that writes a fresh l1 row. so the claim
        //    is narrow and exact — no row for LEVEL 3, because l3 was gated on that
        //    pass and therefore never poured
        const rows = await getPourRows({ cwd: scene.tempDir });
        const lastRewind = rows.map((r) => r.status).lastIndexOf('rewound');
        const l3PoursAfter = rows
          .slice(lastRewind)
          .filter((r) => r.status === 'poured' && r.level === 3);
        expect(l3PoursAfter).toEqual([]);
      });

      // 🔴 the RESET pass — l3 is gated, so its announce must be ABSENT from the
      //    roster while l1's is present. an announce oracle that only ever sees the
      //    present case cannot catch a level that announces a pour it never made
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

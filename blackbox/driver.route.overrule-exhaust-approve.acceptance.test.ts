import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, useWhen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-overrule-exhaust-approve',
);

/**
 * .what = the B5 boundary cell — l1 OVERRULED + l3 EXHAUSTED + human APPROVED → passage allowed.
 * .why = B5 is the one matrix cell that combines the TWO independent forgiveness mechanisms in a
 *        single passage: an overrule (l1) AND the separate exhaustion+approval bypass (l3). the
 *        two live behind two different early-returns in `judgeReviewed`, so a hand-trace can miss
 *        their interaction — exactly what the wish's "exhaustive boundary cases" is meant to catch
 *        mechanically. this journey drives it end-to-end and pins the contract.
 *
 * invariant (define.invariant.review.peer.passage):
 *   - every peer-review guard must be terminal before a stone can pass
 *   - an overruled level is terminal-for-passage (human waved it)
 *   - an exhausted level is terminal, and a human approval clears it
 *   - so l1 overruled + l3 exhausted+approved → EVERY level terminal → passage ALLOWED
 *
 * the danger this clamps: the exhaustion+approval bypass tests `allTerminal` across ALL declared
 * reviewers. an overruled l1 carries a raw verdict of 'rejected' (overrule is a separate flag, not
 * a verdict), so a bypass that reads the RAW verdict would see l1 as non-terminal and wrongly BLOCK
 * this legitimate pass. the clamp: the overrule must count as terminal here, so B5 allows.
 *
 * asset = route-overrule-exhaust-approve (basic=l1 budget 5, premium=l3 budget 1 always-reject).
 */
describe('driver.route.overrule-exhaust-approve.acceptance', () => {
  const genScene = async (input: { slug: string }) => {
    const tempDir = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });
    await fs.writeFile(
      path.join(tempDir, '1.feature.md'),
      '# Feature\n\nImplemented.',
    );
    return tempDir;
  };

  const setStone = (input: {
    tempDir: string;
    as: 'passed' | 'overruled' | 'approved' | 'arrived';
  }) =>
    invokeRouteSkill({
      skill: 'route.stone.set',
      args: { stone: '1.feature', route: '.', as: input.as },
      cwd: input.tempDir,
    });

  // bump the artifact so the review input hash changes → l3 re-evaluates (or is skipped
  // when exhausted). without a hash change the cached verdict is reused and budget stalls.
  const bumpArtifact = (input: { tempDir: string; note: string }) =>
    fs.writeFile(
      path.join(input.tempDir, '1.feature.md'),
      `# Feature\n\nImplemented — ${input.note}.`,
    );

  given('[case1] B5 — l1 overruled, l3 exhausts, human approves → passage allowed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-exhaust-approve-b5' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects (1/5), l3 locked
      await setStone({ tempDir, as: 'overruled' }); // wave l1 → l3 becomes the live gate
      return { tempDir };
    });

    // step 1: l3 runs its one round (1/1) and rejects → passage BLOCKED (l3 not terminal).
    const ranResult = useWhen('[t0] l3 runs its single round and rejects', () => {
      const result = useThen('l3 blocks the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage BLOCKED — l3 ran (1/1) and rejects, not yet terminal', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
        expect(result.stdout).toContain('premium-checker');
        expect(result.stdout).toMatch(/premium-checker[\s\S]*rejected/);
      });

      then('stdout has good vibes (l3 ran, blocked)', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      return result;
    });

    // step 2: bump the hash → l3 is now over budget → SKIPPED = exhausted (terminal).
    // every level is now terminal (l1 overruled, l3 exhausted) → the stone halts for approval.
    const exhaustedResult = useWhen('[t1] l3 exhausts (skipped) → halts for approval', () => {
      const result = useThen('l3 exhausted, all levels terminal', async () => {
        await bumpArtifact({ tempDir: scene.tempDir, note: 'v2 so l3 re-checks' });
        return setStone({ tempDir: scene.tempDir, as: 'passed' });
      });

      then('the prior step truly ran+blocked (sequence precondition)', () => {
        expect(ranResult.code).toEqual(2);
      });

      then('CLAMP: passage BLOCKED — awaits the human, not a silent pass', () => {
        // exit 2 = constraint (human must approve), not merely non-zero — a code 1 (malfunction)
        // here would signal a regression that turned the blocked-constraint into a crash
        expect(result.code).toEqual(2);
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('l3 reads exhausted (its budget is spent, review SKIPPED)', () => {
        expect(result.stdout).toContain('premium-checker');
        expect(result.stdout).toMatch(/premium-checker[\s\S]*exhausted/);
      });

      then('l1 carries the forgiven marker (overruled, terminal)', () => {
        expect(result.stdout).toContain('overruled ✓ — forgiven by human');
      });

      then('stdout has good vibes (exhausted, awaits approval)', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      return result;
    });

    // step 3: human approves the exhausted l3.
    when('[t2] human approves the exhausted reviewer', () => {
      const result = useThen('the approval', async () => {
        // .note = the prior exhausted step is a precondition for a meaningful approval
        // exit 2 = constraint-block (awaits approval), not merely non-zero — a code 1 (malfunction)
        // would mean the precondition crashed rather than cleanly blocked, so this test's premise fails
        expect(exhaustedResult.code).toEqual(2);
        return setStone({ tempDir: scene.tempDir, as: 'approved' });
      });

      then('exit code is 0 — approval recorded', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout has good vibes (approved)', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // step 4: THE CLAMP — with l1 overruled AND l3 exhausted+approved, passage is ALLOWED.
    when('[t3] pass after approval → passage allowed (B5)', () => {
      const result = useThen('the honest B5 pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: exit code is 0 — every level is terminal (overruled + exhausted+approved)', () => {
        // .why = B5's whole point: the l1 overrule and the l3 exhaustion+approval are TWO distinct
        //        forgiveness routes that must COMBINE to allow passage. a bypass that read l1's raw
        //        'rejected' verdict (overrule is a flag, not a verdict) would wrongly block here.
        expect(result.code).toEqual(0);
      });

      then('CLAMP: passage is granted — reason is overruled (an overrule enabled the pass)', () => {
        // .why = passage is legitimately granted, and its reason is `overruled` because an
        //        overrule (l1) was part of what enabled it — the honest token per the vision's
        //        `passage = overruled` sense. the exhausted l3 was cleared by the human approval.
        expect(result.stdout).toContain('passage = overruled');
        expect(result.stdout).not.toContain('passage = blocked');
      });

      then('stdout has good vibes (B5 pass)', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});

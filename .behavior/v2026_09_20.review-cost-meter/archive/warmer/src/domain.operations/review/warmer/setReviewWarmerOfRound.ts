import type { ReviewLane } from '@src/domain.operations/review/asReviewLane';
import { isErrorOfWatermarkFault } from '@src/domain.operations/review/watermark/isErrorOfWatermarkFault';

import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { emitReviewWarmerDisowned } from './emitReviewWarmerDisowned';
import { emitReviewWarmerSpawn } from './emitReviewWarmerSpawn';
import { genReviewWarmer } from './genReviewWarmer';
import { getOneReviewWarmerLane } from './getOneReviewWarmerLane';
import { setReviewWarmerLane } from './setReviewWarmerLane';

/**
 * .what = records an `--warmer off` round's prefix as its lane's current one
 * .why = a warmer exits once its prefix is no longer current, and only a round that
 *        records its own prefix can make it so. an `off` round that wrote naught left
 *        a warmer of an older head to poke a prefix no round sends, until its pokes ran out
 *
 * .note = only a lane some warmer already recorded is rewritten. a lane never warmed
 *         has no warmer to retire, so an `off` round there — the default — writes no
 *         watermark into a repo that never asked for one
 *
 * .note = a lane with no brain on record names no prefix, so there is none to record.
 *         a watermark the store refuses leaves the lane as it stood: this is an aside
 *         to a review whose verdict is written, and must not fail it
 */
const setReviewWarmerLaneOfOffRound = async (input: {
  cwd: string;
  lane: ReviewLane;
}): Promise<void> => {
  const brain = input.lane.brain;
  if (brain === null) return;
  const reviewer = input.lane.slug;
  try {
    const prior = await getOneReviewWarmerLane({ cwd: input.cwd, reviewer });
    if (prior === null) return;
    await setReviewWarmerLane({
      cwd: input.cwd,
      reviewer,
      lane: { head: input.lane.head, brain },
    });
  } catch (error) {
    if (!isErrorOfWatermarkFault({ error })) throw error;
  }
};

/**
 * .what = settles this round's warmer, and says what became of it
 * .why = an inline ternary — a `genReviewWarmer` result or a hand-written refusal
 *        literal, beside a second gate for `--warmer off` — forces a reader to
 *        simulate both branches to learn what a round does about its warmer
 *        (`rule.forbid.inline-decode-friction`). named here, the three outcomes
 *        read as three:
 *
 *        | the round                | the act                                      |
 *        |--------------------------|----------------------------------------------|
 *        | `--warmer off`           | spawn naught; record the prefix; name any    |
 *        |                          | warmer of it still awake                     |
 *        | no lane identity         | spawn naught; say why, since `on` was asked  |
 *        | a lane, a plan           | findsert its warmer, and announce the result |
 *
 * .note = the no-lane refusal states what was UNRECOVERABLE, never that no guard
 *         drove the round. a guard-driven `review.by` writes outside the peer path,
 *         so it too reads as no lane — and a guard DID drive it (rule.forbid.failhide)
 *
 * .note = the warmer watermark keys on `cwd`, the lane's slug, and the lane's prefix
 *         (head + brain). a cwd holds exactly one log root (`<cwd>/.log/bhrain/review`,
 *         the lane's `root`), and this round records its prefix as the lane's current
 *         one, so a warmer of another head exits at its next wake (`genReviewWarmer`) —
 *         the one warmer that pokes per slug is the warmer of the lane `asReviewLane`
 *         names for the meter folds
 *
 * .note = the caller gates on a round that actually reviewed. a round that skipped
 *         or refused spent no prefix, so there is none to keep warm
 */
export const setReviewWarmerOfRound = async (input: {
  cwd: string;
  lane: ReviewLane | null;
  plan: ReviewWarmerPlan | null;
  logDir: string;
}): Promise<void> => {
  // `--warmer off` stops the next spawn, never one an earlier round detached. the
  // round still records its prefix as the lane's current one, so a warmer of an older
  // prefix reads at its next wake that no round sends it, and exits; then the spender
  // still awake on this prefix is named, with the kill that ends it
  if (input.plan === null) {
    if (input.lane === null) return;
    await setReviewWarmerLaneOfOffRound({ cwd: input.cwd, lane: input.lane });
    await emitReviewWarmerDisowned({
      cwd: input.cwd,
      reviewer: input.lane.slug,
    });
    return;
  }

  // a run with no lane identity has no prefix to key a warmer on; the driver
  // asked for one, so the refusal is stated rather than left silent
  if (input.lane === null) {
    emitReviewWarmerSpawn({
      reviewer: '(none)',
      spawn: {
        act: 'refused',
        // a request this run cannot serve, never a fault: no warmer runs, no
        // spend lands, and the caller who asked is the one to act (F72)
        malfunction: false,
        // the clause names the next move (rule.require.errors-name-the-fix): a run
        // with no lane cannot be warmed at all, so the move is to drop the ask
        why: 'this run carries no lane identity, so there is no prefix to key a warmer on; the review ran unwarmed and its verdict stands — drop --warmer, since a hand run has no lane to warm',
      },
    });
    return;
  }

  // a lane with no brain on record names no cache to warm; a poke under a guessed
  // brain would warm another provider's cache, so the refusal is stated
  if (input.lane.brain === null) {
    emitReviewWarmerSpawn({
      reviewer: input.lane.slug,
      spawn: {
        act: 'refused',
        malfunction: false,
        why: 'this run recorded no brain, so there is no cache to name for a warmer',
      },
    });
    return;
  }

  // findsert this lane's warmer, and announce what became of it. the head and the
  // brain both come from the lane — the warmer's identity has one source, the same
  // one every meter fold keys on, so the two cannot disagree
  emitReviewWarmerSpawn({
    reviewer: input.lane.slug,
    spawn: await genReviewWarmer({
      cwd: input.cwd,
      reviewer: input.lane.slug,
      plan: input.plan,
      logDir: input.logDir,
      brain: input.lane.brain,
      head: input.lane.head,
    }),
  });
};

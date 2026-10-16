import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { asGuardDisplayPath } from '../../../asGuardDisplayPath';
import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { computeDisputedConcernCounts } from '../getStoneDisputedConcernCounts';
import { isLaneSkippedByDispute } from '../isLaneSkippedByDispute';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getOneReviewerAwaits } from './getOneReviewerAwaits';

/**
 * .what = one lane's display status, from its meter state plus the stone-wide reads
 * .why = the persisted render needs, per lane, the level it awaits, whether a dispute
 *        quiets it, and a printable path. each is one decision per lane, so the whole row
 *        is named once rather than simulated inline in the orchestrator
 */
export const asReviewPeerMeterStatus = (input: {
  reviewer: { index: number; slug: string; level: number; budget: number };
  lane: {
    cachedReview: RouteStoneGuardReviewArtifact | null;
    rounds: number;
    verdict: ReviewPeerVerdict;
  };
  levelsPoured: ReadonlySet<number>;
  clearanceByLevel: ReadonlyMap<number, { clearForUnlock: boolean }>;
  corpus: Pick<
    Parameters<typeof computeDisputedConcernCounts>[0],
    'absorptions' | 'givens'
  >;
  allowBlockers: number;
  allowNitpicks: number;
  overruled: boolean;
  rootDisplay: string;
}): GuardPeerMeterStatus => {
  const { cachedReview } = input.lane;

  // the lower level this lane awaits, read against the same latch the runner gates on
  const awaits = getOneReviewerAwaits({
    level: input.reviewer.level,
    levelsPoured: input.levelsPoured,
    clearanceByLevel: input.clearanceByLevel,
  });

  // the same two-part predicate the skip itself runs: a lane goes quiet only when its residual
  // tally clears and a dispute stands. a `disputed > 0` shortcut would paint a skip on a lane
  // that ran. it reads the cached counts, so a lane that never spoke cannot be quiet
  const disputed = computeDisputedConcernCounts({
    absorptions: input.corpus.absorptions,
    givens: input.corpus.givens,
    scope: { slug: input.reviewer.slug },
  });
  const skippedByDispute = isLaneSkippedByDispute({
    cachedReview,
    disputed,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
  });

  return {
    index: input.reviewer.index,
    slug: input.reviewer.slug,
    level: input.reviewer.level,
    rounds: input.lane.rounds,
    budget: input.reviewer.budget,
    verdict: input.lane.verdict,
    awaits,
    overruled: input.overruled,
    skippedByDispute,
    // carried through so the tree can show it beside the raw count
    disputed,
    blockers: cachedReview?.blockers ?? 0,
    nitpicks: cachedReview?.nitpicks ?? 0,
    // .note = a meter's `path` is display state, printed verbatim on a `given:` line, so it is
    //         relativized here, at the one place the drive path builds it
    //         (rule.require.single-source-of-truth-for-render)
    path: cachedReview
      ? asGuardDisplayPath({
          pathAbsolute: cachedReview.path,
          root: input.rootDisplay,
        })
      : null,
  };
};

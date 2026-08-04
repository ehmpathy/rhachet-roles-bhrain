import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getAllStoneGuardArtifactsByHash } from '../../../artifact/getAllStoneGuardArtifactsByHash';
import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { getLatestReviewArtifactForIndex } from '../getLatestReviewArtifactForIndex';
import { computeReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';
import { getReviewedJudgeThresholds } from './getReviewedJudgeThresholds';
import { getStoneGuardLevelClearance } from './getStoneGuardLevelClearance';
import { isLevelOverruled } from './isLevelOverruled';

/**
 * .what = computes full peer meter status for all reviewers
 * .why = enables display of reviewer budget/level/verdict in output
 */
export const getAllReviewPeerMeterStatuses = async (input: {
  stone: RouteStone;
  hash: string;
  route: string;
  /**
   * the authoritative list of reviewer slugs skipped-by-exhaustion this iteration (from
   * runStoneGuardReviews), or `null` when the caller has no authoritative list and the heuristic
   * (`no review for hash AND rounds >= budget`) should decide instead.
   * .why = null and [] differ — `null` = "no authoritative list, use the heuristic"; `[]` =
   *        "authoritative: none was exhausted". modeled as `string[] | null` (not optional) so the
   *        two cases are explicit at compile time (rule.forbid.undefined-inputs).
   */
  exhaustedReviewerSlugs: string[] | null;
  /**
   * levels the human has overruled (waved through). an overruled level is terminal-for-unlock
   * and clear-for-passage, so a HIGHER level must NOT show `awaits l<overruled> terminal`, and
   * the level itself is stamped `overruled` for the display consumers. required — an empty set is
   * the explicit "none overruled" value (rule.forbid.undefined-inputs).
   * .why = overrule is a separate forgiveness flag, not a verdict — the raw verdict of an
   *        overruled reviewer stays 'rejected'. without this, the awaits calc reads that raw
   *        verdict as non-terminal and paints a false `awaits` line on the level above it.
   */
  overruledLevels: Set<number>;
}): Promise<GuardPeerMeterStatus[]> => {
  // check if stone has a guard
  if (!input.stone.guard) return [];

  // get all peer reviews from guard
  const peerReviews = getGuardPeerReviews(input.stone.guard);
  if (peerReviews.length === 0) return [];

  // convert skipped slugs to set for O(1) lookup
  const exhaustedSet = new Set(input.exhaustedReviewerSlugs ?? []);

  // an overruled level is cleared for both unlock and passage — read this one predicate
  // wherever a level's terminal-ness matters for display (awaits, overruled stamp)
  const overruledLevels = input.overruledLevels;
  const isOverruled = (level: number): boolean =>
    isLevelOverruled({
      level,
      overruledLevels,
    });

  // load current meters for rounds consumed (per stone)
  // .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const meterBySlug = new Map(
    meters.map(
      (meter) => [meter.reviewer.slug, { rounds: meter.rounds }] as const,
    ),
  );

  // load cached reviews to get blockers (include ALL reviews, not just passed)
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
  });
  const cachedReviews = priorArtifacts.reviews;

  // extract reviewer info from structured reviews
  const reviewersWithIndex = peerReviews.map((review, i) => ({
    index: i + 1,
    slug: review.slug,
    level: review.level ?? 1,
    budget: review.budget,
  }));

  // get thresholds from guard's reviewed? judge (same thresholds for all reviewers)
  const thresholds = getReviewedJudgeThresholds({
    judges: input.stone.guard.judges,
  });
  const allowBlockers = thresholds?.allowBlockers ?? 0;
  const allowNitpicks = thresholds?.allowNitpicks ?? 0;

  // pre-compute reviews for all reviewers (fallback to latest for exhausted)
  // track both review data and whether it's for current hash (to detect skipped)
  const reviewByIndex = new Map(
    await Promise.all(
      reviewersWithIndex.map(async (reviewer) => {
        const rounds = meterBySlug.get(reviewer.slug)?.rounds ?? 0;

        // first try current hash, then fallback to latest review (for exhausted reviewers)
        const reviewForCurrentHash = cachedReviews.find(
          (r) => r.index === reviewer.index,
        );

        // reviewer has rounds but no review for current hash = likely exhausted;
        // find their latest review regardless of hash
        const fallbackReview =
          !reviewForCurrentHash && rounds > 0
            ? await getLatestReviewArtifactForIndex({
                stone: input.stone,
                index: reviewer.index,
                route: input.route,
              })
            : null;

        return [
          reviewer.index,
          {
            review: reviewForCurrentHash ?? fallbackReview ?? null,
            hasReviewForCurrentHash: !!reviewForCurrentHash,
          },
        ] as const;
      }),
    ),
  );

  // derive each reviewer's verdict-relevant state ONCE, keyed by index. both the clearance calc
  // (for the awaits line) and the per-reviewer status below read from this single map — so a
  // reviewer's shown verdict can never drift from the verdict its level-clearance was judged on,
  // and computeReviewPeerVerdict runs once per reviewer, not twice
  // (rule.require.single-source-of-truth-for-render).
  const derivedByIndex = new Map(
    reviewersWithIndex.map((reviewer) => {
      const reviewEntry = reviewByIndex.get(reviewer.index);
      const cachedReview = reviewEntry?.review ?? null;
      const rounds = meterBySlug.get(reviewer.slug)?.rounds ?? 0;
      const hasReviewForCurrentHash =
        reviewEntry?.hasReviewForCurrentHash ?? false;

      // wasExhausted = reviewer was skipped in THIS iteration due to exhaustion
      // .why = a non-null exhaustedReviewerSlugs is authoritative (from runStoneGuardReviews); a
      //        null one means fall back to the heuristic: no review for hash AND rounds >= budget
      // .invariant = a review can only be 'exhausted' if it was SKIPPED (see define.invariant.review.peer.exhausted)
      const wasExhausted =
        input.exhaustedReviewerSlugs !== null
          ? exhaustedSet.has(reviewer.slug)
          : !hasReviewForCurrentHash && rounds >= reviewer.budget;

      const verdict = computeReviewPeerVerdict({
        rounds,
        budget: reviewer.budget,
        blockers: cachedReview?.blockers ?? Infinity,
        nitpicks: cachedReview?.nitpicks ?? 0,
        allowBlockers,
        allowNitpicks,
        exitClass: cachedReview?.exitClass,
        wasExhausted,
      });

      return [reviewer.index, { cachedReview, rounds, verdict }] as const;
    }),
  );

  // the shared clearance primitive decides which lower levels are clear-for-unlock, from the
  // one-per-reviewer verdicts above. an overruled lower level is clear (the human waved it) — the
  // SAME forgiveness the unlock filter and judge apply, read from one source so the `awaits` line
  // below cannot drift from them.
  const clearanceByLevel = new Map(
    getStoneGuardLevelClearance({
      reviewers: reviewersWithIndex.map((reviewer) => ({
        level: reviewer.level,
        verdict: derivedByIndex.get(reviewer.index)!.verdict,
      })),
      overruledLevels,
    }).map((c) => [c.level, c]),
  );

  // build each reviewer's status from the single derived map, then sort by level
  // (low-to-high = cheapest first) for consistent display
  const statuses: GuardPeerMeterStatus[] = reviewersWithIndex
    .map((reviewer) => {
      const derived = derivedByIndex.get(reviewer.index)!;
      const { cachedReview } = derived;

      // this reviewer awaits the FIRST lower level not yet clear-for-unlock (a level with no
      // reviewers is clear — none to await); undefined = no lower level blocks
      const awaitedLevel =
        reviewer.level > 1
          ? Array.from({ length: reviewer.level - 1 }, (_, i) => i + 1).find(
              (level) => !(clearanceByLevel.get(level)?.clearForUnlock ?? true),
            )
          : undefined;
      const awaits: { level: number } | false =
        awaitedLevel !== undefined ? { level: awaitedLevel } : false;

      return {
        slug: reviewer.slug,
        level: reviewer.level,
        rounds: derived.rounds,
        budget: reviewer.budget,
        verdict: derived.verdict,
        awaits,
        overruled: isOverruled(reviewer.level),
        blockers: cachedReview?.blockers ?? 0,
        nitpicks: cachedReview?.nitpicks ?? 0,
        path: cachedReview?.path ?? null,
      };
    })
    .sort((a, b) => a.level - b.level);

  return statuses;
};

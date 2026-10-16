import type { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

/**
 * .what = the rounds each reviewer has consumed, keyed by its slug
 * .why = the lane read looks up rounds per slug; one name states that lookup, so the
 *        orchestrator reads as a narrative (rule.forbid.decode-friction-in-orchestrators)
 * .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
 */
export const asRoundsBySlug = (input: {
  meters: RouteStoneGuardReviewPeerMeter[];
}): Map<string, number> =>
  new Map(
    input.meters.map((meter) => [meter.reviewer.slug, meter.rounds] as const),
  );

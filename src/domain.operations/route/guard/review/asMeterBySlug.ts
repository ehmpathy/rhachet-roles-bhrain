import type { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

/**
 * .what = each reviewer's meter, keyed by its slug
 * .why = the review pass looks up and updates a meter per slug; one name states that lookup,
 *        so the orchestrator reads as a narrative (rule.forbid.decode-friction-in-orchestrators)
 * .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
 * .note = returns a fresh Map the caller owns; the caller may write its own keys into it
 */
export const asMeterBySlug = (input: {
  meters: RouteStoneGuardReviewPeerMeter[];
}): Map<string, RouteStoneGuardReviewPeerMeter> =>
  new Map<string, RouteStoneGuardReviewPeerMeter>(
    input.meters.map((meter) => [meter.reviewer.slug, meter]),
  );

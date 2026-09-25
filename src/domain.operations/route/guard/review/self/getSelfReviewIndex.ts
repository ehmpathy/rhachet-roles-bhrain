import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = the 1-based position of ONE NAMED self review, for the `N/M` a driver reads
 * .why = extracts the findIndex for narrative flow in orchestrators
 *
 * 🔴 .note = this is a DISPLAY ordinal, and no path reads it. it once fed the `rN` segment
 *            of the articulation path, and that segment is RETIRED — the path keys on
 *            (stone, slug) now, both operands the driver already holds. a docblock that
 *            still said "for file name conventions" would send the next maintainer to a
 *            filename that has no ordinal in it
 *
 * ⚠️ .note = this is a SECOND derivation of a position, beside `findNextUnpromisedReview`,
 *            and the pair is deliberate — they answer different questions:
 *
 *            | operation | the question | the input |
 *            |---|---|---|
 *            | `findNextUnpromisedReview` | which review is owed NEXT? | the promised set |
 *            | this one | where does THIS slug sit? | one slug |
 *
 *            so one cannot be expressed as the other: the finder needs the promised set
 *            this caller does not hold, and this needs a slug the finder does not take.
 *            what made the THREE derivations a measured defect was that they answered ONE
 *            question three ways and disagreed; two answers to two questions cannot.
 */
export const getSelfReviewIndex = (input: {
  selfReviews: RouteStoneGuardReviewSelf[];
  slug: string;
}): number => {
  const zeroBasedIndex = input.selfReviews.findIndex(
    (r) => r.slug === input.slug,
  );
  // convert to 1-based: a driver reads `1/2`, never `0/2`
  return zeroBasedIndex + 1;
};

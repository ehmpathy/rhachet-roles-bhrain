import type { ReviewLane } from './asReviewLane';

/**
 * .what = the one string a lane is keyed by in a map
 * .why = every fold that buckets by lane keys on this, so no fold can key on a subset
 *        of the lane (a slug alone, a root and a slug) and merge two lanes the
 *        pairwise test keeps apart
 *
 * .note = a json array rather than a joined string: no separator can collide with a
 *         character inside a root, a slug, or a digest
 */
export const asReviewLaneKey = (input: { lane: ReviewLane }): string =>
  JSON.stringify([
    input.lane.root,
    input.lane.slug,
    input.lane.head,
    input.lane.brain,
  ]);

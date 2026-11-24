import * as path from 'path';

/**
 * .what = the `--output` path `runOneStoneGuardReview` composes for one lane
 * .why = the reviewer of a run is recovered from this path and nowhere else —
 *        the log dir name carries only a stamp, a pid, and a uuid. so the
 *        fixture spells the grammar the guard actually writes, rather than a
 *        stub of convenient shape that could keep a suite green while the
 *        real grammar drifted.
 *
 * .note = the grammar's owner is `runStoneGuardReviews.ts`; `asReviewRunIdentity` is
 *         its declared reader. this is a third expression of it, deliberately:
 *         a fixture that imported the reader would rename along with it and
 *         prove naught.
 */
export const asGuardReviewOutputPath = (input: {
  route: string;
  stone: string;
  slug: string;
  iteration: number;
  index: number;
}): string =>
  path.join(
    input.route,
    '.reviews',
    'peer',
    `${input.stone}._.review.i${input.iteration}.abc123.r${input.index}._.given.by_peer.${input.slug}.report.md`,
  );

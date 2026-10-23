import * as path from 'path';

import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import { SEGMENTS_OF_PEER_REVIEWS_DIR } from '@src/domain.operations/asPeerReviewOutputName';
import { asPeerReviewOutputParts } from '@src/domain.operations/asPeerReviewOutputParts';

/**
 * .what = recovers the behavior route a review was driven from, out of its output path
 * .why = the grove mine reports spend per ROUTE, and the route appears nowhere else
 *        in the log corpus — not in the log dir name (clock + pid + uuid), not in the
 *        args beyond this path.
 *
 * .note = answers null rather than a guess when the anchor is absent. a hand `rhx
 *         review` writes wherever it was told, so it has no route — and an invented
 *         one would be worse than an absent one (rule.forbid.failhide).
 */
const asRouteFromOutput = (input: { output: string }): string | null => {
  const segments = input.output.split(path.sep);
  const at = segments.lastIndexOf(SEGMENTS_OF_PEER_REVIEWS_DIR[0]);
  if (at < 1) return null;
  if (segments[at + 1] !== SEGMENTS_OF_PEER_REVIEWS_DIR[1]) return null;
  return segments.slice(0, at).join(path.sep);
};

/**
 * .what = recovers a review run's guard identity from the `--output` path it was given
 * .why = joins a log dir (named by clock + pid + uuid) back to the reviewer, round, and
 *        stone that produced it — the axes the meter reports on
 *
 * .note = answers null for a review the guard did not run (a hand `rhx review`, a
 *         `review.by` call). that is NOT a defect: such runs are real spend and the
 *         meter still counts them, it simply cannot attribute them to a lane. the
 *         caller buckets them rather than drops them (rule.forbid.failhide).
 *
 * .note = the grammar belongs to the route context, and is consumed here rather
 *         than re-encoded. a prior local regex duplicated it as "the read side
 *         of a write-side grammar" — the reach-in this repo forbids, since the
 *         two could drift independently and a rename on the write side would
 *         lose attribution with naught red at compile time
 *         (rule.forbid.scope-leaks). this operation does only what belongs
 *         here: joins the parsed parts to the recovered route, and casts the
 *         counters to numbers.
 */
export const asReviewRunIdentity = (input: {
  output: string;
}): ReviewRunIdentity | null => {
  const parts = asPeerReviewOutputParts({ name: path.basename(input.output) });
  if (!parts) return null;

  return {
    route: asRouteFromOutput({ output: input.output }),
    stone: parts.stone,
    iteration: Number.parseInt(parts.iteration, 10),
    hash: parts.hash,
    index: Number.parseInt(parts.index, 10),
    slug: parts.slug,
  };
};

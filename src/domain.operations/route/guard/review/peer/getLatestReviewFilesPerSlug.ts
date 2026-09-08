import { compareStrings } from './compareStrings';
import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

/**
 * .what = of every peer review file across ALL hashes, keeps the LATEST per slug
 * .why = the guard has two readers of "the reviews" and they disagreed on which HASHES each
 *        one reaches. the meter (the tree a human reads) crosses hashes keyed by slug; the
 *        `reviewed?` judge read the current hash alone. so once a reviewer exhausted, an edit
 *        moved the hash and that reviewer's verdict left the judge's sight while the tree still
 *        printed it — a disagreement that fails in BOTH directions:
 *
 *        | who exhausted | the judge's tally | the verdict |
 *        |---|---|---|
 *        | every reviewer | EMPTY | a false BLOCK — `no review files found for hash …` |
 *        | one reviewer   | UNDERCOUNTS | a false PASS — an edit discharges an unaddressed verdict |
 *
 *        the second is the unsafe one, and it is the same exit this behavior exists to shut:
 *        a verdict must be answered, never outlived.
 *
 * 🔴 .note = the key is the SLUG, never the index and never the hash. "latest" is a property of
 *         the REVIEWER — a reviewer speaks once per round, and only its most recent word is live.
 *         its neighbour getLatestReviewFilesPerIndex keys by `rN` within one hash, which reads
 *         like this operation and is not: an index is a position in the guard's declaration
 *         order, so it can be reused by a different reviewer when that order changes, and it
 *         cannot carry a verdict across the hash move that is the whole point here.
 *
 * .note = 🔴 the winner is a MAX over a TOTAL order, and the TOTALITY is the guarantee rather
 *         than the max. enumRouteGuardReviewPeerFiles returns raw globby output and no caller
 *         sorts it, so any pick that leans on array order is filesystem-dependent — right on one
 *         machine, wrong on another (rule.forbid.order-dependence). a max over iteration ALONE
 *         is a partial order: two files tied on iteration leave a strict `>` with whichever
 *         arrived first. the path breaks every tie, because two files cannot share a path.
 *
 * .note = the OUTPUT is sorted by slug, a second and separate guarantee. a max makes the winner
 *         order-free; it leaves the SEQUENCE at map-insertion order, which is glob order, which
 *         is the filesystem's. that sequence reaches the judge's tally and its rendered reason,
 *         so an unsorted one would differ per machine. slug is a safe key — the map guarantees
 *         one entry per slug.
 */

export const getLatestReviewFilesPerSlug = (input: {
  reviewFiles: string[];
}): string[] => {
  // .note = deliberate mutation of a scoped local accumulator. the map is allocated here and
  //         never escapes — only its values do, copied into a fresh array — and a group-by is
  //         what a map is for (rule.require.immutable-vars permits isolated, annotated mutation)
  const latestBySlug = new Map<
    string,
    { iteration: number; path: string; slug: string }
  >();

  for (const filePath of input.reviewFiles) {
    const meta = getRouteGuardReviewPeerPathMeta({ path: filePath });
    const candidate = { ...meta, path: filePath };

    const incumbent = latestBySlug.get(meta.slug);
    if (!incumbent) {
      latestBySlug.set(meta.slug, candidate);
      continue;
    }

    // the total order: iteration first, then path as the tie-break that makes it TOTAL
    const isLater =
      candidate.iteration !== incumbent.iteration
        ? candidate.iteration > incumbent.iteration
        : compareStrings(candidate.path, incumbent.path) > 0;
    if (isLater) latestBySlug.set(meta.slug, candidate);
  }

  return [...latestBySlug.values()]
    .sort((a, b) => compareStrings(a.slug, b.slug))
    .map((entry) => entry.path);
};

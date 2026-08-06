import type { ReviewerTreeState } from '../route/guard/tree/formatGuardReviewerTree';
import type { ReviewVerdict } from './ReviewByResult';

/**
 * .what = maps one review.by rubric outcome onto the SHARED ReviewerTreeState that a route peer
 *         reviewer uses, so review.by rows render through the exact same formatGuardReviewerTree
 * .why = the user asked review.by to look like `route.stone.set` peer reviews and to reuse that
 *        formatter verbatim, so the two stay perma-conformed. a rubric has no route meter (level /
 *        rounds / budget), so we pass placeholder values and render with `hideMeter: true`; the
 *        placeholders never reach the output. the `given:` path is the rubric's own review file —
 *        review.by always writes one, so every row has a given (the peer symmetry the user noted).
 *
 * .note = review.by only ever yields passed | rejected | malfunctioned — there is no exhausted,
 *         constraint, or queued (those are route-ladder states). so this maps just those three.
 */
export const asReviewByReviewerTreeState = (input: {
  index: number; // 1-based row number (r1, r2, …)
  slug: string;
  verdict: ReviewVerdict;
  durationMs: number | null;
  outputPath: string;
}): ReviewerTreeState => {
  // placeholders for the route-only meter fields; `hideMeter: true` drops them from the header
  const meterPlaceholder = { level: 1, rounds: 0, budget: 1 };
  const base = {
    index: input.index,
    slug: input.slug,
    ...meterPlaceholder,
    // a review.by row is a flat per-role review, never a route-ladder level, so it is
    // never overrule-scoped — an overrule forgives a route peer level, which review.by has none of
    overruled: false,
  };

  // a malfunction renders the shared malfunction row (💥 + given path), never a fake 0/0
  if (input.verdict.outcome === 'malfunctioned')
    return {
      ...base,
      state: { type: 'malfunction', path: input.outputPath },
    };

  // passed | rejected → the shared finished row: verdict + duration + counts + given path
  const durationSec =
    input.durationMs !== null ? input.durationMs / 1000 : null;
  return {
    ...base,
    state: {
      type: 'finished',
      verdict: input.verdict.outcome === 'rejected' ? 'rejected' : 'approved',
      durationSec,
      blockers: input.verdict.blockers,
      nitpicks: input.verdict.nitpicks,
      path: input.outputPath,
      cached: false,
      // a null tallier only occurs on a malfunction (handled above); a detected verdict always
      // names its tallier. default to deterministic so the type is satisfied for a clean pass.
      tallier: input.verdict.tallier ?? 'deterministic',
    },
  };
};

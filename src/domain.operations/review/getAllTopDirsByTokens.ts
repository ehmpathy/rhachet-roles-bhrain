import type { TokenBreakdownEntry } from './genTokenBreakdownReport';

/**
 * .what = the top N TOP-LEVEL directories of a token breakdown, ranked by tokens
 * .why = the `metrics.expected` preview shows where the prompt's mass sits before
 *        a review is invoked, so a driver can see a runaway glob before it costs
 *        a cent. only top-level dirs are shown, because a nested dir's tokens are
 *        already counted inside its parent and would double the eye's read.
 *
 * .note = 🔴 it sat INLINE in `stepReview`'s orchestrator body until 2026-09-22 —
 *         a full filter/sort/slice/map transformer among the narrative lines,
 *         which is the decode-friction `rule.require.named-transformers` and
 *         `rule.forbid.inline-decode-friction` both forbid. every peer
 *         transformer in this subsystem already has its own file and header;
 *         this one was the outlier, raised by `enroll-impl-arch-defects` at i016.
 *
 * .note = the extraction also closes a second violation the inline form carried:
 *         it took `(breakdown, limit)` POSITIONALLY, which
 *         `rule.forbid.positional-args` forbids. it now takes one named input.
 */
export const getAllTopDirsByTokens = (input: {
  /** the breakdown to rank — files and dirs alike; only top-level dirs survive */
  breakdown: { entries: TokenBreakdownEntry[] };
  /** how many rows the preview shows */
  limit: number;
}): Array<{ path: string; tokensHuman: string; tokensScale: string }> => {
  // a nested dir's tokens are already inside its parent, so rank top-level only
  const dirsTopLevel = input.breakdown.entries.filter(
    (entry) => entry.type === 'DIRECTORY' && !entry.path.includes('/'),
  );

  // rank by the raw token count, then render the two display fields.
  // 🔴 `[...]` before `.sort` — `.sort` mutates IN PLACE and returns the same
  // reference, so a bare `.sort()` here would be an unexamined mutation rather
  // than a deliberate one (rule.require.immutable-vars). the copy is free at this
  // size and it removes the question entirely: today `dirsTopLevel` is a fresh
  // `.filter` result so no caller could observe the reorder, but that is a
  // property of the LINE ABOVE, not of this expression — and a future edit that
  // ranks a passed-in array would silently reorder the caller's own list
  return [...dirsTopLevel]
    .sort((a, b) => asTokensOrder({ a, b }))
    .slice(0, input.limit)
    .map((entry) => ({
      path: entry.path,
      tokensHuman: entry.tokensHuman,
      tokensScale: entry.tokensScale,
    }));
};

/**
 * .what = the rank of two breakdown entries: the heaviest token count first
 * .why = the order is stated once, by name, as every other sort in this subsystem is
 *        (rule.require.named-transformers)
 */
const asTokensOrder = (input: {
  a: TokenBreakdownEntry;
  b: TokenBreakdownEntry;
}): number => input.b.tokens - input.a.tokens;

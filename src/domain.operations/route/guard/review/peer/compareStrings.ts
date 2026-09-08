/**
 * .what = code-unit order over two strings
 * .why = localeCompare reads the runtime's default locale, so its verdict can differ per machine —
 *        the very hazard the "latest per slug" picks exist to shut. `<` is code-unit, hence
 *        locale-free.
 *
 * 🔴 .note = this is ONE guarantee, so it lives in ONE file. it was duplicated verbatim across
 *         getLatestReviewFilesPerSlug and getLatestPeerGivensPerSlug — docblock included — and a
 *         copied guarantee is a guarantee that can drift: to swap one for localeCompare and not
 *         the other makes the two picks disagree per machine, which is the exact defect both were
 *         written to prevent. extracted 2026-09-07 on a reviewer's point.
 *
 * .note = at two call sites this sits under rule.prefer.wet-over-dry's rule-of-three bar, and it
 *         is extracted anyway on purpose. that rule guards against a *premature* abstraction — one
 *         whose shape is still a guess. this shape is not a guess: the two copies were byte-
 *         identical, so there is no variation left to discover, and none of the rule's own
 *         over-abstraction signals apply (no type parameter, no optional params, no vague name).
 *
 * .note = positional args are the Array.prototype.sort comparator contract, not a style choice
 *         (rule.require.named-args, library-api exception)
 */
export const compareStrings = (a: string, b: string): number => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

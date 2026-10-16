/**
 * .what = code-unit order over two strings
 * .why = localeCompare reads the runtime's default locale, so its verdict can differ per machine —
 *        the very hazard the "latest per slug" picks exist to shut. `<` is code-unit, hence
 *        locale-free.
 *
 * 🔴 .note = this is one guarantee, so it lives in one file. it was duplicated verbatim across
 *         getLatestReviewFilesPerSlug and getLatestPeerGivensPerSlug — docblock included — and a
 *         copied guarantee is a guarantee that can drift: to swap one for localeCompare and not
 *         the other makes the two picks disagree per machine, which is the exact defect both were
 *         written to prevent. extracted 2026-09-07 on a reviewer's point.
 *
 * .note = it lives in utils/ because every domain that orders strings reads it — route, review,
 *         reflect, research, git. `compareStrings.localeFree.integration.test.ts` holds the line:
 *         no prod file in src/ calls `localeCompare`
 *
 * .note = positional args are the Array.prototype.sort comparator contract, not a style choice
 *         (rule.require.named-args, library-api exception)
 */
export const compareStrings = (a: string, b: string): number => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

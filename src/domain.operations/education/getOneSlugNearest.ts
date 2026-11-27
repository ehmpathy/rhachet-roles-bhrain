/**
 * .what = the edit distance between two words: inserts, deletes, and swaps of one char each
 * .why = a mistyped --for is most often one or two chars off; the distance ranks the guess
 */
const asEditDistance = (input: { a: string; b: string }): number => {
  const { a, b } = input;
  const rowFirst = Array.from({ length: b.length + 1 }, (_, j) => j);
  const rowLast = [...a].reduce(
    (prev, charA, i) =>
      [...b].reduce(
        (row, charB, j) => [
          ...row,
          Math.min(
            prev[j + 1]! + 1,
            row[j]! + 1,
            prev[j]! + (charA === charB ? 0 : 1),
          ),
        ],
        [i + 1],
      ),
    rowFirst,
  );
  return rowLast[b.length]!;
};

/**
 * .what = the candidate nearest a slug by edit distance, or null when none is near
 * .why = a typo in `--for` is the common miss; the refusal names the role meant, so the
 *        fix is a paste (rule.require.errors-name-the-fix)
 * .note = "near" is within a third of the slug's length, so an unrelated word names none
 */
export const getOneSlugNearest = (input: {
  slug: string;
  candidates: string[];
}): string | null => {
  const ranked = input.candidates
    .map((candidate) => ({
      candidate,
      distance: asEditDistance({ a: input.slug, b: candidate }),
    }))
    .sort((x, y) => x.distance - y.distance);
  const best = ranked[0];
  if (!best) return null;
  return best.distance <= Math.max(1, Math.floor(input.slug.length / 3))
    ? best.candidate
    : null;
};

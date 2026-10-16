/**
 * .what = casts a diff (or change) list into the plain path list the joins read
 * .why = `getAllTargetsJoined` and the exclusion filter both operate on PATHS,
 *        never on diffs, so the projection is a real step in the scope walk —
 *        and it was stated inline in `stepReview`, whose lines should each read
 *        as one named operation (`rule.require.narrative-flow`)
 *
 * .note = it reads `path` alone, so a `FileChange` (a selection with no patch yet) and a
 *         `FileDiff` both cast
 */
export const asPathsOfFileDiffs = (input: {
  of: { path: string }[];
}): string[] => input.of.map((diff) => diff.path);

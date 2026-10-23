/**
 * .what = the brace depth before each char of a text
 * .why = a comma separates two members only at the depth its list opened at, so every split
 *        below reads one depth walk rather than re-count braces per comma
 */
const asDepthsBeforeEachChar = (input: { chars: string[] }): number[] =>
  input.chars.reduce<number[]>((acc, char, index) => {
    const before = index === 0 ? 0 : acc[index - 1]!;
    const prior = index === 0 ? '' : input.chars[index - 1]!;
    const delta = prior === '{' ? 1 : prior === '}' ? -1 : 0;
    return [...acc, before + delta];
  }, []);

/**
 * .what = a text cut at each comma that sits at one brace depth
 * .why = a member may carry a brace list of its own, so a split at every comma would cut that
 *        inner list in half and the partition would claim naught, silently
 */
const asPiecesAtDepth = (input: { text: string; depth: number }): string[] => {
  const chars = [...input.text];
  const depths = asDepthsBeforeEachChar({ chars });
  const cuts = chars
    .map((char, index) =>
      char === ',' && depths[index] === input.depth ? index : -1,
    )
    .filter((index) => index >= 0);
  const bounds = [-1, ...cuts, chars.length];
  return bounds
    .slice(0, -1)
    .map((start, index) => input.text.slice(start + 1, bounds[index + 1]));
};

/**
 * .what = whether a text is one brace pair that spans it whole — `{a,b}`, never `{a}/{b}`
 * .why = only a whole brace list is a list of members; a brace inside a longer glob
 *        (`src/{a,b}/**`) is one glob the matcher expands itself
 */
const isOneWholeBraceList = (input: { text: string }): boolean => {
  if (!input.text.startsWith('{') || !input.text.endsWith('}')) return false;
  const chars = [...input.text];
  const depths = asDepthsBeforeEachChar({ chars });
  return depths.slice(1).every((depth) => depth >= 1);
};

/**
 * .what = the globs one declaration's text names, in written order
 * .why = a caller names several globs in whichever form comes to hand, and all of them read
 *        the same: a bare comma list (`a/**,b/**`), one brace list (`{a/**,b/**}`), or a mix.
 *        the bare list needs no braces, so the shell cannot expand it and no brace can be left
 *        unclosed — the form that is easiest to get right the first time
 *
 * .note = 🔴 a brace inside a longer glob (`src/{a,b}/**`) is one glob, never several members,
 *         and a comma inside it never splits — the split reads depth 0 only, then expands a
 *         piece that is one whole brace list at its own depth-1 commas
 * .note = empty pieces drop, so a trailer comma or a stray space claims naught rather than
 *         the repo root
 */
export const asReviewPartitionGlobsOfText = (input: {
  text: string;
}): string[] =>
  asPiecesAtDepth({ text: input.text.trim(), depth: 0 })
    .map((piece) => piece.trim())
    .flatMap((piece) =>
      isOneWholeBraceList({ text: piece })
        ? asPiecesAtDepth({ text: piece.slice(1, -1), depth: 0 })
        : [piece],
    )
    .map((glob) => glob.trim())
    .filter((glob) => glob);

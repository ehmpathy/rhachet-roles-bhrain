/**
 * .what = whether a glob holds a comma outside any `{…}` group
 * .why = no review glob flag splits a value on `,` — a comma inside `{a,b}` is glob
 *        alternation — so a comma outside braces joins two globs into a pattern no file
 *        can match. a refusal that sees one can name the real fix: repeat the flag
 */
export const isGlobJoinedByComma = (input: { glob: string }): boolean =>
  [...input.glob].reduce(
    (state, char) => {
      if (state.found) return state;
      if (char === '{') return { depth: state.depth + 1, found: false };
      if (char === '}')
        return { depth: Math.max(0, state.depth - 1), found: false };
      return { depth: state.depth, found: char === ',' && state.depth === 0 };
    },
    { depth: 0, found: false },
  ).found;

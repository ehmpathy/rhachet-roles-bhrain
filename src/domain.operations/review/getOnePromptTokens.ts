/**
 * .what = the tokens that made up the prompt — input plus both cache axes
 * .why = declared once as the denominator of every cache share on the `--of`
 *        axis: the tree report, the tree renderer, the grove report, and the
 *        grove renderer all read it. four expressions of one quantity can
 *        drift silently — a `cacheSet` dropped from one raises its share with
 *        no figure visibly wrong (rule.require.single-source-of-truth-for-render).
 *        sits at `review/`, not `meter/` or `grove/`, since callers in both
 *        peer modules read it (rule.prefer.most-common-denominator)
 *
 * .note = `output` is excluded, and the exclusion is the whole definition —
 *         output tokens are generated, never sent, so a cache can serve none
 *         of them. their inclusion would understate every share by their
 *         mass (measured: 39.9% against a true 40.0%). the input type is
 *         narrowed to the three axes it may read, so `output` is unreachable
 *         from the signature, not merely excluded by the body
 */
export const getOnePromptTokens = (input: {
  tokens: { input: number; cacheSet: number; cacheGet: number };
}): number =>
  input.tokens.input + input.tokens.cacheSet + input.tokens.cacheGet;

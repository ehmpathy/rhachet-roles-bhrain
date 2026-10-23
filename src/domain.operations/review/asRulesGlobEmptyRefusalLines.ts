import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';
import { isGlobJoinedByComma } from '@src/domain.operations/review/isGlobJoinedByComma';

/**
 * .what = the lines beneath a `--rules glob found nada` refusal: the globs asked for,
 *         and where to look
 * .why = every refusal in this subdomain renders through a named `as*Lines` transformer
 *        (`asReviewScopeEmptyRefusalLines`), so the tree shape and its glyphs have one
 *        home per refusal, never a hand copy inline in `stepReview`
 *
 * .note = a comma outside braces is the one cause the hint can name for sure. a
 *         comma-joined list matches no file while each half does, and a generic "verify
 *         the pattern" hint sends the caller to audit globs that were correct
 */
export const asRulesGlobEmptyRefusalLines = (input: {
  ruleGlobs: string[];
}): string[] => [
  `   └─ rules: ${input.ruleGlobs.join(', ')}`,
  ...asDidYouKnowLines({
    rows: [
      input.ruleGlobs.some((glob) => isGlobJoinedByComma({ glob }))
        ? 'a comma does not split a glob — repeat --rules once per glob'
        : 'verify the glob pattern matches files in your repo',
    ],
  }),
];

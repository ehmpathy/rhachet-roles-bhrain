import { asErrorMessage } from './asErrorMessage';

/**
 * .what = the one-line headline of a caught throw, with its class labels cut off
 * .why = a `HelpfulError` message is its headline, a blank line, and a pretty-printed
 *        metadata block. inlined mid-sentence, those extra lines carry no tree glyphs, so a
 *        render breaks at the row a reader most needs to scan — and the class label it
 *        opens with repeats the header the caller already printed, so one error reads as
 *        two. the run report's defect row already keeps the headline alone
 *        (`genReviewRunStdout`); this is that law for every other inline fault render
 *        (rule.require.treestruct-output, rule.forbid.snapshot-visual-blemishes)
 *
 * .note = only the run of labels at the HEAD is cut — `💥 MalfunctionError: `,
 *         `✋ ConstraintError: `, or a bare `<Name>Error: `, as many as were stacked by
 *         wraps. a label mid-message is prose about some other error, and stays
 * .note = the full error is not lost: the caller still holds the thrown value for its
 *         logs, and the thrown error keeps its metadata
 */
export const asErrorHeadline = (input: { error: unknown }): string => {
  const [headline] = asErrorMessage({ error: input.error }).split('\n');
  return (headline ?? '')
    .replace(/^(?:(?:💥 |✋ )?[A-Za-z]*Error: )+/u, '')
    .trim();
};

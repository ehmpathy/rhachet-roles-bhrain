/**
 * .what = an error's text with every class label at its head cut off
 * .why = `String(error)` of a HelpfulError opens with its own labels, one per wrap —
 *        `Error: UnexpectedCodePathError: …`. the run report's defect row names the
 *        class once, in its own `💥 MalfunctionError:` header, so the stored body must
 *        carry none, or one error reads as three
 *
 * .note = only the run of `<Name>Error: ` labels at the head is cut. a label mid-message
 *         is prose about some other error, and stays
 */
export const asDefectBodySansClassLabels = (input: {
  error: unknown;
}): string => String(input.error).replace(/^(?:[A-Za-z]*Error: )+/, '');

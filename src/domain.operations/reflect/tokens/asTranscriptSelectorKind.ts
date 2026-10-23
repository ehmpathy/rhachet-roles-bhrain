/**
 * .what = the forms a `--from` selector can take
 * .why = each form has its own lookup and its own failure
 */
export type TranscriptSelectorKind = 'current' | 'uuid' | 'glob' | 'path';

/**
 * .what = which form a `--from` selector takes
 * .why = the decision is pure text, so it is testable without a filesystem; the lookup
 *        that follows it is the i/o
 */
export const asTranscriptSelectorKind = (input: {
  selector: string;
}): TranscriptSelectorKind => {
  if (input.selector === '@current') return 'current';
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.selector,
    )
  )
    return 'uuid';
  if (/[*?[\]{}]/.test(input.selector)) return 'glob';
  return 'path';
};

import { getOneSharedPrefixByteCount } from '@src/domain.operations/review/meter/getOneSharedPrefixByteCount';

/**
 * .what = how much of two prompts a prefix cache could serve from one another
 * .why = turns the raw offset into the two figures a reader acts on: the cacheable
 *        head, and the share of the later prompt it covers.
 *
 *        it sits beside `getOneSharedPrefixByteCount` rather than inside it, because a
 *        file exports one operation — and the two answer different questions. the count
 *        is the raw measurement; this is the measurement made legible
 *        (rule.require.single-responsibility).
 *
 * .note = `earlier` and `later` are named for their ORDER, never `a`/`b`, because the
 *         share is taken over the LATER prompt — the one a cache would be asked to
 *         serve. swap them and the denominator changes, silently.
 *
 * .note = `sharedShare` is null where the later prompt is empty: a ratio over zero
 *         bytes is undefined, and a 0 would read as a measured cold prefix
 */
export const getOneSharedPrefixOverlap = (input: {
  earlier: string;
  later: string;
}): {
  sharedBytes: number;
  laterBytes: number;
  sharedShare: number | null;
} => {
  const sharedBytes = getOneSharedPrefixByteCount({
    a: input.earlier,
    b: input.later,
  });
  const laterBytes = Buffer.byteLength(input.later, 'utf-8');
  return {
    sharedBytes,
    laterBytes,
    // an empty later prompt has no share to state; null, never a fake 0%
    sharedShare: laterBytes > 0 ? sharedBytes / laterBytes : null,
  };
};

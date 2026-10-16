/**
 * .what = renders a count beside a noun that agrees with it
 * .why = a grove walk emits its progress to a live terminal, so `1 trees` and
 *        `1 carry review logs` are read by a human, not a parser
 *        (rule.forbid.snapshot-visual-blemishes).
 *
 * .note = the `count === 1` decision is shared across this, `genReviewMeterStdout`'s
 *         `asBucketRow`, and `genReviewGroveStdout`'s `asRollupLines`
 *         (rule.prefer.wet-over-dry) — a drift would read `1 runs` on one surface,
 *         `1 run` on its peer.
 *
 * .note = the pad is an option, off by default: a prose line must not end in a
 *         stray space, but a column needs one for alignment.
 */
export const asCountedNoun = (
  input: {
    /** how many there are */
    count: number;
    /** the word when there is exactly one */
    one: string;
    /** the word for every other count, zero included */
    many: string;
  },
  options?: {
    /**
     * pad the noun to the wider of `one` and `many`, so a column of these stays
     * flush down the block (rule.require.treestruct-output).
     *
     * off by default — a prose line with this would ship a stray space into
     * a snapshot, the blemish this operation exists to avoid.
     */
    align?: boolean;
    /**
     * right-align the count into this width, so the digits stack.
     *
     * .why = a caller cannot do this itself once the phrase is one string — the
     *        count is no longer addressable, so a `padStart` on the whole phrase
     *        moves the digits and the noun together.
     */
    padCount?: number;
    /**
     * render the count with this figure, e.g. a thousands separator.
     *
     * .why = a grove total runs to thousands, so its column reads `12,408`; the
     *        noun beside it must still agree, and that choice stays HERE
     */
    figure?: (count: number) => string;
  },
): string => {
  const noun = input.count === 1 ? input.one : input.many;
  const width = Math.max(input.one.length, input.many.length);
  const figured = options?.figure
    ? options.figure(input.count)
    : String(input.count);
  const count =
    options?.padCount === undefined
      ? figured
      : figured.padStart(options.padCount);
  return `${count} ${options?.align ? noun.padEnd(width) : noun}`;
};

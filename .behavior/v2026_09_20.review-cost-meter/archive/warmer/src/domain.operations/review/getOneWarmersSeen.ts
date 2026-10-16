/**
 * .what = how many of these runs carried a warmer spend
 * .why = the one input the warmer caveat needs, and the one that decides
 *        whether that caveat speaks at all. `asWarmerCaveat` owns the words;
 *        this owns the count, so one author per half rather than two copies
 *        of a decision (rule.require.single-source-of-truth-for-render)
 *
 * .note = a count, never the summed spend — a sum of the pokes at one
 *         breadth while another names them would make one figure mean two
 *         things across the `of` axis (`F7`, `F8`). the caveat names the
 *         gap; it does not half-close it
 *
 * .note = counts the runs whose warmer wrote a ledger, never the runs a
 *         warmer helped — a warmer that deferred every round spends `$0` and
 *         still counts, since the caveat's claim is "this total excludes a
 *         spender that was present"
 *
 * .note = the field is `object | null`, never `unknown`: an absent field
 *         (`undefined`) would pass `!== null` and count as seen, so the type
 *         refuses it at compile time rather than let absent and null blur
 */
export const getOneWarmersSeen = (input: {
  runs: Array<{ warmer: object | null }>;
}): number => input.runs.filter((run) => run.warmer !== null).length;

/**
 * .what = renders a figure already in percent units (0–100) to one decimal, `62.5%`
 * .why = the one home of the percent format. the pre-run metrics block, the 60% warn,
 *        the overflow refusal, the overflow error, and every rate (`asRateHuman`) render
 *        through it, so a precision or separator change lands once and two surfaces a
 *        driver reads minutes apart cannot drift to two vocabularies for one figure
 *        (`rule.require.single-source-of-truth-for-render`)
 *
 * .note = it takes PERCENT units, never a 0–1 rate: a percent site that divided by 100
 *         only for a rate render to multiply back would round through float error at a
 *         `.x5` edge, so a rate scales itself and calls here
 */
export const asPercentHuman = (input: { of: number }): string =>
  `${input.of.toFixed(1)}%`;

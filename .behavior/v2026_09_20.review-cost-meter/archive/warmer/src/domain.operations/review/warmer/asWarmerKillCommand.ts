/**
 * .what = the kill command for a live warmer, or null where its pid is unknown
 * .why = the one home of the unknown-pid law. `0` is what a `??` default would
 *        produce, and `kill 0` signals the caller's entire process group — so no
 *        surface may offer a kill without a known pid. a pid of 0 or below, or one
 *        that is no integer, is no known pid either: `kill -1` signals every process
 *        the caller may reach. the stop line and the re-plan line both read this, so
 *        the law cannot drift between them
 *        (rule.require.single-source-of-truth-for-render, rule.require.safe-by-default)
 */
export const asWarmerKillCommand = (input: {
  pid: number | null;
}): string | null =>
  input.pid === null || !Number.isInteger(input.pid) || input.pid <= 0
    ? null
    : `kill ${input.pid}`;

/**
 * .what = the most renders one write makes before it leaves the latest render on disk
 * .why = a route under constant write could otherwise re-render forever; each later writer
 *        re-renders on its own, so a bound here loses no state
 */
export const ATTEMPTS_OF_SETTLE = 3;

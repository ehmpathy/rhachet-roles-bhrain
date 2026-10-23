/**
 * .what = the head of a `route.stone.set` command, up to and with its `--stone` flag
 * .why = every taught stance and absorb command opens with this head, so it is composed here,
 *        once, and a surface that wraps it across lines splits after it
 */
export const asRouteStoneSetCommandHead = (input: { stone: string }): string =>
  `rhx route.stone.set --stone ${input.stone}`;

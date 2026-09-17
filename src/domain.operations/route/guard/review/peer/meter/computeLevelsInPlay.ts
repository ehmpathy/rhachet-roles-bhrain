import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';

/**
 * .what = the distinct ladder levels the live meters sit at, in ascendant order
 * .why = a `--level` that names a level no lane sits at is a caller fault, and the error must
 *        name the levels that ARE in play (rule.require.errors-name-the-fix). the route
 *        orchestrator had built that set inline with `[...new Set(meters.map(m => m.level))].sort(...)`
 *        — a fold a reader must simulate (rule.forbid.inline-decode-friction). one named
 *        transformer, so the orchestrator reads as "the levels in play".
 */
export const computeLevelsInPlay = (input: {
  meters: GuardPeerMeterStatus[];
}): number[] =>
  [...new Set(input.meters.map((meter) => meter.level))].sort((a, b) => a - b);

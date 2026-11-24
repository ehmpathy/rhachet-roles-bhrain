import type { ConcessionExhaustionKind } from '../guard/review/peer/getStoneConcededLaneSlugs';

/**
 * .what = whether an exhausted stone blocks the session's stop, by its concession kind
 * .why = a stop the driver could have avoided ends the session over a command it holds, and a
 *        human must restart it — the round trip `rule.always.spend-own-levers-before-escalation`
 *        exists to prevent. so the stop is blocked exactly where the next act is the driver's:
 *        - `better` — the driver owes the fix it named
 *        - `urgent` — the driver grants its own round (`--peer` per urgent lane) and writes its
 *          human why. at exhaustion every urgent lane is dry and the concession is live, so the
 *          grant gate admits it: the block can never strand a driver with no legal move
 *        - `none` — a lane the driver never conceded awaits a reviewer's or a human's word, so
 *          the stop is allowed
 */
export const isRouteDriveExhaustionStopBlocked = (input: {
  concession: ConcessionExhaustionKind;
}): boolean => input.concession !== 'none';

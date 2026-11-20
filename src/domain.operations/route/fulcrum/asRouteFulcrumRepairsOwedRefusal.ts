import { asRouteStoneSetCommandHead } from '../guard/review/peer/asRouteStoneSetCommandHead';

/**
 * .what = the passage refusal for a conceded repair no approval has followed
 * .why = both passage gates (the gated stone and the gateless last stone) refuse the same way:
 *        the driver lands the repair, then a human approves the stone, then the driver passes it
 */
export const asRouteFulcrumRepairsOwedRefusal = (input: {
  stone: string;
}): { headline: string; closer: string; commandsAfter: string[] } => ({
  headline: `route.stone.set --as passed: refused, a conceded repair awaits a human approval after it`,
  closer:
    'the driver lands each repair in the current diff, then asks the human to approve',
  commandsAfter: [
    `${asRouteStoneSetCommandHead({ stone: input.stone })} --as approved`,
    `${asRouteStoneSetCommandHead({ stone: input.stone })} --as passed`,
  ],
});

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { assertRouteGatedStoneDisputesRuled } from '../fulcrum/assertRouteGatedStoneDisputesRuled';
import { assertRouteGatelessLastStoneDisputesRuled } from '../fulcrum/assertRouteGatelessLastStoneDisputesRuled';
import { setPassageReport } from '../passage/setPassageReport';

/**
 * .what = marks a stone as passed via passage report
 * .why = enables route progress to be persisted in passage.jsonl
 *
 * .note = the one writer of `status: 'passed'`, so the dispute gates sit HERE: no passage branch
 *         of the caller, current or added later, can write a pass a dispute should hold. a dispute
 *         that owes the human refuses the last stone of a gateless route, and any stone with its
 *         own human gate (a dispute raised after the human approved)
 */
export const setStonePassage = async (input: {
  stone: RouteStone;
  stones: RouteStone[];
  route: string;
}): Promise<{ path: string }> => {
  // refuse a pass a dispute holds
  await assertRouteGatelessLastStoneDisputesRuled({
    route: input.route,
    stone: input.stone,
    stones: input.stones,
  });
  await assertRouteGatedStoneDisputesRuled({
    route: input.route,
    stone: input.stone,
  });

  // record the pass
  const report = new PassageReport({
    stone: input.stone.name,
    status: 'passed',
  });
  return setPassageReport({ report, route: input.route });
};

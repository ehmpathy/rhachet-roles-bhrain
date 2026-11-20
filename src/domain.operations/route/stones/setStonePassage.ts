import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { assertRouteGatelessLastStoneDisputesRuled } from '../fulcrum/assertRouteGatelessLastStoneDisputesRuled';
import { setPassageReport } from '../passage/setPassageReport';

/**
 * .what = marks a stone as passed via passage report
 * .why = enables route progress to be persisted in passage.jsonl
 *
 * .note = the one writer of `status: 'passed'`, so the gateless-last-stone dispute gate sits
 *         HERE: no passage branch of the caller, current or added later, can write that pass
 *         while a dispute owes the human. a human-gated stone needs no gate here: its `approved?`
 *         judge reads an approval that a later dispute or an owed repair holds out of force
 *         (`isStoneApprovalInForce`), so it halts as a recorded blocker the human reads
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

  // record the pass
  const report = new PassageReport({
    stone: input.stone.name,
    status: 'passed',
  });
  return setPassageReport({ report, route: input.route });
};

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { asJudgeMechanism } from '../judges/asJudgeMechanism';

/**
 * .what = decides whether a stone's guard carries an `approved?` judge — a human gate
 * .why = only a human gate on the stone itself can show a dispute before that stone passes;
 *        the gateless-last-stone gate and the gated-stone gate both part on it
 */
export const isStoneGatedByHuman = (input: { stone: RouteStone }): boolean =>
  (input.stone.guard?.judges ?? []).some(
    (judge) => asJudgeMechanism({ judge }) === 'approved?',
  );

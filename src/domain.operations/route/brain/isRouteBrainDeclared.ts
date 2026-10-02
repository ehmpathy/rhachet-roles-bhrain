import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { isStoneBrainDeclared } from './isStoneBrainDeclared';

/**
 * .what = does ANY stone on this route snapshot declare a brain?
 * .why = it parts case=10 from case=7: both present a stone that declares no brain, yet
 *        case=10 (`absent-from-launch`) owes silence and case=7 (`absent-after-switch`)
 *        owes an attribution line. only the ROUTE tells them apart
 *
 * .note = the caller computes it once over a snapshot it already holds, so it costs no
 *         I/O — per stone inside `applyStoneBrainOnEntry` it would re-walk every guard
 */
export const isRouteBrainDeclared = (input: {
  stones: RouteStone[];
}): boolean => input.stones.some((stone) => isStoneBrainDeclared(stone.guard));

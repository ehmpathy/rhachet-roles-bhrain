import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllPassageReports } from '../passage/getAllPassageReports';

/**
 * .what = retrieves the set of review levels that have ALREADY POURED for a stone
 * .why = level unlock is a LATCH. once a level has begun to run it keeps its door
 *        open, so a later regression at a LOWER level can never shut it again
 *        (define.invariant.review.peer.level-unlock-is-a-latch).
 *
 * 🔴 .why a latch is owed = `terminal` is recomputed every pass, never stored. so a
 *    lower level that reads terminal on one pass can read NON-terminal on the next,
 *    and with no latch the level above it is re-gated mid-conversation:
 *
 *    | pass | l1 | l3 |
 *    |------|----|----|
 *    | n    | malfunction (terminal)        | pours ✅ |
 *    | n+1  | repaired, now rejects         | 🔴 re-gated, absent a latch |
 *
 *    the n+1 row is the defect: l3 already spoke, the driver is mid-conversation with
 *    it, and a repair at l1 silently withdraws the lane. the latch makes n+1 impossible.
 *
 * .note = a malfunction spends NO round (`reviewCompleted` excludes it), so it can
 *         never exhaust its way into the budget-locked skip. the latch is therefore
 *         the only mechanism that holds l3 open across that repair.
 *
 * .note = delegates to getAllPassageReports, which handles cross-stone invalidation:
 *         a rewind of stone M clears pours for stones >= M. that is the ONE lever
 *         that resets the latch, and it is the same lever that resets an overrule.
 */
export const getStoneGuardLevelsPoured = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<Set<number>> => {
  // get passage reports with cross-stone invalidation applied
  const reports = await getAllPassageReports({ route: input.route });

  // collect pours for this stone
  // .note = a 'poured' row always carries a level — it is minted by the pour itself,
  //         which knows its level by construction. a row without one is unreadable
  //         rather than stone-wide, so it is dropped rather than widened
  const levels = new Set(
    reports
      .filter((r) => r.stone === input.stone.name && r.status === 'poured')
      .map((r) => r.level)
      .filter((level): level is number => level !== undefined),
  );

  return levels;
};

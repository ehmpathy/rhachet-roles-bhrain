import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { genRouteGuardExhaustedReason } from '../guard/review/peer/genRouteGuardExhaustedReason';
import { getStoneConcessionExhaustionKind } from '../guard/review/peer/getStoneConcededLaneSlugs';
import { formatRouteDriveBudgetExhausted } from './formatRouteDriveBudgetExhausted';
import { getCurrentExhaustedSlugs } from './getCurrentExhaustedSlugs';

/**
 * .what = renders the onStop/onBoot/direct message for an exhausted STATUS, AND the stop
 *         disposition that message implies — `{ stdout, blocksStop }`, the sibling shape
 *         of `getRouteDriveBlockerMessage`.
 * .why = an exhausted status (its own passage status, not a 'review.peer.exhausted'
 *        blocker) still needs the same prompt the legacy blocker showed. onBoot, onStop,
 *        and direct all call this when the latest passage for the current stone is
 *        'exhausted'.
 *
 * 🔴 the DECISION (block the stop, or allow it) and the RENDER (the message) now stand on
 *    the SAME live read of the concession kind. previously onStop decided blocksStop from
 *    the STALE persisted `reason` while this operation recomputed the message LIVE — so a
 *    single call could exit 2 ("top up, driver-fixable") while printing "wait on a human"
 *    once the budget had been topped up since the halt. one read, one truth (B1 fix,
 *    rule.require.single-source-of-truth-for-render).
 *
 * 🔴 it recomputes the reason LIVE rather than replay the persisted one, and the
 *    concession mark is recomputed with it. the slugs are already live because budget
 *    may have been extended since the halt; a stance is volatile for the same reason —
 *    the driver may have conceded, or the lane may have spoken again and lapsed the
 *    stance — so a replayed mark would render a concession halt that no longer holds
 *    (S12, and the same live-recompute contract `getRouteDriveBlockerMessage` states for
 *    every volatile blocker).
 *
 * ⚠️ the concession is asked of EVERY currently-exhausted lane, never any. one lane the
 *    driver never conceded still awaits a human, so the concession words must not fire.
 *
 * .note = `blocksStop` is true ONLY for a `better` concession — the driver's own lever
 *         (`--add N --peer`). `none` (a lane never conceded) and `urgent` (a warned human
 *         wait) are a human's to end, so they allow the stop; a stale halt (no lane
 *         exhausted now) blocks no stop either.
 */
export const getRouteDriveExhaustedMessage = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{ stdout: string; blocksStop: boolean }> => {
  // recompute the currently exhausted reviewer slugs + meters for the tree
  const { exhaustedSlugs, meters } = await getCurrentExhaustedSlugs({
    stone: input.stone,
    route: input.route,
  });

  // no lane is exhausted right now → the halt is stale; keep the extant null-reason shape.
  // a stale halt blocks no stop — no lever is owed here, so allow it (blocksStop false).
  if (exhaustedSlugs.length === 0)
    return {
      stdout: formatRouteDriveBudgetExhausted({
        route: input.route,
        stone: input.stone.name,
        reason: null,
        meters,
      }),
      blocksStop: false,
    };

  const concession = await getStoneConcessionExhaustionKind({
    route: input.route,
    stone: input.stone.name,
    slugs: exhaustedSlugs,
  });

  return {
    stdout: formatRouteDriveBudgetExhausted({
      route: input.route,
      stone: input.stone.name,
      reason: genRouteGuardExhaustedReason({
        slugs: exhaustedSlugs,
        concession,
      }),
      meters,
    }),
    // 🔴 the same live `concession` that shaped the message decides the stop: a `better`
    //    concession is the driver's own lever (block the stop, code 2), while `none`/`urgent`
    //    await a human (allow the stop). decision and render can no longer disagree.
    blocksStop: concession === 'better',
  };
};

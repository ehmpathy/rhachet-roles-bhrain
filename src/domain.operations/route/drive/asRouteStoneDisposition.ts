import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStoneDisposition } from '@src/domain.objects/Driver/RouteStoneDisposition';
import type { RouteStoneGuardBlockerType } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { isRouteGuardConcessionExhaustion } from '../guard/review/peer/genRouteGuardExhaustedReason';

/**
 * .what = derives a stone's disposition (push | halt) from its latest passage state
 * .why = the single source both the onStop hook and the statusline read, so the route's
 *        self-drive behavior and the pinned emoji derive from one truth — no `blocked`
 *        overload inferred twice, no divergence
 *
 * .note = 'push' = the route self-drives (agent-fixable, or no block stands). 'halt' = the
 *         route stopped and a human is needed; the `why` names which help (see RouteStoneDisposition).
 */
export const asRouteStoneDisposition = (input: {
  status: PassageReport['status'] | null;
  blocker: RouteStoneGuardBlockerType | null;
  /**
   * the passage's reason — read ONLY to tell a concession exhaustion from a human one
   *
   * 🔴 .note = REQUIRED, and that is a repair rather than a preference. it was drafted
   *         optional for the asymmetry — a caller that omits it gets the human-wait
   *         answer, and a missed concession costs one human round where a falsely
   *         claimed one strands the stone with no human named. but the optionality let
   *         FOUR of five call sites compile green while they passed no reason at all,
   *         so the concession was invisible everywhere but the site edited beside it.
   *         required keeps the asymmetry — a caller with no reason passes `null` — and
   *         makes the compiler name every site that must choose.
   */
  reason: string | null;
}): RouteStoneDisposition => {
  // a malfunction is a hard stop — a reviewer or judge broke; a human must fix it
  if (input.status === 'malfunction') return { of: 'halt', why: 'malfunction' };

  if (input.status === 'exhausted') {
    // 🔴 a CONCESSION exhaustion is the driver's own (S12). every skipped lane carries a
    //    live concession, so the remedy is a budget top-up scoped to those lanes — and
    //    `rule.always.spend-own-levers-before-escalation` files that lever under the
    //    driver. this op's axis is "does a HUMAN need to act?", and here none does, so
    //    the honest answer is `push` rather than a halt with a friendlier word.
    //
    // ⚠️ the fact rides in the REASON because this op must stay pure and sync: the
    //    statusline calls it on a ~300ms debounce and could not afford a route read.
    //    `reason` is required (see the param note): a caller with no reason passes
    //    `null` and gets the extant human-wait answer, the safe default — a missed
    //    concession costs a driver one human round; a falsely claimed one strands
    //    the stone.
    if (isRouteGuardConcessionExhaustion({ reason: input.reason }))
      return { of: 'push' };

    // an exhausted peer budget waits on a human to approve or extend
    return { of: 'halt', why: 'exhausted' };
  }

  // a blocked passage splits by its blocker: approval-wait, wall, exhausted, or agent-fixable
  if (input.status === 'blocked')
    return asBlockedDisposition({ blocker: input.blocker });

  // any other status → the route self-drives:
  // - passed / approved / rewound / overruled / none
  // - arrived / promised / absorbed: forward-motion review markers (the machine's own
  //   review work), which supersede a prior halt (rule.require.forward-motion-clears-blocker)
  return { of: 'push' };
};

/**
 * .what = maps a blocked passage's blocker to its disposition
 * .why = a blocked status carries different meanings per blocker: an approval-wait (halt),
 *        a driver wall (halt), an exhausted budget (halt), or an agent-fixable review (push)
 *
 * .note = 'review.peer.exhausted' is handled here for the legacy blocker form; the current
 *         write-path records exhausted as its own `status`, caught before this op is reached.
 */
const asBlockedDisposition = (input: {
  blocker: RouteStoneGuardBlockerType | null;
}): RouteStoneDisposition => {
  // no blocker = a driver-initiated wall (--as blocked); a human must clear it
  if (!input.blocker) return { of: 'halt', why: 'blocked' };

  // an approval judge waits on a human to sign
  if (input.blocker === 'approval') return { of: 'halt', why: 'approval' };

  // a legacy exhausted blocker waits on a human to approve or extend
  if (input.blocker === 'review.peer.exhausted')
    return { of: 'halt', why: 'exhausted' };

  // every other blocker (review.self, review.peer, feedbackUnabsorbed, undeclared,
  // non-approval judge) is agent-fixable — the route keeps its own momentum
  //
  // 🔴 'review.peer.undeclared' belongs here BY DECISION, never by fallthrough. this
  //    op's axis is "does a HUMAN need to act?", and a stance is the driver's own
  //    lever: `--as disputed` and `--as conceded` are both theirs to run. so the
  //    route self-drives to the stance halt and the driver clears it.
  return { of: 'push' };
};

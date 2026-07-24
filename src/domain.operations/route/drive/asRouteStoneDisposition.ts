import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStoneDisposition } from '@src/domain.objects/Driver/RouteStoneDisposition';
import type { RouteStoneGuardBlockerType } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

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
}): RouteStoneDisposition => {
  // a malfunction is a hard stop — a reviewer or judge broke; a human must fix it
  if (input.status === 'malfunction') return { of: 'halt', why: 'malfunction' };

  // an exhausted peer budget waits on a human to approve or extend
  if (input.status === 'exhausted') return { of: 'halt', why: 'exhausted' };

  // a blocked passage splits by its blocker: approval-wait, wall, exhausted, or agent-fixable
  if (input.status === 'blocked')
    return asBlockedDisposition({ blocker: input.blocker });

  // any other status → the route self-drives:
  // - passed / approved / rewound / overruled / none
  // - arrived / promised / contemplated: forward-motion review markers (the machine's own
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

  // every other blocker (review.self, review.peer, uncontemplated, non-approval judge) is
  // agent-fixable — the route keeps its own momentum
  return { of: 'push' };
};

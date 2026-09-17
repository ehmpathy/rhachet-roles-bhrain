import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStoneDisposition } from '@src/domain.objects/Driver/RouteStoneDisposition';
import type { RouteStoneGuardBlockerType } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { asRouteStoneDisposition } from './asRouteStoneDisposition';

/**
 * .what = unit cases for asRouteStoneDisposition — every (status, blocker) → disposition
 * .why = this op is the single source both the onStop hook and the statusline read, so its
 *        push/halt verdict must be pinned for every passage state
 */
const TEST_CASES: {
  description: string;
  given: {
    status: PassageReport['status'] | null;
    blocker: RouteStoneGuardBlockerType | null;
    reason?: string | null;
  };
  expect: RouteStoneDisposition;
}[] = [
  // halts — the route stopped, a human is needed
  {
    description: 'malfunction status → halt(malfunction)',
    given: { status: 'malfunction', blocker: null },
    expect: { of: 'halt', why: 'malfunction' },
  },
  {
    description: 'exhausted status → halt(exhausted)',
    given: { status: 'exhausted', blocker: null },
    expect: { of: 'halt', why: 'exhausted' },
  },
  {
    // S12 — the reason is the only channel; an ordinary exhausted reason must not flip it
    description: 'exhausted + an ordinary budget reason → halt(exhausted)',
    given: {
      status: 'exhausted',
      blocker: null,
      reason: 'peer reviewer budget exhausted: mech',
    },
    expect: { of: 'halt', why: 'exhausted' },
  },
  {
    // absence is not a claim — a caller that omits the reason gets the safe default
    description: 'exhausted + a null reason → halt(exhausted)',
    given: { status: 'exhausted', blocker: null, reason: null },
    expect: { of: 'halt', why: 'exhausted' },
  },
  {
    // 🔴 S12 — every skipped lane conceded, so the top-up is the driver's own lever and
    //    no human is owed. this op's axis is "does a HUMAN need to act?", so `push`
    description:
      'exhausted + a CONCESSION reason → push (the driver owns the remedy)',
    given: {
      status: 'exhausted',
      blocker: null,
      reason:
        'concessions await the round that confirms them; peer reviewer budget exhausted: mech',
    },
    expect: { of: 'push' },
  },
  {
    // a malfunction outranks a concession — a broken reviewer needs a human regardless
    description: 'malfunction + a CONCESSION reason → halt(malfunction)',
    given: {
      status: 'malfunction',
      blocker: null,
      reason:
        'reviewer or judge malfunctioned; concessions await the round that confirms them; peer reviewer budget exhausted: mech',
    },
    expect: { of: 'halt', why: 'malfunction' },
  },
  {
    description: 'blocked + no blocker (driver wall) → halt(blocked)',
    given: { status: 'blocked', blocker: null },
    expect: { of: 'halt', why: 'blocked' },
  },
  {
    description: 'blocked + approval → halt(approval)',
    given: { status: 'blocked', blocker: 'approval' },
    expect: { of: 'halt', why: 'approval' },
  },
  {
    description: 'blocked + review.peer.exhausted (legacy) → halt(exhausted)',
    given: { status: 'blocked', blocker: 'review.peer.exhausted' },
    expect: { of: 'halt', why: 'exhausted' },
  },

  // pushes — the route self-drives (agent-fixable, or no block stands)
  {
    description: 'blocked + review.self → push',
    given: { status: 'blocked', blocker: 'review.self' },
    expect: { of: 'push' },
  },
  {
    description: 'blocked + review.peer → push',
    given: { status: 'blocked', blocker: 'review.peer' },
    expect: { of: 'push' },
  },
  {
    description: 'blocked + review.peer.unabsorbed → push',
    given: { status: 'blocked', blocker: 'review.peer.unabsorbed' },
    expect: { of: 'push' },
  },
  {
    description: 'blocked + judge (non-approval) → push',
    given: { status: 'blocked', blocker: 'judge' },
    expect: { of: 'push' },
  },
  {
    description: 'passed → push',
    given: { status: 'passed', blocker: null },
    expect: { of: 'push' },
  },
  {
    description: 'approved → push',
    given: { status: 'approved', blocker: null },
    expect: { of: 'push' },
  },
  {
    description: 'promised → push (forward motion clears any prior blocker)',
    given: { status: 'promised', blocker: null },
    expect: { of: 'push' },
  },
  {
    description: 'absorbed → push (forward motion clears any prior blocker)',
    given: { status: 'absorbed', blocker: null },
    expect: { of: 'push' },
  },
  {
    description:
      'arrived → push (guard-entry marker clears any prior blocker inflight)',
    given: { status: 'arrived', blocker: null },
    expect: { of: 'push' },
  },
  {
    description: 'rewound → push',
    given: { status: 'rewound', blocker: null },
    expect: { of: 'push' },
  },
  {
    description: 'overruled → push',
    given: { status: 'overruled', blocker: null },
    expect: { of: 'push' },
  },
  {
    description: 'no passage yet (null) → push',
    given: { status: null, blocker: null },
    expect: { of: 'push' },
  },
];

describe('asRouteStoneDisposition', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const disposition = asRouteStoneDisposition({
        status: thisCase.given.status,
        blocker: thisCase.given.blocker,
        // the fixture omits `reason` where the case does not turn on it; the op's input
        // is REQUIRED, so the absence is made explicit here rather than inferred there
        reason: thisCase.given.reason ?? null,
      });
      expect(disposition).toEqual(thisCase.expect);
    }),
  );
});

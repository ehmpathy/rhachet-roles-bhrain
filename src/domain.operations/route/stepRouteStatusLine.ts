import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneDisposition } from '@src/domain.objects/Driver/RouteStoneDisposition';
import {
  getGuardPeerReviews,
  getGuardSelfReviews,
  type RouteStoneGuardReviewPeer,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import type { RouteStoneGuardBlockerType } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';
import type { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { asRouteStoneDisposition } from './drive/asRouteStoneDisposition';
import { getAllRouteStoneGuardReviewPeerMeters } from './guard/review/peer/meter/getAllRouteStoneGuardReviewPeerMeters';
import { LEVEL_OF_UNMAPPED_REVIEW } from './guard/review/peer/meter/getOneReviewLevelByIndex';
import { computePromisedReviewCount } from './guard/review/self/computePromisedReviewCount';
import { getStonePromises } from './guard/review/self/getStonePromises';
import { isExpectedFsReadFault } from './isExpectedFsReadFault';
import { getLatestPassageForStone } from './passage/getLatestPassageForStone';
import { asStatusLine, type StatusLinePhase } from './statusLine/asStatusLine';
import { asStatusLineDegradeRow } from './statusLine/asStatusLineDegradeRow';
import { computeNextStones } from './stones/computeNextStones';
import { getAllStoneDriveArtifacts } from './stones/getAllStoneDriveArtifacts';
import { getAllStones } from './stones/getAllStones';

/**
 * .what = computes the claude code status line for the bound route's current stone
 * .why = powers the pinned `🗿 <stone>, <phase>[, <halt-word>] <emoji>` line, so observers
 *        glance at both the step and how far into it the driver is — and whether attention
 *        is needed (the emoji derives from the disposition, the same push/halt onStop reads)
 *
 * .note = the claude code harness fires this often (debounced ~300ms). an absent route or a
 *         route with no stones yields an empty line; a bound route whose stones all passed
 *         yields '🗿 route complete 🌴🤙'.
 *
 * .note = `route` is the route to render; the bind lookup lives in the one caller that needs
 *         it, `stepRouteStatusLineCached`, which renders the blank line for an unbound seat
 *
 * .note = `degradeRow` is the stderr row when the phase derivation faulted and the line fell
 *         back to the plain stone, else null. it is data, never printed here: the cli entry is
 *         the one writer of stderr, and the cache stores the row so a hit replays it whole
 *
 * .note = `stone` and `phase` name the parts the line shows, for the status file a writer
 *         keeps beside the route: the stone name and the phase location (`yield`,
 *         `review.self`, `review.peer`, `judge`). each is null where the line shows none
 */
export const stepRouteStatusLine = async (input: {
  route: string;
}): Promise<{
  line: string;
  degradeRow: string | null;
  stone: string | null;
  phase: StatusLinePhase['of'] | null;
}> => {
  // derive the route's status-line state, then render it
  const { state, degradeRow } = await getRouteStatusLineState({
    route: input.route,
  });
  return {
    line: asStatusLine(state),
    degradeRow,
    ...asStatusLineParts({ state }),
  };
};

/**
 * .what = the stone name and phase location a state shows, each null where it shows none
 * .why = the status file names the parts of its line; this reads them off the state union
 */
const asStatusLineParts = (input: {
  state: RouteStatusLineState;
}): { stone: string | null; phase: StatusLinePhase['of'] | null } => {
  if (input.state.kind !== 'stone') return { stone: null, phase: null };
  return { stone: input.state.stone, phase: input.state.phase?.of ?? null };
};

/**
 * .what = the status-line render state for a route
 */
type RouteStatusLineState =
  | { kind: 'blank' }
  | {
      kind: 'stone';
      stone: string;
      phase: StatusLinePhase | null;
      disposition: RouteStoneDisposition;
    }
  | { kind: 'complete' };

/**
 * .what = derives the status-line render state for a route, plus the degrade row if any
 * .why = isolates the lookup so the orchestrator reads as narrative
 *
 * .note = the fault contract is split by concern (see the vision's edge-case table):
 *         - the STONE lookup (stones, next-stone) is STRICT: a fault propagates, the
 *           cli exits non-zero, the harness blanks the line. this is the base line; if we
 *           cannot even name the stone, an empty line is correct.
 *         - the PHASE derivation is BEST-EFFORT: a fault there yields a degrade row and a
 *           null phase (the plain '🗿 <stone>' line), so a failure in the enhancement never
 *           regresses the base feature to a blank line.
 *         - the PASSAGE read that feeds the disposition is STRICT, like the stone lookup: the
 *           next-stone computation reads the same passage.jsonl first
 *           (`getAllStoneDriveArtifacts`), so a corrupt passage faults there and blanks the
 *           line by design. the next stone itself rests on that passage, so no line could
 *           name it. the disposition is always derived, even when the phase degrades.
 *
 * .note = the latest passage is read in raw file order (`getLatestPassageForStone`), never
 *         via `getAllPassageReports`, whose sticky re-bucket would surface a stale 'blocked'
 *         after a human 'approved' (the approve-then-wait window)
 *
 * .note = the passage reason rides into the disposition, so a CONCESSION exhaustion reads as
 *         `push` here, as the onStop hook reads it. without it the line would pin 👋 while
 *         the hook tells the driver to top up their own budget: two reads of one state
 *         (`rule.require.single-source-of-truth-for-render`). it costs no extra read
 */
const getRouteStatusLineState = async (input: {
  route: string;
}): Promise<{ state: RouteStatusLineState; degradeRow: string | null }> => {
  const route = input.route;

  // a route with no stones has no step to show (not complete — no stone was passed)
  const stones = await getAllStones({ route });
  if (stones.length === 0)
    return { state: { kind: 'blank' }, degradeRow: null };

  // compute the current (first incomplete) stone
  const artifacts = await getAllStoneDriveArtifacts({ route });
  const nextStones = computeNextStones({
    stones,
    artifacts,
    query: '@next-one',
  });

  // no incomplete stone remains → the route's stones all passed → complete
  const stoneFirst = asFirstStoneOrNull({ stones: nextStones });
  if (!stoneFirst) return { state: { kind: 'complete' }, degradeRow: null };

  // read the latest passage for this stone: it drives the disposition and the blocker phase
  const latest = await getLatestPassageForStone({
    stone: stoneFirst.name,
    route,
  });

  // disposition (push | halt): the one value the onStop hook also reads
  const disposition = asRouteStoneDisposition({
    status: latest?.status ?? null,
    blocker: latest?.blocker ?? null,
    reason: latest?.reason ?? null,
  });

  // phase (where the work is): best-effort — a benign read fault degrades to the plain stone
  const { phase, degradeRow } = await getStonePhaseBestEffort({
    stone: stoneFirst,
    route,
    latest,
  });

  return {
    state: { kind: 'stone', stone: stoneFirst.name, phase, disposition },
    degradeRow,
  };
};

/**
 * .what = derives the current stone's phase, degraded to null on a benign route-state fault
 * .why = the phase is an enhancement on top of the stone name; a benign read fault (corrupt
 *        jsonl, unreadable file) must surface (a degrade row for stderr) but must NOT blank
 *        the base line — so it degrades to null (the plain '🗿 <stone>' line).
 *
 * .note = this is NOT failhide: the catch ALLOWLISTS only expected route-state read faults
 *         (`isExpectedRouteStateFault`) and RETHROWS any other error (a genuine bug), so an
 *         unexpected error still fails loud via the strict exit path.
 */
const getStonePhaseBestEffort = async (input: {
  stone: RouteStone;
  route: string;
  latest: PassageReport | null;
}): Promise<{ phase: StatusLinePhase | null; degradeRow: string | null }> => {
  try {
    return { phase: await getStonePhase(input), degradeRow: null };
  } catch (error) {
    // a genuine (unexpected) fault must surface, not degrade — rethrow it (failfast)
    if (!isExpectedRouteStateFault(error)) throw error;

    // a benign route-state read fault → a degrade row, and the plain stone line
    return {
      phase: null,
      degradeRow: asStatusLineDegradeRow({ stone: input.stone.name, error }),
    };
  }
};

/**
 * .what = whether an error is a benign route-state read fault (corrupt jsonl / unreadable file)
 * .why = the phase degrade covers ONLY unreadable route state; a genuine bug must rethrow so it
 *        surfaces loud (rule.forbid.failhide: allowlist the expected, surface the rest)
 *
 * .note = the two expected classes: a malformed jsonl line makes `JSON.parse` throw a
 *         `SyntaxError`; a filesystem read fault holds a KNOWN fs `code` (isExpectedFsReadFault).
 *         any other error — a custom `code`, a type error, a null deref, a domain bug — is
 *         unexpected and rethrown, so a real defect never hides behind a benign degrade.
 */
const isExpectedRouteStateFault = (error: unknown): boolean => {
  // a corrupt jsonl line → JSON.parse throws a SyntaxError
  if (error instanceof SyntaxError) return true;

  // a filesystem read fault → an Error that holds one of the KNOWN fs codes (not any code)
  return isExpectedFsReadFault({ error });
};

/**
 * .what = derives WHERE the work is on the current stone (the phase location)
 * .why = phase is pure context (yield → review.self → review.peer → judge); the WHETHER
 *        (push | halt) is the orthogonal disposition, derived separately from the passage
 *
 * .note = a guard blocker names the phase it stopped at (review.self → self, review.peer* →
 *         peer, judge/approval → judge). with no guard blocker (a driver wall, an exhausted
 *         or malfunction status, or no passage), the phase comes from the active review state.
 */
const getStonePhase = async (input: {
  stone: RouteStone;
  route: string;
  latest: PassageReport | null;
}): Promise<StatusLinePhase> => {
  // a guard blocker names the phase location it stopped at
  if (input.latest?.blocker)
    return await getPhaseFromBlocker({
      blocker: input.latest.blocker,
      stone: input.stone,
      route: input.route,
    });

  // no guard blocker → the phase the work is actively in
  return await getPhaseFromReviewState(input);
};

/**
 * .what = maps a guard blocker to the phase LOCATION it stopped at (no attention marker)
 * .why = the blocker names where the work got to; the attention (push | halt) is the
 *        disposition's job, derived separately — so this returns pure phase context
 */
const getPhaseFromBlocker = async (input: {
  blocker: RouteStoneGuardBlockerType;
  stone: RouteStone;
  route: string;
}): Promise<StatusLinePhase> => {
  // the review the blocker stopped in, by the exhaustive map
  const review = REVIEW_OF_BLOCKER[input.blocker];

  // self-review blocker → the self-review phase with its r{done}/{total} counter
  if (review === 'self')
    return asSelfPhase({
      stone: input.stone,
      promises: await getStonePromises(input),
    });

  // peer-review blocker → the peer depth l{level}@i{rounds}
  if (review === 'peer')
    return asPeerPhase({
      stone: input.stone,
      meters: await getAllRouteStoneGuardReviewPeerMeters({
        route: input.route,
        stone: input.stone.name,
      }),
    });

  // a judge or approval blocker → the judge phase
  return { of: 'judge' };
};

/**
 * .what = the review each guard blocker stopped in
 * .why = a Record over the closed blocker union, so a new blocker kind fails the compile
 *        here until it is placed, never falls through to `judge` unseen
 *
 * .note = 'review.peer.undeclared' maps to peer, never judge: the stance gate fires BEFORE
 *         the hash and before any judge runs, so a judge phase would name a place the work
 *         never reached
 */
const REVIEW_OF_BLOCKER: Record<
  RouteStoneGuardBlockerType,
  'self' | 'peer' | 'judge'
> = {
  'review.self': 'self',
  'review.peer': 'peer',
  'review.peer.exhausted': 'peer',
  'review.peer.unabsorbed': 'peer',
  'review.peer.undeclared': 'peer',
  'review.peer.malpartitioned': 'peer',
  'review.peer.constraint': 'peer',
  judge: 'judge',
  approval: 'judge',
};

/**
 * .what = derives the phase the work is actively in when no guard blocker names it
 * .why = between passage attempts (or on a driver wall / exhausted / malfunction status), the
 *        "where" comes from the review state: peer under way > self under way > the stone yields
 *
 * .note = each review state is read once and handed to the phase it decides, so the "started"
 *         check and the depth it shows come from one snapshot
 */
const getPhaseFromReviewState = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<StatusLinePhase> => {
  // an unguarded stone still yields its artifact (no reviews to be in)
  if (!input.stone.guard) return { of: 'yield' };

  // peer review under way? (any reviewer has consumed a round)
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  if (isPeerReviewStarted({ meters }))
    return asPeerPhase({ stone: input.stone, meters });

  // self review under way? (any self-review promised)
  const promises = await getStonePromises(input);
  if (promises.length > 0) return asSelfPhase({ stone: input.stone, promises });

  // no review started → the stone still yields its artifact
  return { of: 'yield' };
};

/**
 * .what = whether any peer reviewer has consumed a round
 */
const isPeerReviewStarted = (input: {
  meters: RouteStoneGuardReviewPeerMeter[];
}): boolean => input.meters.some((meter) => meter.rounds > 0);

/**
 * .what = the review.self phase with its r{done}/{total} counter
 * .why = names the self-review progress from promised slugs vs the guard's self-reviews
 */
const asSelfPhase = (input: {
  stone: RouteStone;
  promises: { slug: string }[];
}): StatusLinePhase => {
  // defensive: a self-review phase without a guard cannot count — fall back to yield
  if (!input.stone.guard) return { of: 'yield' };

  const selfReviews = getGuardSelfReviews(input.stone.guard);
  const done = computePromisedReviewCount({
    selfReviews,
    promisedSlugs: asPromisedSlugs({ promises: input.promises }),
  });
  return { of: 'review.self', done, total: selfReviews.length };
};

/**
 * .what = the set of self-review slugs a stone has promised
 */
const asPromisedSlugs = (input: {
  promises: { slug: string }[];
}): Set<string> => new Set(input.promises.map((promise) => promise.slug));

/**
 * .what = the review.peer phase with its l{level}@i{rounds} depth
 * .why = names the peer-review depth from the guard's peer reviews + their round meters
 */
const asPeerPhase = (input: {
  stone: RouteStone;
  meters: RouteStoneGuardReviewPeerMeter[];
}): StatusLinePhase => {
  // defensive: a peer-review phase without a guard cannot measure — fall back to yield
  if (!input.stone.guard) return { of: 'yield' };

  const depth = asHighestStartedPeerDepth({
    peerReviews: getGuardPeerReviews(input.stone.guard),
    meters: input.meters,
  });
  return { of: 'review.peer', level: depth.level, rounds: depth.rounds };
};

/**
 * .what = finds the highest peer level a reviewer has started, + the rounds consumed there
 * .why = the wish shows `l3@i002` = highest level reached, rounds at that level; the current
 *        depth is the deepest level any reviewer has started (consumed a round)
 *
 * .note = "started" (a reviewer has consumed a round at the level), NOT "active" — the route
 *         domain reserves "active level" (`computeReviewActiveLevel`) for the LOWEST level that
 *         still blocks passage (the overrule target). this progress depth is a distinct notion:
 *         the HIGHEST level escalation has reached. the two answer different questions, so the
 *         name avoids the "active" term to prevent an overload (rule.forbid.ambiguous-labels).
 *
 * .note = before any reviewer starts, the depth is the lowest defined level, 0 rounds
 *         (peer review is about to begin at the cheapest level).
 */
const asHighestStartedPeerDepth = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
  meters: RouteStoneGuardReviewPeerMeter[];
}): { level: number; rounds: number } => {
  // map each reviewer slug to the rounds it has consumed
  const roundsBySlug = new Map(
    input.meters.map((m) => [m.reviewer.slug, m.rounds]),
  );

  // the reviewers that have started (consumed at least one round), with their level
  const started = input.peerReviews
    .map((r) => ({
      level: r.level,
      rounds: roundsBySlug.get(r.slug) ?? 0,
    }))
    .filter((r) => r.rounds > 0);

  // no reviewer has started → about to begin at the lowest level, zero rounds
  if (started.length === 0)
    return { level: asLowestPeerLevel(input.peerReviews), rounds: 0 };

  // the current depth = the highest level reached, and the rounds consumed there
  const level = Math.max(...started.map((r) => r.level));
  const rounds = Math.max(
    ...started.filter((r) => r.level === level).map((r) => r.rounds),
  );
  return { level, rounds };
};

/**
 * .what = the lowest level defined across a stone's peer reviews (default: the floor level)
 * .why = the level peer review begins at, before any reviewer has consumed a round
 *
 * .note = the default reads `LEVEL_OF_UNMAPPED_REVIEW`, the one home of the floor level, so
 *         a move of the floor moves here too (rule.require.review-standardization-at-parse)
 */
const asLowestPeerLevel = (
  peerReviews: RouteStoneGuardReviewPeer[],
): number => {
  if (peerReviews.length === 0) return LEVEL_OF_UNMAPPED_REVIEW;
  return Math.min(...peerReviews.map((r) => r.level));
};

/**
 * .what = returns the first stone of a list, or null when the list is empty
 * .why = names the positional pick so the orchestrator reads as narrative
 */
const asFirstStoneOrNull = (input: {
  stones: RouteStone[];
}): RouteStone | null => {
  return input.stones[0] ?? null;
};

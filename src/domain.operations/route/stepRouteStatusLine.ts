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

import { getRouteBind } from './bind/getRouteBind';
import { asRouteStoneDisposition } from './drive/asRouteStoneDisposition';
import { getAllRouteStoneGuardReviewPeerMeters } from './guard/review/peer/meter/getAllRouteStoneGuardReviewPeerMeters';
import { computePromisedReviewCount } from './guard/review/self/computePromisedReviewCount';
import { getStonePromises } from './guard/review/self/getStonePromises';
import { getLatestPassageForStone } from './passage/getLatestPassageForStone';
import { asStatusLine, type StatusLinePhase } from './statusLine/asStatusLine';
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
 * .note = `route` is nullable: null → look up the branch-bound route. tests pass a route
 *         directly to avoid bind conflicts (all tests share a git repo).
 */
export const stepRouteStatusLine = async (input: {
  route: string | null;
}): Promise<{ line: string }> => {
  // derive the route's status-line state, then render it
  const state = await getRouteStatusLineState({ route: input.route });
  return { line: asStatusLine(state) };
};

/**
 * .what = derives the status-line render state for a route (given or branch-bound)
 * .why = isolates the lookup so the orchestrator reads as narrative
 *
 * .note = the fault contract is split by concern (see the vision's edge-case table):
 *         - the STONE lookup (bind, stones, next-stone) is STRICT: a fault propagates, the
 *           cli exits non-zero, the harness blanks the line. this is the base line; if we
 *           cannot even name the stone, an empty line is correct.
 *         - the PHASE derivation is BEST-EFFORT: a fault there is logged to stderr and
 *           degrades to a null phase (the plain '🗿 <stone>' line), so a failure in the
 *           enhancement never regresses the base feature to a blank line.
 *         - the DISPOSITION is a cheap passage read (never the fault source); it is always
 *           derived, even when the phase degrades.
 */
const getRouteStatusLineState = async (input: {
  route: string | null;
}): Promise<
  | { kind: 'blank' }
  | {
      kind: 'stone';
      stone: string;
      phase: StatusLinePhase | null;
      disposition: RouteStoneDisposition;
    }
  | { kind: 'complete' }
> => {
  // derive the route: the one given, else the branch-bound one
  const route = input.route ?? (await getRouteBind())?.route ?? null;
  if (!route) return { kind: 'blank' };

  // a route with no stones has no step to show (not complete — no stone was passed)
  const stones = await getAllStones({ route });
  if (stones.length === 0) return { kind: 'blank' };

  // compute the current (first incomplete) stone
  const artifacts = await getAllStoneDriveArtifacts({ route });
  const nextStones = computeNextStones({
    stones,
    artifacts,
    query: '@next-one',
  });

  // no incomplete stone remains → the route's stones all passed → complete
  const stoneFirst = asFirstStoneOrNull({ stones: nextStones });
  if (!stoneFirst) return { kind: 'complete' };

  // read the latest passage for this stone (cheap) — it drives BOTH the disposition and,
  // when a guard blocker is present, the phase location
  // .note = getLatestPassageForStone reads raw file order (true chronological latest); it
  //         must NOT read getAllPassageReports, whose sticky re-bucket would surface a
  //         stale 'blocked' after a human 'approved' (the approve-then-wait window)
  const latest = await getLatestPassageForStone({
    stone: stoneFirst.name,
    route,
  });

  // disposition (push | halt): the one value the onStop hook also reads
  const disposition = asRouteStoneDisposition({
    status: latest?.status ?? null,
    blocker: latest?.blocker ?? null,
  });

  // phase (where the work is): best-effort — a benign read fault degrades to the plain stone
  const phase = await getStonePhaseBestEffort({
    stone: stoneFirst,
    route,
    latest,
  });

  return { kind: 'stone', stone: stoneFirst.name, phase, disposition };
};

/**
 * .what = derives the current stone's phase, degraded to null on a benign route-state fault
 * .why = the phase is an enhancement on top of the stone name; a benign read fault (corrupt
 *        jsonl, unreadable file) must surface (stderr) but must NOT blank the base line — so
 *        we log and degrade to null (the plain '🗿 <stone>' line).
 *
 * .note = this is NOT failhide: the catch ALLOWLISTS only expected route-state read faults
 *         (`isExpectedRouteStateFault`) and RETHROWS any other error (a genuine bug), so an
 *         unexpected error still fails loud via the strict exit path.
 */
const getStonePhaseBestEffort = async (input: {
  stone: RouteStone;
  route: string;
  latest: PassageReport | null;
}): Promise<StatusLinePhase | null> => {
  try {
    return await getStonePhase(input);
  } catch (error) {
    // a genuine (unexpected) fault must surface, not degrade — rethrow it (failfast)
    if (!isExpectedRouteStateFault(error)) throw error;

    // a benign route-state read fault → surface on stderr, then degrade to the plain stone line
    // note: mirrors the `[route.status.line] fault:` convention (route.ts) so both stderr
    //       fault outputs read alike; the final `:` separates the crafted sentence from the
    //       raw error dump that console.error appends after it
    console.error(
      `[route.status.line] fault: phase derivation faulted for stone "${input.stone.name}", degraded to plain stone line:`,
      error,
    );
    return null;
  }
};

/**
 * .what = the specific filesystem error codes that count as a benign route-state read fault
 * .why = the allowlist must be EXACT — any error that merely holds a string `code` (a custom
 *        domain error with `code: 'BAD_STATE'`, a library error) must NOT pass, or a real
 *        defect would masquerade as a benign fault and be swallowed (rule.forbid.failhide)
 */
const FS_READ_FAULT_CODES: ReadonlySet<string> = new Set([
  'ENOENT', // no such file or directory
  'EACCES', // permission denied
  'EISDIR', // a directory where a file was expected
  'ENOTDIR', // a file where a directory was expected
  'ELOOP', // too many symlink hops
  'ENAMETOOLONG', // the path is too long
]);

/**
 * .what = whether an error is a benign route-state read fault (corrupt jsonl / unreadable file)
 * .why = the phase degrade covers ONLY unreadable route state; a genuine bug must rethrow so it
 *        surfaces loud (rule.forbid.failhide: allowlist the expected, surface the rest)
 *
 * .note = the two expected classes: a malformed jsonl line makes `JSON.parse` throw a
 *         `SyntaxError`; a filesystem read fault holds a KNOWN fs `code` (in FS_READ_FAULT_CODES).
 *         any other error — a custom `code`, a type error, a null deref, a domain bug — is
 *         unexpected and rethrown, so a real defect never hides behind a benign degrade.
 */
const isExpectedRouteStateFault = (error: unknown): boolean => {
  // a corrupt jsonl line → JSON.parse throws a SyntaxError
  if (error instanceof SyntaxError) return true;

  // a filesystem read fault → an Error that holds one of the KNOWN fs codes (not any code)
  // .note = `'code' in error` narrows error to hold a `code` key, so `.code` reads with
  //         no cast; its value is still `unknown`, guarded by the typeof + allowlist below
  if (error instanceof Error && 'code' in error) {
    const code: unknown = error.code;
    if (typeof code === 'string' && FS_READ_FAULT_CODES.has(code)) return true;
  }

  // otherwise unexpected → the caller must rethrow (fail loud)
  return false;
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
  // self-review blocker → the self-review phase with its r{done}/{total} counter
  if (input.blocker === 'review.self') return await getSelfPhase(input);

  // any peer-review blocker (active, exhausted, uncontemplated) → the peer depth l{level}@i{rounds}
  if (
    input.blocker === 'review.peer' ||
    input.blocker === 'review.peer.exhausted' ||
    input.blocker === 'review.peer.uncontemplated'
  )
    return await getPeerPhase(input);

  // a judge or approval blocker → the judge phase
  return { of: 'judge' };
};

/**
 * .what = derives the phase the work is actively in when no guard blocker names it
 * .why = between passage attempts (or on a driver wall / exhausted / malfunction status), the
 *        "where" comes from the review state: peer under way > self under way > the stone yields
 */
const getPhaseFromReviewState = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<StatusLinePhase> => {
  const guard = input.stone.guard;

  // an unguarded stone still yields its artifact (no reviews to be in)
  if (!guard) return { of: 'yield' };

  // peer review under way? (any reviewer has consumed a round)
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const peerStarted = meters.some((m) => m.rounds > 0);
  if (peerStarted) return await getPeerPhase(input);

  // self review under way? (any self-review promised)
  const promises = await getStonePromises({
    stone: input.stone,
    route: input.route,
  });
  if (promises.length > 0) return await getSelfPhase(input);

  // no review started → the stone still yields its artifact
  return { of: 'yield' };
};

/**
 * .what = derives the review.self phase with its r{done}/{total} counter
 * .why = names the self-review progress from promised slugs vs the guard's self-reviews
 */
const getSelfPhase = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<StatusLinePhase> => {
  const guard = input.stone.guard;
  // defensive: a self-review phase without a guard cannot count — fall back to yield
  if (!guard) return { of: 'yield' };

  const selfReviews = getGuardSelfReviews(guard);
  const promises = await getStonePromises({
    stone: input.stone,
    route: input.route,
  });
  const promisedSlugs = new Set(promises.map((p) => p.slug));
  const done = computePromisedReviewCount({ selfReviews, promisedSlugs });
  return { of: 'review.self', done, total: selfReviews.length };
};

/**
 * .what = derives the review.peer phase with its l{level}@i{rounds} depth
 * .why = names the peer-review depth from the guard's peer reviews + their round meters
 */
const getPeerPhase = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<StatusLinePhase> => {
  const guard = input.stone.guard;
  // defensive: a peer-review phase without a guard cannot measure — fall back to yield
  if (!guard) return { of: 'yield' };

  const peerReviews = getGuardPeerReviews(guard);
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const depth = asHighestStartedPeerDepth({ peerReviews, meters });
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
      level: r.level ?? 1,
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
 * .what = the lowest level defined across a stone's peer reviews (default 1)
 * .why = the level peer review begins at, before any reviewer has consumed a round
 */
const asLowestPeerLevel = (
  peerReviews: RouteStoneGuardReviewPeer[],
): number => {
  if (peerReviews.length === 0) return 1;
  return Math.min(...peerReviews.map((r) => r.level ?? 1));
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

import type { RouteGuardReviewPeerGivenConstraint } from './asPeerGivenConstraint';
import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getAllRouteGuardReviewPeerGivensFromPaths } from './getAllRouteGuardReviewPeerGivensFromPaths';
import { getLatestPeerGivensPerSlug } from './getLatestPeerGivensPerSlug';

/**
 * .what = one peer given — the LATEST for its slug — with its verdict counts and its path
 * .why = the readiness computation composes over these, so the file read + parse
 *        lives here (a communicator) and the orchestrator stays narrative
 *
 * 🔴 .note = the hash is deliberately ABSENT, exactly as on the taken side. the parser
 *         reads one off the filename, and it is dropped here rather than carried, because
 *         a field that is parsed and stored reads as load-bearing — and the one load it
 *         must never carry is the given↔taken match. a `.taken` write does not move the
 *         artifact hash, so one reviewer's successive givens routinely share a hash; a
 *         matcher keyed on it hands a fresh critique the prior iteration's answer.
 *         the pair matches on the DERIVED PATH, and `pathGiven`
 *         below is the whole of that identity.
 *
 * 🟡 do not restore it "for completeness". both halves of the pair now refuse it, and the
 *    symmetry is the guard: a hash present on one side and absent on the other is what
 *    invites the next author to wire the two together again.
 */
export interface RouteGuardReviewPeerGiven {
  slug: string;
  blockers: number;
  nitpicks: number;
  /**
   * 🔴 true when NO numeric count was found — so `blockers: 1` is FABRICATED, a value
   * the gate needs rather than a value the reviewer reported. any surface that prints
   * the count must say so, or it re-hides the malfunction as an ordinary verdict.
   */
  unreadable: boolean;
  /**
   * the refusal an unreadable given names — its cause and its lever — or null where the given
   * is no refusal (a readable verdict, or a malfunction). a refusal is readable as a REFUSAL,
   * so the surfaces that halt on it name its lever rather than call it a malfunction
   *
   * .note = the legal pairs of `unreadable` × `constraint`, so a caller reads one claim:
   *
   *         | unreadable | constraint | the given is…                                   |
   *         |------------|------------|-------------------------------------------------|
   *         | false      | null       | a readable verdict — its counts are real         |
   *         | true       | non-null   | a refusal — read its cause and lever             |
   *         | true       | null       | a malfunction — no count, no `ConstraintError:`  |
   *         | false      | non-null   | ⛔ never built — `getOneRouteGuardReviewPeerGiven` parses a constraint only when unreadable |
   *
   *         so `given.unreadable && given.constraint` is the refusal test, and
   *         `given.unreadable && !given.constraint` the malfunction test
   */
  constraint: RouteGuardReviewPeerGivenConstraint | null;
  /** the recency key — the only ordinal the latest-per-slug pick reads */
  iteration: number;
  /**
   * the given's absolute path, as this process spells it; the taken's path derives from it
   *
   * 🔴 its FILENAME is the given's identity (`asReviewGivenKey`), never the whole path — the
   *    dir prefix differs between the driver's process and a guard subprocess
   */
  pathGiven: string;
}

/**
 * .what = reads every peer .given across all hashes, keeps the latest per slug,
 *         and parses each into a record
 * .why = the i/o boundary for the feedbackAbsorption gate — enumerate the givens, read
 *        each, parse its verdict counts + slug + hash. the per-given read + parse lives in
 *        getOneRouteGuardReviewPeerGiven, poured by getAllRouteGuardReviewPeerGivensFromPaths
 *
 * .note = the debt is keyed to the REVIEWER, never to (reviewer, hash). an edit to
 *         the artifact under review moves the current hash; under a hash-keyed read
 *         that edit silently retires every unanswered debt, so the cheapest exit
 *         from a blocker is to change one line and re-roll. the latest-per-slug read
 *         is what makes an answer the only exit (0.wish.md defect D2).
 */
export const getAllRouteGuardReviewPeerGivens = async (input: {
  route: string;
  stone: string;
}): Promise<RouteGuardReviewPeerGiven[]> => {
  const givenPaths = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone,
    kind: 'given',
  });

  // read + parse every given into a record; a given a rewind deleted reads as none
  const givens = await getAllRouteGuardReviewPeerGivensFromPaths({
    paths: givenPaths,
  });

  // hand the parsed records to the pure pick — the latest-per-slug rule lives there, unit-tested
  return getLatestPeerGivensPerSlug({ givens });
};

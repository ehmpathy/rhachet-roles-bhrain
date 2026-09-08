import * as fs from 'fs/promises';

import { getReviewCountsViaRegex } from '../getReviewCountsViaRegex';
import { asPeerGivenVerdict } from './asPeerGivenVerdict';
import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getLatestPeerGivensPerSlug } from './getLatestPeerGivensPerSlug';
import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

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
 *         matcher keyed on it hands a fresh critique the prior iteration's answer
 *         (r8 blocker.1, i002). the pair matches on the DERIVED PATH, and `pathGiven`
 *         below is the whole of that identity.
 *
 * ⚠️ do not restore it "for completeness". both halves of the pair now refuse it, and the
 *    symmetry is the guard: a hash present on one side and absent on the other is what
 *    invites the next author to wire the two together again (r11 blocker.1, i003).
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
  /** the recency key — the only ordinal the latest-per-slug pick reads */
  iteration: number;
  /** 🔴 the given's IDENTITY. no subset of it is, and the taken's path derives from it */
  pathGiven: string;
}

/**
 * .what = reads every peer .given across all hashes, keeps the latest per slug,
 *         and parses each into a record
 * .why = the i/o boundary for the contemplation gate — enumerate the givens, read
 *        each, parse its verdict counts + slug + hash. keeps fs.readFile out of the
 *        orchestrator (grain separation)
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

  // read + parse every given into a record
  const givens = await Promise.all(
    givenPaths.map(async (givenPath) => {
      const content = await fs.readFile(givenPath, 'utf-8');
      const counts = getReviewCountsViaRegex({ content });
      const meta = getRouteGuardReviewPeerPathMeta({ path: givenPath });
      // the cast out of the ReviewCounts union is named + clamped, never a ternary here:
      // an UNREADABLE given gates rather than scores a silent 0/0 (contract.reviewer-output)
      const verdict = asPeerGivenVerdict({ counts });
      return {
        slug: meta.slug,
        blockers: verdict.blockers,
        nitpicks: verdict.nitpicks,
        unreadable: verdict.unreadable,
        // .note = meta.hash is read and DROPPED on purpose — see the interface above
        iteration: meta.iteration,
        pathGiven: givenPath,
      };
    }),
  );

  // hand the parsed records to the pure pick — the latest-per-slug rule lives there, unit-tested
  return getLatestPeerGivensPerSlug({ givens });
};

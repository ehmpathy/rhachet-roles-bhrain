// review.tally/ is a declared shared exposure (see its .readme.md), never review's internals
import { getOneReviewCountsViaRegex } from '@src/domain.operations/review.tally/getOneReviewCountsViaRegex';

import { asPeerGivenConstraint } from './asPeerGivenConstraint';
import { asPeerGivenVerdict } from './asPeerGivenVerdict';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getOneReviewArtifactContent } from './getOneReviewArtifactContent';
import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

/**
 * .what = reads one peer .given and parses it into a record, or null if the file is gone
 * .why = names the per-given read + parse, so the gather over givens reads as one named call
 *        per path (rule.forbid.decode-friction-in-orchestrators). the read routes through the
 *        named communicator getOneReviewArtifactContent (grain separation)
 *
 * .note = a given a rewind deleted since enumeration reads as null: it owes no debt
 * .note = 🔴 the hash is read off the filename and DROPPED on purpose — see
 *         RouteGuardReviewPeerGiven for why the given↔taken match must never key on it
 */
export const getOneRouteGuardReviewPeerGiven = async (input: {
  path: string;
}): Promise<RouteGuardReviewPeerGiven | null> => {
  // read the given; a deleted file yields none
  const content = await getOneReviewArtifactContent({ path: input.path });
  if (content === null) return null;

  // parse the counts and the path meta
  const counts = getOneReviewCountsViaRegex({ content });
  const meta = getRouteGuardReviewPeerPathMeta({ path: input.path });

  // the cast out of the ReviewCounts union is named + clamped, never a ternary here:
  // an UNREADABLE given gates rather than scores a silent 0/0 (contract.reviewer-output)
  const verdict = asPeerGivenVerdict({ counts });
  return {
    slug: meta.slug,
    blockers: verdict.blockers,
    nitpicks: verdict.nitpicks,
    unreadable: verdict.unreadable,
    // only an unreadable given can be a refusal; a readable verdict never is
    constraint: verdict.unreadable ? asPeerGivenConstraint({ content }) : null,
    // .note = meta.hash is read and DROPPED on purpose — see the interface
    iteration: meta.iteration,
    pathGiven: input.path,
  };
};

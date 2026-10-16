import { isPresent } from 'type-fns';

import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getOneRouteGuardReviewPeerGiven } from './getOneRouteGuardReviewPeerGiven';

/**
 * .what = how many given reads may be in flight at one time
 * .why = the givens of a stone grow with every iteration of every reviewer, so an unbounded
 *        fan-out opens one descriptor per file. the bound holds the open reads at a fixed
 *        count, as `getAllStoneGuardJudgeVerdictsFromFiles` does for its reads
 */
const BOUND_OF_CONCURRENT_GIVEN_READS = 8;

/**
 * .what = reads + parses each given path into a record, and keeps those still present
 * .why = names the gather, so the givens reader reads as enumerate → gather → pick, with no
 *        inline fan-out + narrow to simulate (rule.forbid.decode-friction-in-orchestrators)
 */
export const getAllRouteGuardReviewPeerGivensFromPaths = async (input: {
  paths: string[];
}): Promise<RouteGuardReviewPeerGiven[]> => {
  const givens = await getAllResultsInBoundedPool({
    items: input.paths,
    bound: BOUND_OF_CONCURRENT_GIVEN_READS,
    map: (path) => getOneRouteGuardReviewPeerGiven({ path }),
  });
  return givens.filter(isPresent);
};

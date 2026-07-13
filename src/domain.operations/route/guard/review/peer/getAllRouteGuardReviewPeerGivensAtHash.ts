import * as fs from 'fs/promises';

import { getReviewCountsFromContent } from '../getReviewCountsFromContent';
import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

/**
 * .what = one current-hash peer given, with its verdict counts + path
 * .why = the readiness computation composes over these, so the file read + parse
 *        lives here (a communicator) and the orchestrator stays narrative
 */
export interface RouteGuardReviewPeerGiven {
  slug: string;
  blockers: number;
  nitpicks: number;
  pathGiven: string;
}

/**
 * .what = reads every peer .given at the current review hash into parsed records
 * .why = the i/o boundary for the contemplation gate — enumerate the current-hash
 *        givens, read each, parse its verdict counts + slug. keeps fs.readFile out
 *        of the orchestrator (grain separation)
 */
export const getAllRouteGuardReviewPeerGivensAtHash = async (input: {
  route: string;
  stone: string;
  hashCurrent: string;
}): Promise<RouteGuardReviewPeerGiven[]> => {
  const givenPaths = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone,
    hash: input.hashCurrent,
    kind: 'given',
  });
  return Promise.all(
    givenPaths.map(async (givenPath) => {
      const content = await fs.readFile(givenPath, 'utf-8');
      const counts = getReviewCountsFromContent({ content });
      const meta = getRouteGuardReviewPeerPathMeta({ path: givenPath });
      return {
        slug: meta.slug,
        blockers: counts.blockers,
        nitpicks: counts.nitpicks,
        pathGiven: givenPath,
      };
    }),
  );
};

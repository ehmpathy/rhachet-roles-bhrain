import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

/**
 * .what = the (slug, hash) of every peer .taken across all iterations
 * .why = staleness is judged against the current hash, so the gate needs every
 *        taken's hash — a taken at a prior hash marks a stale contemplation
 */
export interface RouteGuardReviewPeerTakenMeta {
  slug: string;
  hash: string;
}

/**
 * .what = enumerates every peer .taken and parses its (slug, hash) meta
 * .why = the i/o boundary for the taken side of the gate — keeps the enumerate +
 *        parse out of the orchestrator (grain separation)
 */
export const getAllRouteGuardReviewPeerTakenMetas = async (input: {
  route: string;
  stone: string;
}): Promise<RouteGuardReviewPeerTakenMeta[]> => {
  const takenPaths = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone,
    kind: 'taken',
  });
  return takenPaths.map((takenPath) => {
    const meta = getRouteGuardReviewPeerPathMeta({ path: takenPath });
    return { slug: meta.slug, hash: meta.hash };
  });
};

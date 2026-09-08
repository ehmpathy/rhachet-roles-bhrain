import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

/**
 * .what = the slug + full path of every peer .taken across all iterations
 * .why = a taken answers the ONE given whose path derives it, so the gate pairs on
 *        the path rather than on a coordinate subset. the slug is kept for the
 *        absent-vs-stale tag, which asks only "has this reviewer ever been answered?"
 *
 * 🔴 the hash is deliberately absent. two givens from one reviewer can share a hash
 * — a .taken write does not move the artifact hash — so a hash cannot identify WHICH
 * given a taken answers (r8 blocker.1, i002).
 */
export interface RouteGuardReviewPeerTakenMeta {
  slug: string;
  pathTaken: string;
}

/**
 * .what = enumerates every peer .taken and parses its `{ slug, pathTaken }` meta
 * .why = the i/o boundary for the taken side of the gate — keeps the enumerate +
 *        parse out of the orchestrator (grain separation)
 *
 * ⚠️ this line read `(slug, hash)` until i018 — the exact coordinate pair the change
 *    above it REMOVED. the interface docblock was updated and this one was missed, so a
 *    reader who stopped here was told the obsolete contract by name
 *    (`rule.require.timeless-comments`; r1 repo-rules, nitpick.1, i018).
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
    return { slug: meta.slug, pathTaken: takenPath };
  });
};

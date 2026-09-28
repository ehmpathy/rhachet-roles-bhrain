import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneDriveArtifacts } from '@src/domain.objects/Driver/RouteStoneDriveArtifacts';

import { computeNextStones } from './computeNextStones';
import { getAllStoneDriveArtifacts } from './getAllStoneDriveArtifacts';
import { getAllStones } from './getAllStones';

/**
 * .what = the route's stone frontier in ONE snapshot — every stone, its drive artifacts, and the
 *         computed next-one frontier — read once so callers share a single consistent view.
 * .why = two callers derive from the same three-read frontier and MUST NOT read it twice:
 *        - stepRouteDrive picks nextStones[0] as the stone to guide on (and treats an empty
 *          frontier as route-complete)
 *        - getRouteDriveComplete asks "no next stone ⇒ drive done" for the reminder's reap gate
 *        a second, independent read could observe a concurrent artifact/passage write and yield a
 *        frontier that disagrees with the first (a TOCTOU split: the reminder's "is the drive
 *        complete?" verdict and the drive's own "is there a next stone?" verdict diverge). one read,
 *        threaded through both, keeps them atomic per invocation and halves the I/O on every hook
 *        call — the same single-read-threaded discipline stepRouteDrive already uses for
 *        passageLatestByStone (rule.forbid.behavior-hazards, rule.prefer.most-common-denominator).
 *
 * .note = nextStones is computed with '@next-one' — the SAME query both callers use — so the shared
 *         snapshot serves each without a re-compute.
 */
export interface RouteDriveFrontier {
  stones: RouteStone[];
  artifacts: RouteStoneDriveArtifacts[];
  nextStones: RouteStone[];
}

export const getRouteDriveFrontier = async (input: {
  route: string;
}): Promise<RouteDriveFrontier> => {
  const stones = await getAllStones({ route: input.route });
  const artifacts = await getAllStoneDriveArtifacts({ route: input.route });
  const nextStones = computeNextStones({
    stones,
    artifacts,
    query: '@next-one',
  });
  return { stones, artifacts, nextStones };
};

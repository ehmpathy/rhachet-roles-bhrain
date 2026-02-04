import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneDriveArtifacts } from '@src/domain.objects/Driver/RouteStoneDriveArtifacts';

import { computeStoneOrderPrefix } from './computeStoneOrderPrefix';

/**
 * .what = computes the next stone(s) to work on
 * .why = enables robot to know what milestone is next
 */
export const computeNextStones = (input: {
  stones: RouteStone[];
  artifacts: RouteStoneDriveArtifacts[];
  query: '@next-one' | '@next-all';
}): RouteStone[] => {
  // build map of stone path to artifacts
  const artifactMap = new Map<string, RouteStoneDriveArtifacts>();
  for (const artifact of input.artifacts) {
    artifactMap.set(artifact.stone.path, artifact);
  }

  // filter to incomplete stones (no passage marker)
  const incomplete = input.stones.filter((stone) => {
    const artifact = artifactMap.get(stone.path);
    return !artifact?.passage;
  });

  // if none incomplete, all passed
  if (incomplete.length === 0) return [];

  // sort alphanumerically by name
  const sorted = [...incomplete].sort((a, b) => a.name.localeCompare(b.name));
  const stoneFirst = sorted[0];
  if (!stoneFirst) return [];

  // if @next-one, return first
  if (input.query === '@next-one') {
    return [stoneFirst];
  }

  // if @next-all, return all with same order prefix as first
  const firstPrefix = computeStoneOrderPrefix({ stone: stoneFirst });
  return sorted.filter(
    (stone) => computeStoneOrderPrefix({ stone }) === firstPrefix,
  );
};

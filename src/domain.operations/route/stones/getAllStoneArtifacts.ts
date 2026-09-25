import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import {
  getStoneYieldGlob,
  getStoneYieldGlobLegacy,
} from './getStoneYieldGlob';

/**
 * .what = retrieves artifact files for a specific stone
 * .why = enables artifact presence to be verified before passage
 *
 * .note = globs run from repo root; $route is expanded to input.route
 */
export const getAllStoneArtifacts = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string[]> => {
  // determine glob pattern from guard or default
  // 🔴 the two default globs are owned by `getStoneYieldGlob`, never hand-typed here. this
  //    reader is what the round's own hash key reads, so a drift between it and the writers
  //    would re-key every open lane's trigger report for work no lane did
  const hasCustomArtifacts =
    input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0;
  const globs = hasCustomArtifacts
    ? input.stone.guard!.artifacts
    : [
        `${input.route}/${getStoneYieldGlob({ stone: input.stone.name })}`,
        `${input.route}/${getStoneYieldGlobLegacy({ stone: input.stone.name })}`,
      ];

  // enumerate all matches across all globs
  const allMatches: string[] = [];
  for (const glob of globs) {
    // expand $route to input.route; patterns without $route are used as-is from repo root
    const expandedGlob = glob.replace(/\$route/g, input.route);
    const matches = await enumFilesFromGlob({
      glob: expandedGlob,
      cwd: process.cwd(),
    });
    allMatches.push(...matches);
  }

  return allMatches;
};

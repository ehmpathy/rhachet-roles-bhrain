import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

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
  const hasCustomArtifacts =
    input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0;
  const globs = hasCustomArtifacts
    ? input.stone.guard!.artifacts
    : [`${input.route}/${input.stone.name}*.md`];

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

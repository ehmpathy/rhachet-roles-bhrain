import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = retrieves artifact files for a specific stone
 * .why = enables artifact presence to be verified before passage
 */
export const getAllStoneArtifacts = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string[]> => {
  // determine glob pattern from guard or default
  const globs =
    input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0
      ? input.stone.guard.artifacts
      : [`${input.stone.name}*.md`];

  // enumerate all matches across all globs
  const allMatches: string[] = [];
  for (const glob of globs) {
    const matches = await enumFilesFromGlob({ glob, cwd: input.route });
    allMatches.push(...matches);
  }

  return allMatches;
};

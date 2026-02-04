import * as fs from 'fs/promises';
import * as path from 'path';

import { RouteStoneDriveArtifacts } from '@src/domain.objects/Driver/RouteStoneDriveArtifacts';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getAllStones } from './getAllStones';

/**
 * .what = retrieves drive artifacts for all stones in a route
 * .why = enables progress to be assessed along a route
 */
export const getAllStoneDriveArtifacts = async (input: {
  route: string;
}): Promise<RouteStoneDriveArtifacts[]> => {
  // get all stones in the route
  const stones = await getAllStones({ route: input.route });

  // build artifacts for each stone
  const artifacts: RouteStoneDriveArtifacts[] = [];
  for (const stone of stones) {
    // find output files via glob
    const outputGlob = `${stone.name}*.md`;
    const outputs = await enumFilesFromGlob({
      glob: outputGlob,
      cwd: input.route,
    });

    // check for passage marker
    const passagePath = path.join(
      input.route,
      '.route',
      `${stone.name}.passed`,
    );
    let passage: string | null = null;
    try {
      await fs.access(passagePath);
      passage = passagePath;
    } catch {
      // no passage marker
    }

    artifacts.push(
      new RouteStoneDriveArtifacts({
        stone: { path: stone.path },
        outputs,
        passage,
      }),
    );
  }

  return artifacts;
};

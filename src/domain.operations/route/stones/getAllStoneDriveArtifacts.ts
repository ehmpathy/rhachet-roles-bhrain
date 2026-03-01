import * as path from 'path';

import { RouteStoneDriveArtifacts } from '@src/domain.objects/Driver/RouteStoneDriveArtifacts';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getOnePassageReport } from '../passage/getOnePassageReport';
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

    // check for passage report in passage.jsonl
    const passageReport = await getOnePassageReport({
      stone: stone.name,
      status: 'passed',
      route: input.route,
    });
    let passage: string | null = null;
    if (passageReport) {
      passage = path.join(input.route, '.route', 'passage.jsonl');
    }

    // auto-pass unguarded stones that have output artifacts
    if (!passage && !stone.guard && outputs.length > 0) {
      passage = 'auto:unguarded';
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

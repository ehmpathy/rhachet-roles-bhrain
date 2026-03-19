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
    // note: only explicit 'passed' status constitutes valid passage
    //       auto-pass removed — require explicit passage for all stones
    const passageReport = await getOnePassageReport({
      stone: stone.name,
      status: 'passed',
      route: input.route,
    });
    const passage: string | null = passageReport
      ? path.join(input.route, '.route', 'passage.jsonl')
      : null;

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

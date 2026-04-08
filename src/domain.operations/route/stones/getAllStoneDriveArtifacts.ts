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
    // globs: .yield* (new pattern) + *.md (legacy pattern)
    const yieldGlob = `${stone.name}.yield*`;
    const legacyGlob = `${stone.name}*.md`;
    const yieldMatches = await enumFilesFromGlob({
      glob: yieldGlob,
      cwd: input.route,
    });
    const legacyMatches = await enumFilesFromGlob({
      glob: legacyGlob,
      cwd: input.route,
    });
    // combine and dedupe (some files match both patterns)
    const outputs = [...new Set([...yieldMatches, ...legacyMatches])];

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

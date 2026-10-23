import * as path from 'path';

import type { ExitCodeClass } from '@src/domain.objects/Driver/ExitCodeClass';
import { getOneJudgeArtifactContent } from '@src/domain.operations/route/judges/getOneJudgeArtifactContent';

import { asGuardArtifactIteration } from '../artifact/asGuardArtifactIteration';
import { asExitCodeClass } from '../asExitCodeClass';
import { asExitCodeFromArtifactContent } from '../asExitCodeFromArtifactContent';

/**
 * .what = reads one judge file's iteration and exit class, or null if its name carries no
 *         iteration or the file vanished since enumeration
 * .why = the judge verdict gather reads N files; this names the per-file read, so the gather
 *        reads as one named call per file rather than an inline parse + read + classify
 */
export const getOneStoneGuardJudgeVerdictFromFile = async (input: {
  filePath: string;
}): Promise<{ iteration: number; exitClass: ExitCodeClass } | null> => {
  // a file whose name carries no iteration marker is no verdict
  const iteration = asGuardArtifactIteration({
    filename: path.basename(input.filePath),
  });
  if (iteration === null) return null;

  // read the artifact via the one judge-artifact read; a race delete since enumeration is
  // no verdict, never a fault
  const content = await getOneJudgeArtifactContent({ path: input.filePath });
  if (content === null) return null;

  // classify the exit the judge recorded
  const exitClass = asExitCodeClass({
    code: asExitCodeFromArtifactContent({ content }),
  });
  return { iteration, exitClass };
};

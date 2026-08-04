import * as fs from 'fs/promises';
import * as path from 'path';

import { enumRouteFiles } from '../artifact/enumRouteFiles';
import { asExitCodeFromArtifactContent } from '../asExitCodeFromArtifactContent';
import { type ExitCodeClass, getExitCodeClass } from '../getExitCodeClass';

/**
 * .what = reads the persisted judge verdicts for a stone at a given review-input hash
 * .why = the level-state must know whether the judge rung holds, WITHOUT a re-run of the judge —
 *        overrule/force query it before the driver's next `--as passed`
 *
 * a production judge file carries two hashes:
 *   $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
 * so it is enumerated by the review hash with the judge hash left as a wildcard. only the
 * iteration and exit class are read here — the full artifact parse lives in
 * getAllStoneGuardArtifactsByHash and is not needed to decide a hold.
 */
export const getStoneGuardJudgeVerdicts = async (input: {
  stone: { name: string };
  route: string;
  hash: string;
}): Promise<{ iteration: number; exitClass: ExitCodeClass }[]> => {
  // enumerate judge files for this stone at this review hash (any judge hash)
  const files = await enumRouteFiles({
    route: input.route,
    glob: `.route/${input.stone.name}.guard.judge.*.${input.hash}.*.md`,
  });

  // read each file's iteration + exit class from its filename + content; a file whose name
  // carries no iteration marker maps to null and is filtered out
  const verdicts = (
    await Promise.all(
      files.map(async (filePath) => {
        const filename = path.basename(filePath);
        const iterMatch = filename.match(/\.i(\d+)[p.]/);
        if (!iterMatch?.[1]) return null;
        const iteration = parseInt(iterMatch[1], 10);

        const content = await fs.readFile(filePath, 'utf-8');
        const exitCode = asExitCodeFromArtifactContent({ content });
        const exitClass = getExitCodeClass({ code: exitCode });

        return { iteration, exitClass };
      }),
    )
  ).filter(
    (verdict): verdict is { iteration: number; exitClass: ExitCodeClass } =>
      verdict !== null,
  );

  return verdicts;
};

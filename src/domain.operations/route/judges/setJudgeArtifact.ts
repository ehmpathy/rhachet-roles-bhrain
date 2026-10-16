import * as fs from 'fs/promises';

/**
 * .what = upserts one judge's artifact — the `.guard.judge.*.md` file
 * .why = the guard's record of what a judge said. one authored write that replaces the file
 *        wholesale, the twin of `setPeerReviewStdoutArtifact` for peer artifacts
 *
 * .note = the dir is findserted by `genJudgeRouteDir` before the judge runs
 */
export const setJudgeArtifact = async (input: {
  path: string;
  content: string;
}): Promise<{ path: string }> => {
  await fs.writeFile(input.path, input.content);
  return { path: input.path };
};

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import {
  getOneTargetSplitOfRun,
  type TargetSplitOfRun,
} from '@src/domain.operations/review/meter/getOneTargetSplitOfRun';
import { getRepoRootWithFallback } from '@src/domain.operations/route/guard/getRepoRootWithFallback';

/**
 * .what = the target split of a metered run that compiled no prompt; null for a run
 *         that did compile one
 * .why = a run refused at the overflow gate has no census, so the split is what tells
 *        a driver whether a narrower file radius or a partition is the lever. it keys
 *        on the run's OWN dir (`run.dir`), never on the path a caller typed — so a
 *        tree's latest run and that same run named by its dir render the same split
 *
 * .note = the repo root is the git root of the run dir itself, never the invocation
 *         dir (rule.forbid.cwd-outside-gitroot)
 */
export const getOneTargetSplitOfRunMeter = async (input: {
  run: ReviewRunMeter;
}): Promise<TargetSplitOfRun | null> => {
  // a run that compiled a prompt carries its own census; no split is owed
  if (input.run.prompt !== null) return null;

  // re-derive the split from the run's recorded scope, against its own repo root
  return await getOneTargetSplitOfRun({
    at: input.run.dir,
    cwd: await getRepoRootWithFallback({ from: input.run.dir }),
  });
};

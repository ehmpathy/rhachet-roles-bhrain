import { asReviewRunArgsOfRun } from '@src/domain.operations/review/asReviewRunArgsOfRun';
import { asReviewRunDir } from '@src/domain.operations/review/asReviewRunDir';
import { genLogDirName } from '@src/domain.operations/review/genLogDirName';
import { genReviewDir } from '@src/domain.operations/review/genReviewDir';
import type { ReviewScopeSettled } from '@src/domain.operations/review/getOneReviewScopeSettled';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import { setScopeArtifact } from '@src/domain.operations/review/setScopeArtifact';
import { setScopeDebugArtifact } from '@src/domain.operations/review/setScopeDebugArtifact';

import { getAllTargetsOfPartition } from './getAllTargetsOfPartition';

/**
 * .what = mints ONE partition run (or the prime) of a split lane on disk — its own log dir
 *         and its own scope artifacts, narrowed to the partition. it mints no clock
 * .why = each partition run is still a full run on disk — its own log dir, its own scope
 *        artifacts, its own meter row — yet it walks and reads naught: it narrows the scope
 *        the whole run settled, so it grades exactly the bytes the split was planned over
 *
 * .note = the scope artifacts are written here, narrowed to the partition, since a partition
 *         that refuses on its own overflow is read back by the meter from them
 *         (`getOneTargetSplitOfRun`)
 * .note = 🔴 it starts NO clock. every partition, the prime, and each retry run inside the
 *         lane's one process, under the lane's one subprocess bound, so each reads the lane's
 *         own `msOfReviewStart`. a fresh start per run would hand each the whole brain call
 *         bound again, and a split lane could then outlive the outer kill — which drops the
 *         merged report, the tally, and every verdict already paid for
 *         (rule.forbid.dropped-partial-review-progress)
 */
export const genReviewRunOfPartition = async (input: {
  review: StepReviewInput;
  settled: ReviewScopeSettled;
  cwd: string;
}): Promise<{ logDir: string }> => {
  const { scope } = input.settled;

  // mint this run's own log dir
  const logDir = asReviewRunDir({ cwd: input.cwd, name: genLogDirName() });
  await genReviewDir({ dir: logDir });

  // record the narrowed scope, as a whole run records its own
  const targetFiles = getAllTargetsOfPartition({
    targets: scope.targets.files,
    partition: input.review.partition ?? null,
  });
  await setScopeDebugArtifact({
    logDir,
    args: asReviewRunArgsOfRun({ args: scope.args, review: input.review }),
    resolution: { ...scope.resolution, targetFiles },
  });
  await setScopeArtifact({
    logDir,
    scope: {
      ruleFiles: input.settled.ruleFiles,
      refFiles: scope.refFiles,
      conversationFiles: scope.conversationFiles,
      targetFiles,
    },
  });

  return { logDir };
};

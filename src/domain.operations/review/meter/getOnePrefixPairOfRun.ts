import * as path from 'path';

import type { ReviewRunArgsRecordRead } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';
import { getAllEntriesInDir } from '@src/domain.operations/review/getAllEntriesInDir';
import { asPrefixLaneKey } from '@src/domain.operations/review/meter/asPrefixLaneKey';
import { asReviewRunDirs } from '@src/domain.operations/review/meter/asReviewRunDirs';
import { getOnePrefixPairOfRuns } from '@src/domain.operations/review/meter/getOnePrefixPairOfRuns';
import { getOneRunArtifactJson } from '@src/domain.operations/review/meter/getOneRunArtifactJson';
import { isReviewRunOfGuard } from '@src/domain.operations/review/meter/isReviewRunOfGuard';
import type { ReviewPrefixPair } from '@src/domain.operations/review/meter/ReviewPrefixPair';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

/**
 * .what = the guard identity a run dir's args record names, or null
 * .why = the prior lookup reads only the args record of each earlier run, never its
 *        full meter. a torn args record names no identity it can be trusted for, so it
 *        is passed over as a run of no lane — the same way the tree walk drops it
 */
const getOneIdentityOfRunDir = async (input: {
  dir: string;
}): Promise<ReviewRunIdentity | null> => {
  try {
    // .note = the reader already proved the body a record; the `as` binds only the
    //         field NAMES of the deep-partial read shape
    const args = (await getOneRunArtifactJson({
      dir: input.dir,
      artifact: 'args',
    })) as ReviewRunArgsRecordRead | null;
    const output = args?.args?.output;
    return output ? asReviewRunIdentity({ output }) : null;
  } catch (error) {
    if (error instanceof ReviewRunArtifactError) return null;
    throw error;
  }
};

/**
 * .what = the latest earlier run dir under the root whose lane matches, or null
 * .why = a reviewer's prior round is the last run of its lane minted before this one.
 *        the dirs sort by their iso mint stamp, so the walk goes backward from this run
 *        and stops at the first match — most often one or two reads away
 */
const getOnePriorRunDirOfLane = async (input: {
  dirs: string[];
  before: string;
  lane: string;
}): Promise<{ dir: string; identity: ReviewRunIdentity } | null> => {
  // compared by name alone, since the mint stamp leads it — so a relative `--at` and
  // an absolute root still order alike
  const before = path.basename(input.before);
  const earlier = input.dirs
    .filter((dir) => path.basename(dir) < before)
    .reverse();
  for (const dir of earlier) {
    const identity = await getOneIdentityOfRunDir({ dir });
    if (identity && asPrefixLaneKey({ identity }) === input.lane)
      return { dir, identity };
  }
  return null;
};

/**
 * .what = one run set against its reviewer's prior round, or null where it has none
 * .why = the `--of run` breadth measures the same pair the tree walk does, through the
 *        same measurement (`getOnePrefixPairOfRuns`), so a run reads one verdict at
 *        every breadth. it reads only the args records of earlier runs to find the
 *        prior, never a full meter per run
 *
 * .note = null on a run with no guard identity, and on a lane's first round in this
 *         tree — the render parts the two by the run's own identity
 */
export const getOnePrefixPairOfRun = async (input: {
  run: ReviewRunMeter;
  root: string;
}): Promise<ReviewPrefixPair | null> => {
  // only a guard run names a reviewer, so only a guard run has a prior round
  const { run } = input;
  if (!isReviewRunOfGuard(run)) return null;

  // the earlier runs of this lane, latest first, under the same log root
  const entries = (await getAllEntriesInDir({ at: input.root })) ?? [];
  const prior = await getOnePriorRunDirOfLane({
    dirs: asReviewRunDirs({ root: input.root, entries }),
    before: run.dir,
    lane: asPrefixLaneKey({ identity: run.identity }),
  });
  if (prior === null) return null;

  // the pair, measured exactly as the tree walk measures it
  return getOnePrefixPairOfRuns({ prior, round: run });
};

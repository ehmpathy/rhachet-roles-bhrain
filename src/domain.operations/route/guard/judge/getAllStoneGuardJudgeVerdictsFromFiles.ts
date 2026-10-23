import { isPresent } from 'type-fns';

import type { ExitCodeClass } from '@src/domain.objects/Driver/ExitCodeClass';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { getOneStoneGuardJudgeVerdictFromFile } from './getOneStoneGuardJudgeVerdictFromFile';

/**
 * .what = how many judge artifact reads may be in flight at one time
 * .why = the judge files at one hash grow with every iteration, so an unbounded fan-out opens
 *        one descriptor per file. the bound holds the open reads at a fixed count, as
 *        `getAllReviewerLevels` and `getAllReviewRunMeters` do for their reads
 */
const BOUND_OF_CONCURRENT_JUDGE_READS = 8;

/**
 * .what = reads the verdict of each judge file, and keeps those whose name carries an iteration
 * .why = names the gather, so the verdict reader reads as enumerate → gather, with no inline
 *        fan-out to simulate (rule.forbid.inline-decode-friction)
 */
export const getAllStoneGuardJudgeVerdictsFromFiles = async (input: {
  files: string[];
}): Promise<{ iteration: number; exitClass: ExitCodeClass }[]> => {
  const verdicts = await getAllResultsInBoundedPool({
    items: input.files,
    bound: BOUND_OF_CONCURRENT_JUDGE_READS,
    map: (filePath) => getOneStoneGuardJudgeVerdictFromFile({ filePath }),
  });
  return verdicts.filter(isPresent);
};

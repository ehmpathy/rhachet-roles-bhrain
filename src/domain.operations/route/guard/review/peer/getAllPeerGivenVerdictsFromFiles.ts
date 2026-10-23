import { isPresent } from 'type-fns';

import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { getOnePeerGivenVerdictFromFile } from './getOnePeerGivenVerdictFromFile';

/**
 * .what = how many review file reads may be in flight at one time
 * .why = the review files of a stone grow with every iteration, so an unbounded fan-out opens
 *        one descriptor per file. the bound holds the open reads at a fixed count, as
 *        `getAllStoneGuardJudgeVerdictsFromFiles` does for its reads
 */
const BOUND_OF_CONCURRENT_REVIEW_READS = 8;

/**
 * .what = reads the verdict of each review file, and keeps those whose file is still present
 * .why = names the gather, so the totals reader reads as gather → sum, with no inline fan-out
 *        to simulate (rule.forbid.decode-friction-in-orchestrators)
 */
export const getAllPeerGivenVerdictsFromFiles = async (input: {
  files: string[];
}): Promise<{ blockers: number; nitpicks: number; unreadable: boolean }[]> => {
  const verdicts = await getAllResultsInBoundedPool({
    items: input.files,
    bound: BOUND_OF_CONCURRENT_REVIEW_READS,
    map: (path) => getOnePeerGivenVerdictFromFile({ path }),
  });
  return verdicts.filter(isPresent);
};

import { isPresent } from 'type-fns';

import type { StoneGuardPartitionCoverage } from './getOneStoneGuardPartitionCoverage';
import type { StoneGuardPartitionGap } from './StoneGuardPartitionGap';

/**
 * .what = the gaps of a stone's partition coverage — one per scope that cannot hold the branch
 * .why = names the narrow the entrance gate and its replay both read, so each reads "the gaps
 *        of the coverage" rather than a map + filter to simulate
 *        (rule.forbid.inline-decode-friction)
 */
export const asStoneGuardPartitionGapsOfCoverage = (input: {
  coverages: StoneGuardPartitionCoverage[];
}): StoneGuardPartitionGap[] =>
  input.coverages.map((coverage) => coverage.gap).filter(isPresent);

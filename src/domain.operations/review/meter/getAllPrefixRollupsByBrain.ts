import { BRAIN_OF_ABSENT_ARGS } from '@src/domain.operations/review/meter/BRAIN_OF_ABSENT_ARGS';
import { getOnePrefixVerdictRollup } from '@src/domain.operations/review/meter/getOnePrefixVerdictRollup';
import type { ReviewPrefixPair } from '@src/domain.operations/review/meter/ReviewPrefixPair';
import type { ReviewPrefixRollupOfBrain } from '@src/domain.operations/review/meter/ReviewPrefixRollupOfBrain';
import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = the key a pair is filed under — the brain its ROUND rode
 * .why = the round is the run that billed the read, so its brain owns the verdict. a round
 *        that names no brain files under `BRAIN_OF_ABSENT_ARGS`, never dropped
 */
const asBrainOfPair = (input: { pair: ReviewPrefixPair }): string =>
  input.pair.brains.round ?? BRAIN_OF_ABSENT_ARGS;

/**
 * .what = the pairs grouped by the brain their round rode, in first-seen order
 * .why = one group per brain, so each brain's verdicts roll up from its own pairs alone
 */
const asPairsByBrain = (input: {
  pairs: ReviewPrefixPair[];
}): Array<{ brain: string; pairs: ReviewPrefixPair[] }> => {
  const brains = [
    ...new Set(input.pairs.map((pair) => asBrainOfPair({ pair }))),
  ];
  return brains.map((brain) => ({
    brain,
    pairs: input.pairs.filter((pair) => asBrainOfPair({ pair }) === brain),
  }));
};

/**
 * .what = the order of two brain rollups — the brain of the most pairs first, then by key
 * .why = the heaviest brain leads, as every axis here ranks; the key breaks a tie so the
 *        order is stable across runs
 */
const asRollupOfBrainOrder = (input: {
  a: ReviewPrefixRollupOfBrain;
  b: ReviewPrefixRollupOfBrain;
}): number =>
  input.b.verdicts.pairs - input.a.verdicts.pairs ||
  compareStrings(input.a.brain, input.b.brain);

/**
 * .what = the verdict counts of a set of round pairs, one rollup per brain the rounds rode
 * .why = a brain's cache rate says how much it cached; its verdicts say why it cached naught
 *
 * .note = every pair lands in exactly one brain's group, so the rows sum to the corpus
 *         rollup by construction
 * .note = one named operation though two censuses call it (`getOnePrefixCensusOfRuns`,
 *         `getOnePrefixCensusOfTrees`): the tree and the grove must group alike, or their
 *         brain rows would disagree on one corpus
 */
export const getAllPrefixRollupsByBrain = (input: {
  pairs: ReviewPrefixPair[];
}): ReviewPrefixRollupOfBrain[] =>
  asPairsByBrain({ pairs: input.pairs })
    .map((group) => ({
      brain: group.brain,
      verdicts: getOnePrefixVerdictRollup({ pairs: group.pairs }),
    }))
    .sort((a, b) => asRollupOfBrainOrder({ a, b }));

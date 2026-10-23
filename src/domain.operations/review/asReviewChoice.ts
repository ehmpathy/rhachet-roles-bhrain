import { UnexpectedCodePathError } from 'helpful-errors';

import {
  CHOICES_OF_REVIEW_FLAG,
  type ReviewChoiceFlag,
  type ReviewChoiceOf,
} from './CHOICES_OF_REVIEW_FLAG';

/**
 * .what = narrows a choice flag's typed value onto its closed set, or throws
 * .why = the argv parse hands back the value as typed, a plain string; a cast to the
 *        closed set before the check would let the type claim `'drop' | 'keep'` while the
 *        value reads `'kepp'` (rule.forbid.as-cast). this narrow runs after
 *        `getAllReviewFlagChoiceRefusals` has refused every value outside its set, so a
 *        throw here is a code path the refusal check should have made unreachable
 */
export const asReviewChoice = <F extends ReviewChoiceFlag>(input: {
  flag: F;
  value: string;
}): ReviewChoiceOf<F> => {
  // the closed set of this flag, read from the one table the refusal check reads
  const choices: readonly ReviewChoiceOf<F>[] =
    CHOICES_OF_REVIEW_FLAG[input.flag];
  const choice = choices.find((one) => one === input.value);

  // a value outside the set past the refusal check is a defect of the check
  if (choice === undefined)
    return UnexpectedCodePathError.throw(
      `--${input.flag} value is outside its closed set, past the refusal check`,
      { flag: input.flag, value: input.value, choices },
    );
  return choice;
};

import {
  CHOICES_OF_REVIEW_FLAG,
  type ReviewChoiceFlag,
} from './CHOICES_OF_REVIEW_FLAG';

/**
 * .what = the order in which refusals are named — the table's own key order
 * .why = derived from the table, never a second list: a hand-typed array compiles
 *        while it silently drops a new flag from validation, which reopens the very
 *        typo class this file closes (the same move as `ORDER_OF_SECTIONS`)
 * .note = the cast is sound — `Object.keys` of a `Record<K, …>` yields exactly `K`,
 *         and typescript widens it to `string[]` only because objects may carry extras
 */
// .note = `Object.keys` types its result `string[]`; the `as` restores the key type of a
//         literal `Record<ReviewChoiceFlag, …>` that is never written at runtime, so every key
//         it returns is a `ReviewChoiceFlag` and the cast asserts naught that is untrue
const FLAGS_OF_CHOICE = Object.keys(
  CHOICES_OF_REVIEW_FLAG,
) as readonly ReviewChoiceFlag[];

/**
 * .what = the accepted values of one choice flag, in words — `a or b`, or `a, b, or c`
 */
const asChoicesInWords = (input: { choices: readonly string[] }): string => {
  const choicesHead = input.choices.slice(0, -1);
  const choiceLast = input.choices[input.choices.length - 1];
  if (choicesHead.length < 2) return input.choices.join(' or ');
  return `${choicesHead.join(', ')}, or ${choiceLast}`;
};

/**
 * .what = one refusal line per choice flag whose value is outside its closed set
 * .why = 🔴 a choice flag that falls through on a typo does not fail — it runs as the
 *        OTHER mode, in silence. `--focus pul` is the sharpest: the payload check reads
 *        "not push" as pull and sends paths only, while the tool-use guard reads only
 *        the literal `pull`, so an atom brain receives no content and reports a review
 *        of naught as `reviewed` (rule.forbid.failhide). `--mode plna` is its peer: a
 *        typo of the free preview ran a paid review.
 *
 *        each flag once carried its own hand-rolled check, or none; `--polluters` had
 *        one and `--focus`, `--join`, `--goal`, `--mode` did not. one table closes the class
 *
 * .note = an absent flag is not refused — the parse has already put its default in,
 *         or, for a flag with no default (`mode`), passes null
 */
export const getAllReviewFlagChoiceRefusals = (input: {
  options: Record<ReviewChoiceFlag, string | null>;
}): string[] =>
  FLAGS_OF_CHOICE.filter((flag) => {
    const value = input.options[flag];
    const choices: readonly string[] = CHOICES_OF_REVIEW_FLAG[flag];
    return value !== null && !choices.includes(value);
  }).map(
    (flag) =>
      `--${flag} must be ${asChoicesInWords({ choices: CHOICES_OF_REVIEW_FLAG[flag] })} (received: ${input.options[flag]})`,
  );

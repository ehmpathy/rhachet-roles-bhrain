/**
 * .what = the closed set of values each choice flag of `rhx review` accepts
 * .why = one table, so a new choice flag cannot be added without its validation, and the
 *        refusal check and the narrow after it read the same sets. the first value of
 *        each set is its default
 *
 * .note = `mode` has no default of its own. `plan` is the one value review reads; `hard`
 *         and `soft` are the outer dispatcher's own (`rhachet run --skill review --mode
 *         hard`), forwarded verbatim into this argv, so every guard-authored call carries
 *         one. any other value is a typo, and a typo of `plan` would run a PAID review
 */
export const CHOICES_OF_REVIEW_FLAG = {
  polluters: ['drop', 'keep'],
  join: ['intersect', 'union'],
  focus: ['push', 'pull'],
  goal: ['exhaustive', 'representative'],
  mode: ['plan', 'hard', 'soft'],
} as const;

/**
 * .what = the choice flags of `rhx review`
 */
export type ReviewChoiceFlag = keyof typeof CHOICES_OF_REVIEW_FLAG;

/**
 * .what = the accepted values of one choice flag, as a type
 */
export type ReviewChoiceOf<F extends ReviewChoiceFlag> =
  (typeof CHOICES_OF_REVIEW_FLAG)[F][number];

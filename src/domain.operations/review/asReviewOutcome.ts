/**
 * .what = the grade of one review, from its two counts
 * .why = the review FILE header and the terminal stdout both grade the same two counts.
 *        each kept its own grade, and they drifted: a nitpick-only review read `all clear`
 *        in the file and `just a few hoots` at the terminal. the grade now has one home;
 *        each renderer keeps only its own phrase for it
 */
export const asReviewOutcome = (input: {
  blockersCount: number;
  nitpicksCount: number;
}): 'blocked' | 'nitpicked' | 'clear' => {
  // any blocker holds the review
  if (input.blockersCount > 0) return 'blocked';

  // nitpicks alone are worth a note, never an all-clear
  if (input.nitpicksCount > 0) return 'nitpicked';

  // naught found
  return 'clear';
};

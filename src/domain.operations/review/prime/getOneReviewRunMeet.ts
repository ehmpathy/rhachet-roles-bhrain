import type { ReviewPrefixPrimeOutcome } from '@src/domain.objects/Reviewer/ReviewPrefixPrimeOutcome';
import type { ReviewRunMeet } from '@src/domain.objects/Reviewer/ReviewRunMeet';

/**
 * .what = runs a lane's level meet where it has one, and names what it did
 * .why = the meet's outcome must reach the run's record, skips included, so the meter can
 *        grade a cross-lane read and count the split-lane gap (`ReviewRunMeet`)
 *
 * .note = a partition skips it: its split lane already primed its common prefix. a lone run
 *         skips it too: only a lane its caller marked to join has peers to meet
 */
export const getOneReviewRunMeet = async (input: {
  /** whether this run is one partition of a split lane */
  partition: boolean;
  /** whether the caller marked this lane to join its pour's meet */
  join: boolean;
  /** the meet itself */
  meet: () => Promise<{ outcome: ReviewPrefixPrimeOutcome }>;
}): Promise<ReviewRunMeet> => {
  if (input.partition) return 'skipped.partition';
  if (!input.join) return 'skipped.lone';
  const { outcome } = await input.meet();
  return outcome;
};

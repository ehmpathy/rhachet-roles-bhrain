import type { ReviewPrefixPrimeOutcome } from './ReviewPrefixPrimeOutcome';

/**
 * .what = what a review run's level meet did — how it settled, or why it did not run
 *
 * - a `ReviewPrefixPrimeOutcome` = the run joined its level's meet, and it settled so
 * - `skipped.partition`          = a partition run: its split lane primed its own common
 *                                  prefix, and no level meet ran for it
 * - `skipped.lone`               = a lone run: no guard pour, so no peer to meet
 * - `poke`                       = the run IS a prime's poke: it sent the head for its peers
 *                                  to read, and met no meet of its own. its spend files under
 *                                  its own key, never under the key of a run that predates
 *                                  the field
 *
 * .why = the cure leans on the meet: a lane reads the head a peer's prime wrote this round,
 *        not one its own prior round wrote. with no record of the meet, the meter can grade a
 *        round only against its own prior, and a cross-lane read reads as an instrument fault.
 *        `skipped.partition` names the split-lane gap, so its share of spend can be counted
 */
export type ReviewRunMeet =
  | ReviewPrefixPrimeOutcome
  | 'skipped.partition'
  | 'skipped.lone'
  | 'poke';

/**
 * .what = every value a `ReviewRunMeet` takes
 * .why = a record off disk is untrusted, so a reader checks a value against this list. typed
 *        as a Record over the union, so a new outcome fails compile until it is listed here
 */
const IS_REVIEW_RUN_MEET: Record<ReviewRunMeet, true> = {
  primed: true,
  faulted: true,
  solo: true,
  awaited: true,
  cold: true,
  timeout: true,
  expired: true,
  'skipped.partition': true,
  'skipped.lone': true,
  poke: true,
};

/**
 * .what = whether a string read off disk is a `ReviewRunMeet`
 */
export const isReviewRunMeet = (input: {
  meet: string;
}): input is { meet: ReviewRunMeet } => input.meet in IS_REVIEW_RUN_MEET;

/**
 * .what = whether a run met a peer that warmed its head this round
 * .why = `primed` sent the poke; `awaited` read a warm release. every other outcome poured
 *        cold, so its cache read can come only from a prior round
 *
 * 🟡 .note = `awaited` also covers a lane that trailed a leader who went `solo`: it waited the
 *         reach (`MS_OF_REACH_DEFAULT`) behind a release no poke stood behind, so it is
 *         counted warm when no head was warmed, and its zero reads as a replica miss where
 *         the cause was the clock. the outcome cannot part the two yet
 *         (`.dream/v2026_11_05.feat.meet-outcome-trailed.md`)
 */
export const isRunMeetWarm = (input: { meet: ReviewRunMeet | null }): boolean =>
  input.meet === 'primed' || input.meet === 'awaited';

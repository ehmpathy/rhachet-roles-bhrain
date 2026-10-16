/**
 * .what = whether a live prefix — a warmer's, or an earlier run's — is superseded by
 *         the prefix this lane now sends
 * .why = a prefix is the model plus the system prompt. a new prompt head, or a new
 *        brain, is a new prefix, so a warmer of the old one warms a cache no later
 *        round reads. the warmer spawn and the warmer value fold both ask this one
 *        question, so they share one answer, and one null rule
 *
 * .note = only two KNOWN values that differ prove a supersession. a value not on
 *         record — a warmer from before the field was recorded, or a run that wrote
 *         none — proves naught, so it is never read as a change
 */
export const isReviewLanePrefixSuperseded = (input: {
  asked: { head: string | null; brain: string | null };
  live: { head: string | null; brain: string | null };
}): boolean =>
  isKnownAndChanged({ asked: input.asked.head, live: input.live.head }) ||
  isKnownAndChanged({ asked: input.asked.brain, live: input.live.brain });

/**
 * .what = whether two values are both on record and differ
 */
const isKnownAndChanged = (input: {
  asked: string | null;
  live: string | null;
}): boolean =>
  input.asked !== null && input.live !== null && input.asked !== input.live;

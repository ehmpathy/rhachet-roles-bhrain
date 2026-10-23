import { ENV_OF_REVIEW_CHILD } from '@src/domain.operations/ENV_OF_REVIEW_CHILD';

/**
 * .what = the env var by which a pour names the lanes it poured with peers
 * .why = the prime meet asks "do I have peers in a pour?" — a question only the party
 *        that poured can answer. a child of a review is not that answer: a streamed
 *        `review.by --for` lane, or a review an enrolled clone starts inside a lane, is
 *        a review child with no peers at all. so this marker is its own, never the
 *        subprocess marker, and the pour sets it only on the lanes it pours together
 *
 * .note = `runOneReview` sets or strips it on every child it spawns
 *         (`asEnvWithReviewPrimeMeet`), so a parent's marker never leaks to a child the
 *         parent did not pour. and the review cli consumes it on read, so a grandchild
 *         started inside a poured lane inherits none
 *
 * .note = declared in `ENV_OF_REVIEW_CHILD`, beside its two peers and their lifetimes
 */
export const ENV_OF_REVIEW_PRIME_MEET = ENV_OF_REVIEW_CHILD.primeMeet;

/**
 * .what = whether this review joins its pour's prime meet, read from its env
 * .why = only an explicit `join` from the pour joins; every other value — absent,
 *        empty, or a typo — skips, since a lone lane that waits on a gather that
 *        never comes pays up to half its brain-call bound for naught
 */
export const asReviewPrimeMeetFromEnv = (input: {
  env: NodeJS.ProcessEnv;
}): 'join' | 'skip' =>
  input.env[ENV_OF_REVIEW_PRIME_MEET] === 'join' ? 'join' : 'skip';

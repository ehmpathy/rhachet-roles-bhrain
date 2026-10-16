/**
 * .what = whether the lanes of one level pour join the prime meet
 * .why = a meet gathers peers that share a prompt prefix, then primes it once for
 *        all of them. a pour of one lane has no peer to gather, so its lane would
 *        wait on the gather (up to half its brain-call bound) and pay a prime poke
 *        that no peer reads — so only a pour of two or more lanes joins
 */
export const getOneReviewLevelPrimeMeet = (input: {
  /** the lanes this level will actually pour — cached and skipped lanes excluded */
  lanes: number;
}): 'join' | 'skip' => (input.lanes >= 2 ? 'join' : 'skip');

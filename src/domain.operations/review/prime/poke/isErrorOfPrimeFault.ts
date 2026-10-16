import { isErrorOfPokeFault } from './isErrorOfPokeFault';

/**
 * .what = true when a prime run's throw is a fault the pour may log and survive
 * .why = the prime is a cache write, never a gate (`rule.forbid.cold-pour-of-a-shared-prefix`),
 *        so a provider refusal, a dropped socket, a timeout, or an overflow costs the cache and
 *        the pour proceeds cold. a defect in our own code is not that class: it must fail loud
 *        as itself rather than read as "its peer lanes|partitions pour cold"
 *        (`asReviewPrimeFaultLine`; rule.forbid.failhide)
 *
 * .note = the class is the poke's exactly — a prime IS one poke, aimed before a pour rather than
 *         between rounds — so the allowlist is read through `isErrorOfPokeFault`, one shape, one
 *         realm-free test, never a second copy that could drift from it
 */
export const isErrorOfPrimeFault = (input: { error: unknown }): boolean =>
  isErrorOfPokeFault({ error: input.error });

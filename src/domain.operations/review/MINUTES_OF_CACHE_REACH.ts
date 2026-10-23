/**
 * .what = how long after its last send a prompt prefix can still be read from cache
 * .why = the first gap at which `CENSUS_OF_CACHE_REACH.decay` measured a hit rate of 0.
 *        past this, no later review can read the prefix a send kept warm — so a lane's
 *        prefix reads as cold (`getAllLaneOrdinals`)
 *
 * .note = a fact about the provider's cache, never about one reader of it — the meter
 *         and the grade each read it, so it sits at their common ancestor
 *         (rule.prefer.most-common-denominator)
 *
 * .note = a literal, not a derivation, so the type stays a plain number; the census test
 *         holds the two in step
 */
export const MINUTES_OF_CACHE_REACH = 66;

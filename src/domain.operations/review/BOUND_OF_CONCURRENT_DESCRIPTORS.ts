/**
 * .what = how many descriptor-bound fs calls may be in flight at once
 * .why = the stat, read, and probe fans in this subsystem share one subject: the
 *        descriptors a fan holds open and the libuv threadpool queue it floods for
 *        the duration of each call. a subject shared is a bound shared, so the number
 *        has one home (rule.prefer.most-common-denominator).
 *
 * .note = a heap-bound fan (`getAllReviewRunMeters`, which pours at 8) is a
 *         different subject and must not reuse this. a bound is owed its own
 *         justification, never its neighbour's.
 *
 * .note = the descriptor limit is a process limit (`ulimit -n`, commonly
 *         1024 or 256), so 64 leaves an order of headroom under the
 *         tightest common default.
 */
export const BOUND_OF_CONCURRENT_DESCRIPTORS = 64;

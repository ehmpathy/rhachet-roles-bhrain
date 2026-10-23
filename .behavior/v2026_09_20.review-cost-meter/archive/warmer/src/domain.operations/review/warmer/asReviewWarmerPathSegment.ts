/**
 * .what = one caller-supplied word, reduced to a single path segment
 * .why = two words reach the warmer's paths from outside this subsystem — a
 *        reviewer slug, recovered from a guard's output path by
 *        `asReviewRunIdentity` (whose `slug` group is `.+`, so it carries whatever
 *        a lane's filename carried), and a run slug, taken off a caller's
 *        `logDir`. neither is a constant. the harm is a write outside the tree's
 *        cache dir: a warmer creates its dir with `recursive: true` and writes
 *        into it, so a traversal plants a file at an arbitrary path, and a driver
 *        who trusts `logs:` in the stdout is pointed at it as though it were ours.
 *
 * .note = one decision with two call sites (`asReviewWarmerDir`,
 *         `asReviewWarmerOutputPath`) rather than two copies of one regex, since a
 *         divergence would leave exactly one path open — a security decision does
 *         not get the usual three chances (rule.prefer.wet-over-dry). the
 *         allowlist is narrower than any observed slug, so it refuses by
 *         construction rather than by review.
 */
export const asReviewWarmerPathSegment = (input: { of: string }): string =>
  input.of.replace(/[^a-z0-9._-]/gi, '-');

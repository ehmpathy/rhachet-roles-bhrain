/**
 * .what = the slug a run is filed under when the guard did not run it
 * .why = a hand `rhx review` is real spend with no lane to charge it to. it is
 *        bucketed under one visible name rather than dropped, so a corpus total
 *        always equals the sum of its rows (rule.forbid.failhide).
 *
 *        it lives at `review/` because both the tree meter and the grove file runs
 *        under it, and neither owns it (rule.prefer.most-common-denominator)
 *
 * .note = not `'(unattributed)'`. `unattributed` is a declared term with exactly
 *         one sense here — an `AttributionGrade`, a prompt census that declines to
 *         vouch for its own rows. this concept is a different one: a run with no
 *         guard identity, in rendered output where a reader holds no type to part
 *         the two (rule.forbid.domain-term-ambiguity).
 *
 *         it takes the shape its `grove/` peers take: `(no X — …)`.
 */
export const SLUG_OF_ABSENT_IDENTITY =
  '(no guard identity — a hand or review.by run)';

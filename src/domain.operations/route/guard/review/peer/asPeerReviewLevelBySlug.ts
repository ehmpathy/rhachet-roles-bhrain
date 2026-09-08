import { UnexpectedCodePathError } from 'helpful-errors';

import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asSanitizedPeerReviewSlug } from './asSanitizedPeerReviewSlug';

/**
 * .what = the configured peer reviewers indexed by their SANITIZED slug → level
 * .why = the contemplation gate looks a reviewer's level up by a slug parsed OFF DISK, and asks
 *        the same map whether the reviewer is still configured at all. so the map's keys must be
 *        in the disk vocabulary, never the config vocabulary.
 *
 * 🔴 the two vocabularies differ, and legitimately: the write side swaps separators before it
 *    builds the .given filename, while a CONFIG slug may hold one — the legacy flat guard format
 *    derives its slug from the review command itself (parseStoneGuard.ts:412-413), so
 *    `.test/mock-review.sh` is a real, live, fully-configured reviewer.
 *
 * ⚠️ keyed raw, every lookup for such a reviewer missed — and in computePeerUncontemplatedUnforgiven
 *    the MISS IS THE RETIRED TEST (`retired: !levelBySlug.has(slug)`). so a fully-configured
 *    reviewer rendered as `retired from the guard config`, with the "it will not speak again" copy,
 *    and its human overrule could never match it either (r11 blocker.1, i005).
 *
 * .note = this is a named transformer rather than an inline `.map` at the one call site, for two
 *         reasons: the sanitize is a decision a reader must not re-make by hand, and the orchestrator
 *         that held it does fs i/o — so inline, this rule was reachable only at integration grain.
 *
 * ⚠️ `level` reads OPTIONAL on the type because that type doubles as the CONFIG declaration, where a
 *    guard author may omit it. it is never optional on a PARSED review: parseStoneGuard defaults it
 *    at every emit site (`:157`, `:273`, `:416`), which is what
 *    `rule.require.review-standardization-at-parse` demands.
 *
 * ⇒ so this asserts that guarantee rather than re-defaults it. a `?? 1` here would read as a second
 *   opinion on a settled question, and would silently paper over a parse regression — the exact
 *   downstream optional-field check that rule grades a blocker.
 */
export const asPeerReviewLevelBySlug = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
}): Map<string, number> =>
  new Map(
    input.peerReviews.map((review) => [
      asSanitizedPeerReviewSlug({ slug: review.slug }),
      review.level ??
        UnexpectedCodePathError.throw(
          'peer review reached the level index with no level. parseStoneGuard must default it',
          { slug: review.slug },
        ),
    ]),
  );

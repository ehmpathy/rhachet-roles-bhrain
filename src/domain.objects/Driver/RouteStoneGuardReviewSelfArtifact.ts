import { DomainLiteral, type RefByUnique } from 'domain-objects';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents a promise artifact for a review.self
 * .why = tracks which review.selfs the clone has promised for a stone
 *
 * 🔴 .note = a promise carries NO hash, and its key is `(stone, slug)`. it is a firm checkpoint —
 *            a repair to the artifact under review must not invalidate the promise that reviewed
 *            it. the trigger report that gates it keys the same way, for the same reason.
 *            ⇒ the field survived as a vestige until i010: declared `hash of source artifacts at
 *              promise time`, hand-typed as the literal `'hashless'` at both construction sites,
 *              and read for behavior at none — so the doc was false and the `unique` tuple
 *              carried a constant that discriminated no two promises.
 */
export interface RouteStoneGuardReviewSelfArtifact {
  /**
   * reference to the stone by unique key (path)
   */
  stone: RefByUnique<typeof RouteStone>;

  /**
   * review.self slug that was promised
   */
  slug: string;

  /**
   * full path to promise artifact file
   */
  path: string;
}

export class RouteStoneGuardReviewSelfArtifact
  extends DomainLiteral<RouteStoneGuardReviewSelfArtifact>
  implements RouteStoneGuardReviewSelfArtifact
{
  public static unique = ['stone', 'slug'] as const;
}

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { asArtifactStreamsFromContent } from '../../tree/asArtifactStreamsFromContent';
import { asPeerReviewVerdictFromContent } from './asPeerReviewVerdictFromContent';
import { asRouteGuardReviewPeerPathHash } from './asRouteGuardReviewPeerPathHash';
import { asSanitizedPeerReviewSlug } from './asSanitizedPeerReviewSlug';
import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getOneLatestPeerReviewPathForSlug } from './getOneLatestPeerReviewPathForSlug';
import { getOneReviewArtifactContent } from './getOneReviewArtifactContent';

/**
 * .what = finds the latest review artifact for a specific reviewer SLUG, regardless of hash
 * .why = when a reviewer is exhausted, we need their latest review even if the hash changed
 *
 * 🔴 .note = the selector is the SLUG, never the index. this operation is the CROSS-HASH
 *    fallback, so it reaches back to files written under a *previous* guard config — and an
 *    index is a position in that config, not an identity. retire a reviewer and enroll another
 *    at the same rung and the position is reused, so an index lookup hands the successor its
 *    predecessor's verdict: a row rendered `r1: successor` whose given/taken paths both read
 *    `by_peer.departed.md`.
 *
 * .note = this closes the CROSS-HASH half of that defect. the WITHIN-hash half was open too:
 *    `computeStoneReviewInputHash` hashes the artifact set and the `.guard` file is not in it,
 *    so a reviewer can be retired from the guard config with the hash unmoved — and its files
 *    then sit at the *current* hash for the successor's index lookup to find.
 *
 * ✅ .note = as of 2026-09-08 the within-hash reads are guarded too. all three
 *    (`cachedReviews.find((r) => r.index === …)` — two in `runStoneGuardReviews`, one in
 *    `getAllReviewPeerMeterStatuses`) now route through `getOneCacheSafePeerReviewArtifact`, which
 *    confirms the slug and returns null on a mismatch.
 *
 * 🟡 that is a GUARD, never the rekey. `RouteStoneGuardReviewPeerArtifact` still carries no slug:
 *    its declared identity is `unique = ['stone', 'hash', 'index']`, so the index is the
 *    artifact's identity BY CONTRACT. to key it by slug is a domain-entity identity change, and
 *    it stays deferred — tracked as the dream below (F9, re-diagnosed i025, ruled 2026-09-08).
 *    ⇒ so a NEW reader of that cache must route through the guard; a direct index find compiles
 *    and reintroduces the defect.
 *
 * ⇒ measured, not assumed: after THIS rekey alone, the `[case7][t3]` acceptance render still
 *   showed `r1: successor` with `by_peer.departed.md` paths — which is what proved the residual
 *   defect was the within-hash key. after the guard landed, that render reads
 *   `by_peer.successor.md` at `1/5` rounds, and the snapshot now pins the contract.
 *
 * .note = filename format: $stone._.review.i$iteration.$hash.r$index._.given.by_peer.$slug.md
 *         so the slug is read from the filename grammar, via the one parser that owns it
 *         (getRouteGuardReviewPeerPathMeta, via getOneLatestPeerReviewPathForSlug), and the
 *         hash via its named reader (asRouteGuardReviewPeerPathHash) — no inline regex.
 *
 * 🟡 the slug is compared in its SANITIZED form, because that is the form the write side puts
 *    on disk (asSanitizedPeerReviewSlug). a config slug that carries a path separator would
 *    otherwise never match its own files.
 */
export const getOneLatestReviewArtifactForSlug = async (input: {
  stone: RouteStone;
  index: number;
  slug: string;
  route: string;
}): Promise<RouteStoneGuardReviewArtifact | null> => {
  // enumerate every peer given on this stone — across hashes AND across indexes.
  // .why = a reviewer that moved rungs between rounds still owns its prior artifacts; the
  //        slug follows the reviewer, the index follows the config.
  const reviewFiles = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone.name,
  });

  if (reviewFiles.length === 0) return null;

  // the slug as it appears on disk
  const slugWanted = asSanitizedPeerReviewSlug({ slug: input.slug });

  // find this reviewer's file with the highest iteration
  const latest = getOneLatestPeerReviewPathForSlug({
    paths: reviewFiles,
    slug: slugWanted,
  });
  if (!latest) return null;

  // parse the review file
  const content = await getOneReviewArtifactContent({ path: latest.path });

  // a rewind or tree clean deleted it since enumeration — the lane has no given to read
  if (content === null) return null;
  const hash = asRouteGuardReviewPeerPathHash({ path: latest.path });

  // the verdict fields, read by the one transformer the current-hash cache reads too
  const verdict = asPeerReviewVerdictFromContent({ content });

  // the streams, split by the one transformer the current-hash cache splits by too
  const streams = asArtifactStreamsFromContent({ content });

  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash,
    iteration: latest.iteration,
    index: input.index,
    path: latest.path,
    ...verdict,
    ...streams,
  });
};

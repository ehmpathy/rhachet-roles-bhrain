import * as path from 'path';

/**
 * .what = the reviewer slug carried by a peer-review filename, or null when the name
 *         does not fit the stamp grammar
 * .why = the review cache is keyed by guard-list POSITION, so a reviewer inserted or
 *        swapped into an occupied rung inherits its predecessor's verdict. the cache
 *        guard compares the cached artifact's own slug against the reviewer about to
 *        run, and discards on a mismatch — which needs the slug read from a path.
 *
 * 🔴 .note = this is the LENIENT twin of getRouteGuardReviewPeerPathMeta, and the
 *         leniency is the whole point. that parser THROWS on a name it cannot read,
 *         which is right for the contemplation gate: a driver hand-writes .taken
 *         filenames, so a typo must halt loudly with the fix named.
 *
 *         the cache guard sits on a different path with the opposite need. it runs on
 *         every reviewer of every round, over artifacts the ENGINE wrote, and its job
 *         is to decide whether one cached verdict may be trusted. to throw there would
 *         add a new halt site to the guard's hot path for a file the driver never
 *         authored — the shape .dream/v2026_09_04.fix.unparseable-peer-filename-halts-
 *         the-gate.md already records elsewhere.
 *
 * ⚠️ null means "cannot vouch for this artifact", which the caller treats as a MISMATCH.
 *    that fails safe in the same direction as a real mismatch: the cache is discarded
 *    and the reviewer runs. a discarded cache costs one budget round; a reused wrong
 *    one ships a verdict its reviewer never gave (rule.forbid.failhide).
 *
 * ⚠️ the slug returned is the SANITIZED form, because that is what the filename holds
 *    (asSanitizedPeerReviewSlug). a caller that compares against a config slug must
 *    sanitize its own side too — getLatestReviewArtifactForSlug does exactly that.
 *
 * grammar (given OR taken):
 *   $stone._.review.i$iter.$hash.r$index._.given.by_peer.$slug.md
 *   $stone._.review.i$iter.$hash.r$index._.taken.by_self.$slug.md
 */
export const asPeerReviewSlugFromPath = (input: {
  path: string;
}): string | null => {
  const name = path.basename(input.path);

  // require the full stamp before the slug tail may be trusted
  // .why = a name that carries the slug infix but no i$iter.$hash.r$index stamp is not a
  //        peer-review artifact this guard knows how to vouch for
  const hasStamp = /\.i\d+\.[^.]+\.r\d+\./.test(name);
  if (!hasStamp) return null;

  const slugMatch = name.match(
    /_\.(?:given\.by_peer|taken\.by_self)\.(.+)\.md$/,
  );
  return slugMatch?.[1] ?? null;
};

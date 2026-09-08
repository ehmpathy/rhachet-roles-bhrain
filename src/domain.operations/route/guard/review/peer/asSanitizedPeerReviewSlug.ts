/**
 * .what = the one filename-safe form of a peer reviewer slug
 * .why = a reviewer slug may carry a path separator (a rubric path used as a slug), and
 *        a separator in a filename would fork the path. so the WRITE side swaps them for
 *        hyphens when it builds the .given/.taken filenames, and the READ side must swap
 *        them the identical way to match `--that <slug>` against what is on disk.
 *
 * 🔴 that is one grammar rule which must hold across two call sites, and it lived as two
 *    independent inline copies of the same regex — `runStoneGuardReviews` (write) and
 *    `setStoneAsContemplated` (read). they agreed by coincidence, not by construction: a
 *    change to either would have silently made a slug the prompt prints un-matchable by
 *    the gate that validates it (r11 nitpick.1, i004).
 *
 * ⚠️ this is the same defect class the given↔taken pair already closed by derivation from
 *    one source. reach for this transformer rather than a third inline copy.
 */
export const asSanitizedPeerReviewSlug = (input: { slug: string }): string =>
  input.slug.replace(/[/\\]/g, '-');

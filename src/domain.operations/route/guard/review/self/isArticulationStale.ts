/**
 * .what = tells whether an articulation predates the ask it claims to answer
 * .why = a raw `<` on two Dates makes the reader decode "mtime less than mtime" into
 *        "the file was written before we asked" — the peer predicate isWithinHasteWindow
 *        was extracted for exactly this reason, and the freshness half kept a bare compare
 *
 * .note = the datum is the TRIGGER's mtime, never the artifact's. the question is
 *         "was this written for the review we asked for?", and only the ask dates that.
 *
 * .note = 🔴 `askedAt` is NON-NULL by precondition, and the type is what enforces it.
 *         the caller returns `challenge:unasked` before it reaches here, so an absent ask
 *         cannot arrive — it is a broken precondition rather than a case to soften. a
 *         nullable signature would re-open the defect the unasked verdict closed: it would
 *         let an absent ask read as "not stale" and admit an articulation written before
 *         any ask existed.
 */
export const isArticulationStale = (input: {
  articulatedAt: Date;
  askedAt: Date;
}): boolean => {
  return input.articulatedAt < input.askedAt;
};

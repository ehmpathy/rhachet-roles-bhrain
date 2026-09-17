/**
 * .what = the distinct levels a peer-review set declares, lowest first
 * .why  = the concurrent guard walk pours one level at a time, so it needs the
 *         iteration order as a value rather than as a pipeline a reader must
 *         mentally simulate at the call site
 * .note = lowest-first is the CONTRACT, never an incidental sort direction — a
 *         lower level is the cheap one and must settle before a dearer level
 *         opens, so the reverse order would spend the expensive budget first
 * .note = this is the SINGLE SOURCE. it opened as one of three copies of the
 *         identical pipeline, and the round's own headline lesson — an inline
 *         `.sort()` with no comparator sorts LEXICALLY, so `[1, 10, 2]` passes
 *         through unchanged and no acceptance fixture could catch it — was
 *         learned against exactly one of the three. do NOT re-inline it; a
 *         fourth copy is a fourth place the comparator can go absent
 */
export const getAllReviewLevelsAsc = (input: {
  peers: { level: number }[];
}): number[] =>
  [...new Set(input.peers.map((peer) => peer.level))].sort((a, b) => a - b);

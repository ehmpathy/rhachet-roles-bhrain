import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = one target file, with the clock stamp that says how stable it is
 * .why = `touchedAt` is the mtime in epoch millis. null when it could not be read
 *        (a deleted file has no mtime), which the sort treats as least stable
 */
export interface TargetByStability {
  path: string;
  touchedAt: number | null;
}

/**
 * .what = orders target files least-recently-touched FIRST, so the prompt's variable
 *         section leads with the content least likely to move next round
 * .why = 🔴 a prompt cache keys on the exact byte prefix, so within the target corpus
 *        the shared prefix ends at the FIRST file whose bytes or position changed.
 *        which file that is depends entirely on the order, and the two orders differ:
 *
 *        - alphabetical — the break lands at the edited file's alphabetical position,
 *          which is uncorrelated with whether it was edited. so the break is uniform
 *          over the corpus, and its expected position is the middle
 *        - by stability — a file the driver edits becomes the newest, so it sorts to
 *          the END. repair has temporal locality: a driver repairs what the reviewers
 *          flagged, and the reviewers re-flag what was just repaired. so the files
 *          that move are the files already near the tail, and the break lands late
 *
 *        ⇒ same break MECHANISM, later expected break POSITION. that difference is
 *        the whole gain, and it compounds: every round of a lane pays it again.
 *
 * .note = the sort is STABLE under the edit operation, which is the property that
 *         matters and is easy to lose. edit a tail file and the order does not move
 *         at all — the file was newest and stays newest. only an edit to a file in
 *         the stable head reorders its peers, and that is the case this order exists
 *         to make rare.
 *
 * .note = ties break on path, so a corpus whose mtimes are uniform (a fresh clone
 *         stamps every file at checkout time) still yields ONE deterministic order
 *         rather than whatever order the filesystem enumerated. absent that, the sort
 *         would wobble across runs and defeat the cache it exists to serve.
 *
 * .note = 🔴 a BULK TOUCH defeats the premise outright, and the note above understates
 *         it: a formatter sweep, a `git checkout`, a package install, or a fresh clone
 *         re-stamps EVERY file at once. so every mtime moves together, the order falls
 *         back to the path tiebreak, and the corpus can reorder wholesale against the
 *         prior round. the prefix then breaks at the FIRST file — the alphabetical
 *         case, with extra steps. the tie case and the single-tail-edit case are the
 *         two the notes above cover; this is the third, and it is the one that costs.
 *
 *         ⇒ it is STATED rather than repaired (fulcrum F52), and the reason is that the
 *         repair costs more than the loss. the loss is TRANSIENT: one bulk touch costs one round of
 *         cache, and the next round's edits re-establish the temporal order the sort
 *         reads. a content-hash order would survive the sweep and would forfeit the
 *         temporal locality that is the entire gain — repair has locality in TIME,
 *         never in content, so a key that ignores time optimizes for a case that does
 *         not happen.
 *
 *         ⇒ so the honest claim is narrower than "a stable tail": the order is stable
 *         under the EDIT operation, and UNDEFINED under a bulk re-stamp. a caller who
 *         needs the second guarantee needs a different key, not a stronger sort.
 */
export const getAllTargetsByCacheStability = (input: {
  targets: TargetByStability[];
}): string[] =>
  // the spread is the clone; the sort reorders only that copy
  [...input.targets]
    .sort((a, b) => asStabilityOrder({ a, b }))
    .map((target) => target.path);

/**
 * .what = the comparator: least stable last, oldest first, ties on path
 * .why = one named order, so the sort reads as "by stability" and the three rules
 *        that make it total sit together
 */
const asStabilityOrder = (input: {
  a: TargetByStability;
  b: TargetByStability;
}): number => {
  const { a, b } = input;

  // an unreadable mtime is least stable, so it trails every datable peer
  if (a.touchedAt === null && b.touchedAt === null)
    return compareStrings(a.path, b.path);
  if (a.touchedAt === null) return 1;
  if (b.touchedAt === null) return -1;

  // oldest first — the least recently touched leads the section
  if (a.touchedAt !== b.touchedAt) return a.touchedAt - b.touchedAt;

  // identical mtimes: one deterministic order, never the filesystem's
  return compareStrings(a.path, b.path);
};

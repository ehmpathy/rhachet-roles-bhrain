import { basename } from 'path';

/**
 * .what = the key a stance uses to name the given it answers — the given's filename
 * .why = a stance and a given are matched in two processes: the driver's `route.stone.set`
 *        writes the stance, and the `reviewed?` judge runs as a guard subprocess with its own
 *        cwd and `$route`. each builds the given's path from the route path IT sees, so an
 *        absolute path is not one key but one per reader. where they differ — a symlinked
 *        worktree, a `$route` given another way — every stance lapses for the judge alone,
 *        and an exhausted lane whose concerns were all conceded `better` holds the stone with
 *        no lever left (the defect this key cures).
 *
 * 🔴 the filename is already a full key within one route: it carries the stone, the round's
 *    iteration hash, the review ordinal, and the slug. so naught is lost when the directory
 *    is dropped, and the directory is the one part that varies by reader.
 *
 * .note = it accepts both row forms. stance rows written before this key carry the absolute
 *         path; rows written after carry the filename. `basename` of either is the same key,
 *         so a ledger written by an older bhrain is read as is — no migration.
 *
 * .note = a rewind is untouched: an unchanged artifact re-mints the same filename, exactly as
 *         it re-minted the same absolute path. `getPassageReportsSinceLastRewind` slices the
 *         ledger at the rewind, so a stance from before it never reaches a compare.
 */
export const asReviewGivenKey = (input: { path: string }): string =>
  basename(input.path);

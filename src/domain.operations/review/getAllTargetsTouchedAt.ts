import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';

import { BOUND_OF_CONCURRENT_DESCRIPTORS } from '@src/domain.operations/review/BOUND_OF_CONCURRENT_DESCRIPTORS';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = how many target stats may be in flight at one time
 * .why = 🔴 an unbounded `Promise.all` over the scoped target list queues one stat
 *        per target at once. `stepReview` hands this the FULL scoped list, which on
 *        the corpora this branch's own records cite runs to hundreds of targets.
 *
 * .note = 🔴 the bound's SUBJECT differs from its peer's, and the number differs
 *         with it. `getAllReviewRunMeters` pours at 8 because each unit it holds is
 *         a megabyte-scale prompt read — its bound is on HEAP, and it cites a
 *         measured 2gb death. a stat holds no payload and no durable descriptor;
 *         what a flood of them exhausts is libuv's threadpool queue and the process
 *         descriptor limit for the duration of each call.
 *
 *         ⇒ so this bound is set an order wider. to copy the 8 would serialize a
 *         cheap call against a cost it does not pay — a bound is owed its own
 *         justification, never its neighbour's.
 *
 * .note = 🟡 the descriptor limit is a PROCESS limit (`ulimit -n`, commonly 1024 or
 *         256), so it is not reachable in a hermetic test at any corpus size a test
 *         may honestly build. the clamp beside this covers what IS observable: that
 *         the wave preserves every path, and preserves their order.
 */
const BOUND_OF_CONCURRENT_STATS = BOUND_OF_CONCURRENT_DESCRIPTORS;

/**
 * .what = reads when each target was last touched, for the cache-stability sort
 * .why = `getAllTargetsByCacheStability` is a pure transformer and cannot reach the
 *        disk. this is the communicator that feeds it — the raw i/o boundary, held
 *        apart from the sort so the orchestrator composes rather than simulates
 *        (define.domain-operation-grains).
 *
 * .note = 🔴 an ABSENT file answers null and sorts last, which is correct: a target
 *         may vanish between enumeration and this stat, and a deleted target is the
 *         common case. every OTHER error throws. a bare catch would grade an EACCES
 *         as "least stable" and the review would proceed as though the file merely
 *         had no readable mtime (rule.forbid.failhide).
 *
 * .note = 🔴 an ABSOLUTE path is statted as-is. `path.join(cwd, abs)` concatenates
 *         rather than resets, so a bare join yields a doubled path that can never
 *         exist — and that target's mtime would fall to null and pin it to the tail
 *         forever, regardless of its real stability. `readFileContent` in
 *         `stepReview` already guards this for the READ; the stat owes the same.
 */
export const getAllTargetsTouchedAt = async (input: {
  cwd: string;
  paths: string[];
}): Promise<Array<{ path: string; touchedAt: number | null }>> => {
  // 🔴 poured in bounded waves, never one `Promise.all` over the whole corpus.
  // `stepReview` hands this the full scoped target list, which this branch's own
  // records put in the hundreds — an unbounded map queues every stat at once
  return getAllResultsInBoundedPool({
    items: input.paths,
    bound: BOUND_OF_CONCURRENT_STATS,
    map: async (one) => ({
      path: one,
      touchedAt: await getOneTargetTouchedAt({ cwd: input.cwd, path: one }),
    }),
  });
};

/**
 * .what = reads one target's last-touched time, or null where it is not there
 * .why = the per-file boundary, so the allowlist sits in exactly one place
 */
const getOneTargetTouchedAt = async (input: {
  cwd: string;
  path: string;
}): Promise<number | null> => {
  const full = asPathAbsoluteFromCwd({ path: input.path, cwd: input.cwd });

  try {
    const stat = await fs.stat(full);
    return stat.mtimeMs;
  } catch (error) {
    // the file is genuinely gone — a fact about the target, graded rather than hidden
    if (isErrorOfAbsence({ error })) return null;

    // every other code is a defect: a permission denial, a stale handle, an IO
    // fault. surface it with the path that failed (rule.require.failloud)
    throw new UnexpectedCodePathError(
      'could not read a review target to order it by cache stability',
      { path: input.path, at: full, error: String(error) },
    );
  }
};

import * as path from 'path';

/**
 * .what = where the review's cross-process watermarks live — the state that prefix
 *         primes coordinate on
 * .why = the lanes of a pour run as separate processes, so the one place they all
 *        reach is the filesystem. each watermark answers a question of STATE ("was this
 *        head primed?"), and a short `withSimpleMutex` hold guards only its
 *        read-check-write (rule.require.locks-via-with-simple-mutex)
 *
 * .note = it sits under `.agent/.cache/`, apart from the run dirs: a run dir answers
 *         "what did this run cost", keyed by run; this dir answers "what state is this
 *         prefix in", keyed by prefix
 */
export const DIR_OF_REVIEW_WATERMARKS = path.join(
  '.agent',
  '.cache',
  'repo=bhrain',
  'role=reviewer',
  'skill=review',
  'watermarks',
);

/**
 * .what = the watermark dir under one cwd
 * .why = binds the join along with the constant, so a call site cannot re-type it
 */
export const asReviewWatermarkDir = (input: { cwd: string }): string =>
  path.join(input.cwd, DIR_OF_REVIEW_WATERMARKS);

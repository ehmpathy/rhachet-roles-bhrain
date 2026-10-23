import * as path from 'path';

import { asReviewWarmerPathSegment } from './asReviewWarmerPathSegment';

/**
 * .what = where a warmer leaves its own voice log
 * .why = a detached process has no terminal, so this log is its only voice — without
 *        it nobody can read what a warmer said as it ran (1.vision.experience.case=7).
 *
 * .note = it sits under `.agent/.cache/` rather than beside the review run logs,
 *         keyed by reviewer. whether a warmer is alive, and its pid, live in the
 *         warmer watermark (`getOneReviewWarmerLive`), never in a file here.
 */
export const DIR_OF_WARMERS = path.join(
  '.agent',
  '.cache',
  'repo=bhrain',
  'role=reviewer',
  'skill=review',
  'warmers',
);

/**
 * .what = the dir one reviewer's warmer state lives in
 * .why = binds the JOIN along with the constant, so a call site cannot reach for
 *        the constant and re-type the `path.join` around it
 */
export const asReviewWarmerDir = (input: {
  cwd: string;
  reviewer: string;
}): string =>
  path.join(
    input.cwd,
    DIR_OF_WARMERS,
    `reviewer=${asReviewWarmerPathSegment({ of: input.reviewer })}`,
  );

import * as path from 'path';

/**
 * .what = where `stepReview` mints one log dir per review invocation
 * .why = named once so the meter and the writer cannot drift on the location
 *
 * .note = `stepReview` calls this rather than re-declaring the path, so a
 *         moved root cannot leave the writer at the old path while every
 *         reader moves — that drift would compile clean and read as "no
 *         reviews to price".
 *
 * .note = lives at `review/` rather than `meter/` because both the meter and
 *         the grove read it, and neither owns it
 *         (rule.prefer.most-common-denominator).
 */
export const DIR_OF_REVIEW_LOGS = path.join('.log', 'bhrain', 'review');

/**
 * .what = the review log root for one tree
 * .why = binds the JOIN along with the constant, so a call site cannot reach for
 *        the constant and then re-type the `path.join` around it — the same repair
 *        `asRunArtifactPath` makes one layer down, for the files INSIDE this dir
 */
export const asReviewLogsDir = (input: { cwd: string }): string =>
  path.join(input.cwd, DIR_OF_REVIEW_LOGS);

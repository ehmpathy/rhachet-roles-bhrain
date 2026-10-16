import * as fs from 'fs/promises';

/**
 * .what = findserts a directory the review writes into, with its parents
 * .why = stepReview makes two dirs before it writes — the output's parent, and the
 *        run's log dir. the raw mkdir sat inline in the orchestrator, the one io
 *        call there with no name (rule.prefer.decomposable-architecture)
 *
 * .note = idempotent by `recursive: true`: a dir already there is a no-op, never a throw
 */
export const genReviewDir = async (input: { dir: string }): Promise<void> => {
  await fs.mkdir(input.dir, { recursive: true });
};

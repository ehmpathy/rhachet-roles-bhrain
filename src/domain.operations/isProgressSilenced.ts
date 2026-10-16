import { ENV_OF_REVIEW_CHILD } from '@src/domain.operations/ENV_OF_REVIEW_CHILD';

/**
 * .what = the env var that tells a child review to draw no live progress of its own
 * .why = a caller that buffers a child's stdout (the guard, the aggregate review.by) draws
 *        its own progress and wants a clean capture with no spinner frames. the var name is
 *        the historical one, kept so a guard and its child agree across one install
 *
 * .note = this marker means "stay quiet" and naught else. "this is a review's session" is
 *         `ENV_OF_REVIEW_SUBPROCESS`, set on every capture path, since a streamed child must
 *         leave this one unset
 *
 * .note = declared in `ENV_OF_REVIEW_CHILD`, beside its two peers and their lifetimes
 */
export const ENV_OF_PROGRESS_SILENT = ENV_OF_REVIEW_CHILD.progressSilent;

/**
 * .what = whether this process must draw no live progress of its own
 * .why = the one predicate every spinner and progress gate reads
 */
export const isProgressSilenced = (input: {
  env: NodeJS.ProcessEnv;
}): boolean => input.env[ENV_OF_PROGRESS_SILENT] === '1';

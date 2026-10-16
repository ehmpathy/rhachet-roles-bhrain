import { ENV_OF_REVIEW_CHILD } from '@src/domain.operations/ENV_OF_REVIEW_CHILD';

/**
 * .what = the env var that marks a process as a child of a review, on every capture path
 * .why = a session spawned under a review (an enrolled clone, a pull-mode brain) shares the
 *        driver's worktree, so it sees the same bound route and the same repo-wide hooks.
 *        this marker names that session, so a hook can stay silent there. it is set on BOTH
 *        capture tactics — the buffered one and the streamed one — unlike the progress
 *        marker, which the streamed tactic must leave unset so its spinner can stream
 *
 * .note = declared in `ENV_OF_REVIEW_CHILD`, beside its two peers and their lifetimes
 */
export const ENV_OF_REVIEW_SUBPROCESS = ENV_OF_REVIEW_CHILD.subprocess;

/**
 * .what = whether this process runs as a child of a review
 * .why = the one predicate a hook reads to tell a review's session from the driver's
 *
 * .note = reads the subprocess marker ALONE. the progress marker means "be quiet" and no
 *         more, so a caller that sets it only to hush a spinner keeps its route hooks. a
 *         review's parent and child run from the one installed package, so no older parent
 *         can set the progress marker without the subprocess marker beside it
 * .note = this predicate answers "am I a review child?" and no other question. whether a
 *         review has pour peers to meet is the pour's own grant (`asReviewPrimeMeetFromEnv`)
 */
export const isReviewSubprocess = (input: {
  env: NodeJS.ProcessEnv;
}): boolean => input.env[ENV_OF_REVIEW_SUBPROCESS] === '1';

import { getOneReviewCounts } from '@src/domain.operations/review.tally/getOneReviewCounts';
import {
  ReviewTallyError,
  ReviewTallyTimeoutError,
} from '@src/domain.operations/review.tally/getOneReviewCountsViaBrain';
import type { ReviewCountsResolved } from '@src/domain.operations/review.tally/getOneReviewCountsViaRegex';
import { getAllErrorCauses } from '@src/utils/getAllErrorCauses';
import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

import type { ContextReviewBrainSupply } from '../brain/genReviewBrainSupply'; // brain/ is a declared shared subdomain (its .readme.md)
import { REVIEWER_OUTPUT_CONTRACT_BRIEF } from './REVIEWER_OUTPUT_CONTRACT_BRIEF';

/**
 * .what = tells whether a caught tally fault is a timeout, by type — not a message match
 * .why = the sub-brain timeout is raised as a ReviewTallyTimeoutError, then wrapped by
 *        ReviewTallyError.wrap so it rides as a .cause. this walks that cause chain so the
 *        seam can pick a distinct human-visible message for a timeout vs a generic brain fault,
 *        and NOT dump the raw wrapped message + metadata JSON into the artifact
 *        (rule.forbid.snapshot-visual-blemishes). the raw detail stays on the thrown error.
 * .note = it reads the class by NAME off the shape, never `instanceof`, for the realm reason
 *         `getAllErrorClassNames` names: an error that crosses a vm boundary or a second copy
 *         of the error library answers `instanceof` false while its constructor name survives
 */
const isReviewTallyTimeout = (input: { error: unknown }): boolean =>
  // the timeout by name, anywhere on the cause chain. the shared walk halts on a cyclic
  // chain, so a malformed `cause` cannot recurse without bound
  getAllErrorCauses({ error: input.error }).some((error) =>
    getAllErrorClassNames({ error }).includes(ReviewTallyTimeoutError.name),
  );

/**
 * .what = the clean, category-distinct reason for a tally fault — timeout or generic
 * .why = one home for the two reason strings, so a timeout reads apart from a fault and
 *        neither leaks the internal wrapper message into the artifact
 */
const asReviewTallyFaultReason = (input: { error: unknown }): string =>
  isReviewTallyTimeout({ error: input.error })
    ? '💥 MalfunctionError: review tally fallback timed out ' +
      '(the sub-brain that tallies a prose review did not respond in time). ' +
      `see ${REVIEWER_OUTPUT_CONTRACT_BRIEF}`
    : '💥 MalfunctionError: review tally fallback failed ' +
      '(the sub-brain that tallies a prose review could not be reached). ' +
      `see ${REVIEWER_OUTPUT_CONTRACT_BRIEF}`;

/**
 * .what = tallies a review's stdout, and folds a sub-brain tally fault into a reason
 * .why = the tally cascade (regex, then a sub-brain fallback) may THROW on a brain fault or
 *        timeout. this is the per-review seam that turns that fault into an undetected count
 *        plus a reason, so the run blocks loud as a malfunction and never as a silent pass
 * .note = allowlist: ONLY a ReviewTallyError becomes a reason. an unexpected code defect is
 *         rethrown, so it fails loud (rule.forbid.failhide)
 */
export const getOneReviewTallyOutcome = async (
  input: { stdout: string; exitCode: number },
  context: ContextReviewBrainSupply,
): Promise<{
  counts: ReviewCountsResolved;
  brainErrorReason: string | null;
}> => {
  try {
    return {
      counts: await getOneReviewCounts(
        { content: input.stdout, exitCode: input.exitCode },
        context,
      ),
      brainErrorReason: null,
    };
  } catch (error) {
    // read by NAME, the same grammar `isReviewTallyTimeout` uses above
    const isTallyFault = getAllErrorClassNames({ error }).includes(
      ReviewTallyError.name,
    );
    if (!isTallyFault) throw error;
    return {
      counts: { detected: false },
      brainErrorReason: asReviewTallyFaultReason({ error }),
    };
  }
};

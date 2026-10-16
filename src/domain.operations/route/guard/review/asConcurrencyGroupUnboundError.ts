import { BadRequestError } from 'helpful-errors';

/**
 * .what = the error for a lane that names a concurrency group with no bound declared
 * .why = the pour announce (`getOneReviewLevelPourBound`) and the pour itself
 *        (`runWithinConcurrencyBounds`) are two models of one bound. on an unknown group
 *        they once disagreed in kind — the announce counted the lane as unbounded while
 *        the pour threw — so both now throw this one error, and cannot drift apart
 *
 * .note = the remedy rides in the message, not the metadata: the cli renders the message
 *         as the error a human reads (rule.require.errors-name-the-fix)
 */
export const asConcurrencyGroupUnboundError = (input: {
  group: string;
}): BadRequestError =>
  new BadRequestError(
    `concurrency group has no bound declared: "${input.group}" — declare it under reviews.groups.${input.group}.concurrency`,
  );

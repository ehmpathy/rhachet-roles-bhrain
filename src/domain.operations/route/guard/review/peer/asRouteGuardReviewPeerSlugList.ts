/**
 * .what = renders a list of peer reviewers as a comma-joined slug string
 * .why = the blocked-report reason names which reviewers await contemplation;
 *        a named transform keeps the map+join out of the orchestrator narrative
 */
export const asRouteGuardReviewPeerSlugList = (input: {
  reviewers: { slug: string }[];
}): string => input.reviewers.map((reviewer) => reviewer.slug).join(', ');

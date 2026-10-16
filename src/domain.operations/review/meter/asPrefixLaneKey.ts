import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';

/**
 * .what = the key two rounds of one reviewer share — its route and its slug
 * .why = one slug may run under several routes in one tree, and their rounds are not
 *        one reviewer's sequence. one key, so the tree walk and the run breadth's prior
 *        lookup cannot pair a round two ways
 */
export const asPrefixLaneKey = (input: {
  identity: ReviewRunIdentity;
}): string => `${input.identity.route ?? ''}::${input.identity.slug}`;

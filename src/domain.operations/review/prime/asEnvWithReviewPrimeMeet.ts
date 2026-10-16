import { ENV_OF_REVIEW_PRIME_MEET } from './asReviewPrimeMeetFromEnv';

/**
 * .what = the child env a review subprocess runs with, its prime-meet marker set or stripped
 * .why = the parent env may carry a marker of its own (a `review.by` wrapper that itself
 *        runs inside a poured lane), so the child's answer is written explicitly here,
 *        never inherited
 */
export const asEnvWithReviewPrimeMeet = (input: {
  env: NodeJS.ProcessEnv;
  meet: 'join' | 'skip';
}): NodeJS.ProcessEnv => {
  // strip whatever the parent carried, then write the pour's own answer
  const { [ENV_OF_REVIEW_PRIME_MEET]: _inherited, ...envWithout } = input.env;
  if (input.meet === 'skip') return envWithout;
  return { ...envWithout, [ENV_OF_REVIEW_PRIME_MEET]: 'join' };
};

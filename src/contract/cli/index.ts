/**
 * .what = fast cli entrypoint for skill invocation
 * .why = avoids heavy imports (getRoleRegistry, stepReview) until needed
 *        shell skills import from 'rhachet-roles-bhrain/cli' for fast startup
 */
import { reflect } from './reflect';
import { review } from './review';

export const cli = {
  review,
  reflect,
};

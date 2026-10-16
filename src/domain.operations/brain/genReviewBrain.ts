import type { BrainChoice, ContextBrain } from 'rhachet';

import { asBrainLookupFault } from '@src/domain.operations/brain/asBrainLookupFault';
import { CREDS_OF_REVIEW_BRAIN } from '@src/domain.operations/brain/CREDS_OF_REVIEW_BRAIN';

/**
 * .what = boots the brain a review rides on: boots the choice under the review creds, and
 *         names an unregistered brain by its slug
 * .why = 🔴 a review, its prime, its tally fallback, and reflect must boot the SAME way — same
 *        creds, same fault — or a prime warms a replica its review never meets, and two
 *        refusals name one fault two ways. one op makes that a structural fact, and leaves
 *        each contract only the choice of how to dispose of the fault
 *
 * .note = `genContextBrain` is imported DYNAMICALLY, so a cli that imports this op on every pass
 *         (route.stone.set, via the tally supply) loads the heavy brains module only when a brain
 *         is actually booted (rule.require.isolated-cli-subpath-exports)
 * .note = the choice passes straight to `genContextBrain`: every default is a versionless
 *         openrouter tier slug, which the package registers as is
 *         (rule.require.versionless-brain-defaults)
 * .note = a lookup fault is a `BadRequestError`; every other fault passes through unchanged,
 *         for the caller to fail loud on
 */
export const genReviewBrain = async (input: {
  choice: string;
}): Promise<{ brain: ContextBrain<BrainChoice> }> => {
  // boot it under the one creds every review brain shares
  const { genContextBrain } = await import('rhachet/brains');
  const brain = await genContextBrain({
    choice: input.choice,
    creds: CREDS_OF_REVIEW_BRAIN,
  }).catch((error: unknown) => {
    throw asBrainLookupFault({ error, choice: input.choice });
  });
  return { brain };
};

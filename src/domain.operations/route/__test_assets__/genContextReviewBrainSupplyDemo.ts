import type { BrainChoice, ContextBrain } from 'rhachet';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';

import type { ContextReviewBrainSupply } from '../genReviewBrainSupply';

/**
 * .what = a shared test-context builder for the guard pass path
 * .why = the guard chain's context widened to ContextCliEmit & ContextReviewBrainSupply, so
 *        every test that drives the pass path must supply BOTH a cliEmit and a getReviewBrain.
 *        this ONE builder replaces the many hand-rolled `{ cliEmit: {...} }` literals so a
 *        future context-shape change is a one-file edit, not a scatter of patches.
 *
 * .note = the default getReviewBrain THROWS. a test whose reviewers emit numeric counts never
 *         reaches the fallback, so the throw is never hit — and it proves the deterministic
 *         path built no brain. a test that needs the fallback overrides getReviewBrain with a
 *         real supplier (e.g. genTestBrainContext) via the `getReviewBrain` option.
 */
export const genContextReviewBrainSupplyDemo = (options?: {
  onGuardProgress?: ContextCliEmit['cliEmit']['onGuardProgress'];
  getReviewBrain?: () => Promise<ContextBrain<BrainChoice>>;
}): ContextCliEmit & ContextReviewBrainSupply => ({
  cliEmit: {
    onGuardProgress: options?.onGuardProgress ?? (() => {}),
  },
  getReviewBrain:
    options?.getReviewBrain ??
    (async () => {
      throw new Error(
        'genContextReviewBrainSupplyDemo: getReviewBrain called but no brain was provided ' +
          '(a deterministic-path test should never reach the fallback; override getReviewBrain ' +
          'to test the probabilistic path)',
      );
    }),
});

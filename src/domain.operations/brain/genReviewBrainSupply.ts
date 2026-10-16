import type { BrainChoice, ContextBrain } from 'rhachet';

import { FIXED_FALLBACK_BRAIN } from '@src/domain.operations/brain/FIXED_FALLBACK_BRAIN';
// a read of `brain/`, the shared subdomain every brain-choice reader lifts to (fulcrum F54)
import { genReviewBrain } from '@src/domain.operations/brain/genReviewBrain';

/**
 * .what = a lazy supplier of the review-tally sub-brain, threaded through the guard chain
 * .why = the guard's measurement is deterministic and free for a conforming reviewer; the brain
 *        must build ONLY when a review actually needs the probabilistic fallback. a supplier
 *        (not an already-built context) defers the build to first use, so a numeric-only
 *        stone-pass never touches the brain machinery.
 */
export interface ContextReviewBrainSupply {
  getReviewBrain: () => Promise<ContextBrain<BrainChoice>>;
}

/**
 * .what = the choice a brain build needs
 * .why = named so both genReviewBrainSupply and its injectable builder share one shape. it
 *        carries no creds: every review brain boots under `CREDS_OF_REVIEW_BRAIN`, owned by
 *        `genReviewBrain`, so a creds field here could only name a second source
 */
interface ReviewBrainBuildInput {
  choice: string;
}

/**
 * .what = builds a lazy, memoize-on-success supplier of the review-tally sub-brain
 * .why = genContextBrain does async package discovery + choice validation at construction and
 *        throws if the brain package is not discoverable. building it eagerly at the cli would
 *        make a brain-package problem break EVERY stone-pass, including fully-deterministic ones.
 *        this supplier defers the build to the first fallback that runs.
 *
 * .note = memoize the BUILT value only on success. a throw propagates and leaves the cache null,
 *         so a transient build failure does not permanently disable the fallback — the next
 *         prose-reviewer re-attempts. (the resolved value is cached, not the in-flight promise,
 *         so a concurrent double-build is at worst one redundant construction, never a cached
 *         rejection.)
 *
 * .note = `options.build` injects the brain maker for tests (default = genReviewBrain).
 *         this keeps the closure's lazy/memoize semantics unit-testable with a spy maker,
 *         while the composition root calls genReviewBrainSupply() plainly.
 *
 * .note = the caller supplies no `choice`: the supply always builds `FIXED_FALLBACK_BRAIN`,
 *         the same slug `runOneReview` pins to record `talliedBy`. a `choice` input made the
 *         "not configurable" claim above a comment the type contradicted — a caller could
 *         tally on one model while the footer named another, and naught would turn red
 */
export const genReviewBrainSupply = (options?: {
  build?: (input: ReviewBrainBuildInput) => Promise<ContextBrain<BrainChoice>>;
}): ContextReviewBrainSupply => {
  // default builder is the one review-brain boot, as review.ts uses.
  // .note = `genReviewBrain` imports the heavy rhachet/brains module DYNAMICALLY, so an import
  //         of genReviewBrainSupply — which the route.stone.set cli entry does on EVERY pass —
  //         loads it only when a review actually needs the probabilistic fallback.
  //         (rule.require.isolated-cli-subpath-exports)
  const build =
    options?.build ??
    (async (buildInput: ReviewBrainBuildInput) =>
      (await genReviewBrain(buildInput)).brain);

  // .note = deliberate mutation: the memoize cell — reassigned once, on first successful build,
  //         so later calls reuse it. a const cannot memoize; a throw memoizes no value.
  let cached: ContextBrain<BrainChoice> | null = null;

  const getReviewBrain = async (): Promise<ContextBrain<BrainChoice>> => {
    // reuse a prior successful build
    if (cached) return cached;

    // build; a throw here propagates without memoize (leaves cache null → retry)
    const built = await build({ choice: FIXED_FALLBACK_BRAIN });

    // reached only on success — memoize for later fallbacks
    cached = built;
    return cached;
  };

  return { getReviewBrain };
};

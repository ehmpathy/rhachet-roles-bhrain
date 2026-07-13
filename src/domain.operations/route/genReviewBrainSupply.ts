import type { BrainChoice, ContextBrain } from 'rhachet';

/**
 * .what = the fixed sub-brain used to tally a review whose verdict is not numeric
 * .why = the wish names fireworks/deepseek/v4-flash: cheap, fast, and effective on the tiny
 *        extraction task. it is NOT configurable per route/guard — one default, kept simple.
 *        declared once here so the cli builder, the render, and the persisted footer all
 *        reference the same slug (rule.forbid.magic-values).
 */
export const FIXED_FALLBACK_BRAIN = 'fireworks/deepseek/v4-flash';

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
 * .what = the credentials + choice a brain build needs
 * .why = named so both genReviewBrainSupply and its injectable builder share one shape
 */
interface ReviewBrainBuildInput {
  choice: string;
  creds: { keyrack: { owner: string; env: string } };
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
 * .note = `options.build` injects the brain maker for tests (default = genContextBrain).
 *         this keeps the closure's lazy/memoize semantics unit-testable with a spy maker,
 *         while the composition root calls genReviewBrainSupply({ choice, creds }) plainly.
 */
export const genReviewBrainSupply = (
  input: ReviewBrainBuildInput,
  options?: {
    build?: (
      input: ReviewBrainBuildInput,
    ) => Promise<ContextBrain<BrainChoice>>;
  },
): ContextReviewBrainSupply => {
  // default builder is discovery-mode genContextBrain, as review.ts uses.
  // .note = the import is DYNAMIC (not a module-top import) so that an import of
  //         genReviewBrainSupply — which the route.stone.set cli entry does on EVERY pass —
  //         never eagerly loads the heavy rhachet/brains module. the load happens only when a
  //         review actually needs the probabilistic fallback and this builder runs.
  //         (rule.require.isolated-cli-subpath-exports)
  const build =
    options?.build ??
    (async (buildInput: ReviewBrainBuildInput) => {
      const { genContextBrain } = await import('rhachet/brains');
      return genContextBrain(buildInput);
    });

  // .note = deliberate mutation: the memoize cell — reassigned once, on first successful build,
  //         so later calls reuse it. a const cannot memoize; a throw memoizes no value.
  let cached: ContextBrain<BrainChoice> | null = null;

  const getReviewBrain = async (): Promise<ContextBrain<BrainChoice>> => {
    // reuse a prior successful build
    if (cached) return cached;

    // build; a throw here propagates without memoize (leaves cache null → retry)
    const built = await build(input);

    // reached only on success — memoize for later fallbacks
    cached = built;
    return cached;
  };

  return { getReviewBrain };
};

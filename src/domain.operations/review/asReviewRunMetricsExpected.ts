import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';

/**
 * .what = the `metrics.expected.json` payload of one run, from its file counts and its
 *         compiled prompt's estimates
 * .why = the one source both expected copies are cast from — the artifact itself, and
 *        the replay copy in the args (`asReviewRunArgsMetricsOfExpected`) — so it has one
 *        named builder rather than a literal inline in the orchestrator. the return is
 *        BOUND to `ReviewRunMetricsExpected`, so a field rename fails the type check
 *        rather than read back as a silent `0` (see that type's header)
 */
export const asReviewRunMetricsExpected = (input: {
  files: {
    rules: number;
    refs: number;
    conversation: number;
    targets: number;
  };
  compiled: {
    tokenEstimate: ReviewRunMetricsExpected['tokens']['estimate'];
    contextWindowPercent: ReviewRunMetricsExpected['tokens']['contextWindowPercent'];
    costEstimate: ReviewRunMetricsExpected['cost']['estimate'];
  };
}): ReviewRunMetricsExpected => ({
  files: {
    rulesCount: input.files.rules,
    refsCount: input.files.refs,
    conversationCount: input.files.conversation,
    targetsCount: input.files.targets,
  },
  tokens: {
    estimate: input.compiled.tokenEstimate,
    contextWindowPercent: input.compiled.contextWindowPercent,
  },
  cost: {
    estimate: input.compiled.costEstimate,
  },
});

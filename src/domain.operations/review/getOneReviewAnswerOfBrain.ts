import type { BrainChoice, ContextBrain } from 'rhachet';
import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';

import { asOutputLimitRetryLine } from '@src/domain.operations/review/asOutputLimitRetryLine';
import { asReviewBrainCallFault } from '@src/domain.operations/review/asReviewBrainCallFault';
import { asRoleOfSharedPrefix } from '@src/domain.operations/review/asRoleOfSharedPrefix';
import { schemaOfReviewOutput } from '@src/domain.operations/review/schemaOfReviewOutput';
import { withDeadline } from '@src/domain.operations/review/withDeadline';
import { withOutputLimitBrainRetry } from '@src/domain.operations/review/withOutputLimitBrainRetry';
import { withTransientBrainRetry } from '@src/domain.operations/review/withTransientBrainRetry';

/**
 * .what = the waits between asks of a brain call that faulted transiently
 * .why = a gateway 502/504 tends to clear within seconds; two retries, the second further
 *        out, cure it without a re-arrive. the lane's deadline still bounds all three asks
 */
const DELAYS_OF_TRANSIENT_BRAIN_RETRY = [{ seconds: 10 }, { seconds: 30 }];

/**
 * .what = asks the brain for one review verdict, under the lane's deadline, with each retry
 *         the lane permits — and returns the answer beside every billed ask it did not keep
 * .why = the ask is four policies deep (a deadline, an output-limit retry, a transient
 *        retry, a fault cast); behind one name, the review tail reads "ask the brain"
 *        rather than a nest to simulate (rule.forbid.decode-friction-in-orchestrators)
 *
 * .note = the order of the nest carries weight:
 *         - the deadline is outermost, so it bounds every ask together, and its `signal`
 *           gates each retry — an abandoned chain bills no new ask
 *         - a transient provider fault (a 5xx, a rate limit, a dropped socket) asks again,
 *           inside that deadline, before it may malfunction the lane
 *         - a reply cut off at the output limit (a think that never ended) asks once more,
 *           inside that deadline, before it may malfunction the lane
 *         - any fault that escapes is cast to the lane's brain call fault
 * .note = `faultsSwallowed` is each fault the transient retry swallowed. a socket that closed
 *         mid-stream may close after the provider billed, so the caller weighs each in the
 *         run's spend (`asReviewRunMetricsRealizedOfAsks`)
 */
export const getOneReviewAnswerOfBrain = async (
  input: {
    /** the static head, written as the brief the call rides on (the replica pin) */
    promptHeadBrief: Artifact<typeof GitFile>;
    /** the variable tail of the prompt */
    prompt: string;
    /** the share of the bound this ask may spend */
    timeoutMs: number;
    /** the whole bound, named in the timeout message */
    msOfBound: number;
  },
  context: { brain: ContextBrain<BrainChoice> },
) => {
  // gather each fault the transient retry swallows
  // .note = deliberate mutation, in a scoped zone: the retry reports each via `onRetry`
  const faultsSwallowed: { error: unknown }[] = [];

  // ask under the deadline, through both retries
  const { answer, runaways } = await withDeadline(
    {
      timeoutMs: input.timeoutMs,
      operation: async ({ signal }) =>
        await withOutputLimitBrainRetry({
          signal,
          onRetry: ({ evidence }) =>
            console.error(asOutputLimitRetryLine({ evidence })),
          operation: async () =>
            await withTransientBrainRetry({
              signal,
              operation: async () =>
                await context.brain.brain.choice.ask({
                  // 🔴 the shared constructor, never a literal — a prime poke must send a
                  //    BYTE-IDENTICAL system prompt to reach this round's replica, and the
                  //    two call sites cannot see each other (`asRoleOfSharedPrefix`)
                  role: asRoleOfSharedPrefix({ prefix: input.promptHeadBrief }),
                  prompt: input.prompt,
                  schema: { output: schemaOfReviewOutput },
                }),
              delays: DELAYS_OF_TRANSIENT_BRAIN_RETRY,
              onRetry: (event) => void faultsSwallowed.push(event),
            }),
        }).catch((error: unknown) => {
          throw asReviewBrainCallFault({ error });
        }),
    },
    { msOfBound: input.msOfBound },
  );

  return { answer, runaways, faultsSwallowed };
};

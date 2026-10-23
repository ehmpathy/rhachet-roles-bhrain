import * as path from 'path';
import type { BrainChoice, ContextBrain } from 'rhachet';

import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';
import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import { asReviewRunMetricsRealized } from '@src/domain.operations/review/asReviewRunMetricsRealized';
import { asReviewRunMetricsRealizedOfAsks } from '@src/domain.operations/review/asReviewRunMetricsRealizedOfAsks';
import { asReviewRunSupplyOfAnswer } from '@src/domain.operations/review/asReviewRunSupplyOfAnswer';
import { NAME_OF_RUN_ARTIFACT } from '@src/domain.operations/review/asRunArtifactPath';
import type { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';
import { formatReviewOutput } from '@src/domain.operations/review/formatReviewOutput';
import { genReviewHeaderStdout } from '@src/domain.operations/review/genReviewHeaderStdout';
import { genReviewInputStdout } from '@src/domain.operations/review/genReviewInputStdout';
import type { genTokenBreakdownReport } from '@src/domain.operations/review/genTokenBreakdownReport';
import { getAllTopDirsByTokens } from '@src/domain.operations/review/getAllTopDirsByTokens';
import { getOneReviewAnswerOfBrain } from '@src/domain.operations/review/getOneReviewAnswerOfBrain';
import { getOneReviewBrainCallResidualMs } from '@src/domain.operations/review/getOneReviewBrainCallResidualMs';
import type { getOneReviewScope } from '@src/domain.operations/review/getOneReviewScope';
import type { ReviewPartitionOfTargets } from '@src/domain.operations/review/partition/getAllTargetsByPartition';
import { asReviewPrefixPrimeKey } from '@src/domain.operations/review/prime/asReviewPrefixPrimeKey';
import { genReviewPrefixPrime } from '@src/domain.operations/review/prime/genReviewPrefixPrime';
import { getOneReviewPrimeMeetStopMs } from '@src/domain.operations/review/prime/getOneReviewPrimeMeetStopMs';
import { setOneReviewLanePrime } from '@src/domain.operations/review/prime/setOneReviewLanePrime';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';
import { setMetricsRealizedOrUnmeasured } from '@src/domain.operations/review/setMetricsRealizedOrUnmeasured';
import { setOutputArtifacts } from '@src/domain.operations/review/setOutputArtifacts';
import { setPromptHeadArtifact } from '@src/domain.operations/review/setPromptHeadArtifact';
import { setReviewLaneOutcome } from '@src/domain.operations/review/setReviewLaneOutcome';
import { withSpinner } from '@src/domain.operations/withSpinner';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';

/**
 * .what = reviews one compiled prompt: states the header, primes the shared prefix, asks the
 *         brain under its deadline and retries, then writes and prints the realized verdict
 * .why = the single-run tail of a review, behind one name, so `stepReview` reads as gate →
 *        scope → compile → dispatch, and this step owns every byte a reviewed run emits
 *
 * .note = the deadline is the share of the bound the work ahead of this step left, never the
 *         whole bound afresh — `msOfReviewStart` is when the review began
 */
export const stepReviewOfCompiled = async (
  input: {
    /** the review fields this tail reads */
    review: {
      output: string;
      focus: 'pull' | 'push';
      diffs: string | null;
      partition: ReviewPartitionOfTargets | null;
      /** whether this lane meets its pour's peers on the prime watermark */
      meet: 'join' | 'skip';
    };
    /** the compiled prompt, which fit the window */
    compiled: ReturnType<typeof compileReviewPrompt>;
    metricsExpected: ReviewRunMetricsExpected;
    scope: Pick<
      Awaited<ReturnType<typeof getOneReviewScope>>,
      'paths' | 'join'
    >;
    breakdowns: {
      rules: ReturnType<typeof genTokenBreakdownReport>;
      targets: ReturnType<typeof genTokenBreakdownReport>;
    };
    logDir: string;
    cwd: string;
    clock: ReviewLaneClock;
  },
  context: {
    brain: ContextBrain<BrainChoice>;
  },
): Promise<StepReviewResult> => {
  const { review, compiled: promptResult, metricsExpected, scope } = input;
  const { logDir, cwd } = input;
  const { msOfReviewStart, brainCallTimeoutMs } = input.clock;
  const logDirRelative = path.relative(cwd, logDir);
  const brainSpec = context.brain.brain.choice.spec;

  // emit header with brain info and scope filters
  console.log(
    genReviewHeaderStdout({
      brain: context.brain.brain.choice.slug,
      focus: review.focus,
      scope: {
        diffs: review.diffs,
        pathsWith: scope.paths.with.length > 0 ? scope.paths.with : null,
        pathsWout: scope.paths.wout.length > 0 ? scope.paths.wout : null,
        join: scope.join,
      },
    }),
  );

  // emit metrics.expected before invocation
  console.log('');
  console.log(
    genReviewInputStdout({
      files: metricsExpected.files,
      tokens: metricsExpected.tokens,
      cost: metricsExpected.cost,
      logDirRelative,
      attribution: promptResult.composition.attribution,
      warnings: promptResult.warnings,
      preview: {
        ruleDirs: getAllTopDirsByTokens({
          breakdown: input.breakdowns.rules,
          limit: 3,
        }),
        targetDirs: getAllTopDirsByTokens({
          breakdown: input.breakdowns.targets,
          limit: 3,
        }),
      },
    }),
  );

  // write the static head as the brief the brain call rides on (the replica pin)
  const promptHeadBrief = await setPromptHeadArtifact({
    logDir,
    head: promptResult.promptHeadStatic,
  });

  // prime the head this lane shares with the peers of its pour, so the pour reads it
  // from cache rather than each lane pay it in full
  // .why = the guard pours a level's lanes as separate processes ~62ms apart, so lanes
  //        that share a head all arrive cold (rule.forbid.cold-pour-of-a-shared-prefix).
  //        they meet on one watermark, keyed by brain + head; one poke goes first, then
  //        all pour
  // .note = a partition run skips it: its split lane already primed its common prefix
  // .note = a lone run skips it too: only a lane its caller marked `meet: 'join'` (a lane
  //         the guard spawned, read once at the cli boundary) has peers to meet, so a lone
  //         run must not pay the gather wait
  // .note = 🔴 the meet is bounded by the lane's own deadline: every wait in it stops at
  //         half the brain call bound, so the brain call keeps the other half, and an
  //         optimization can never time out the review it serves
  if (!review.partition && review.meet === 'join')
    await genReviewPrefixPrime(
      {
        cwd,
        key: asReviewPrefixPrimeKey({
          brain: context.brain.brain.choice.slug,
          head: promptResult.promptHeadStatic,
        }),
        deadline: {
          msOfStop: getOneReviewPrimeMeetStopMs({
            msOfReviewStart,
            brainCallTimeoutMs,
          }),
        },
      },
      {
        prime: () =>
          setOneReviewLanePrime(
            {
              head: promptResult.promptHeadStatic,
              cwd,
              output: asPathAbsoluteFromCwd({ path: review.output, cwd }),
              metricsExpected,
            },
            { brain: context.brain },
          ),
      },
    );

  // invoke brain under a deadline, with a spinner
  // .note = the deadline is the share of the bound the prior work left, never the whole bound
  //         afresh — the prime meet may spend up to half of it, on the same clock as the
  //         subprocess kill above this call (`getOneReviewBrainCallResidualMs`)
  console.log('');
  const {
    answer: reviewIssues,
    runaways,
    faultsSwallowed,
  } = await withSpinner({
    message: '🔍 what do we have here then?',
    operation: () =>
      getOneReviewAnswerOfBrain(
        {
          promptHeadBrief,
          prompt: promptResult.promptTailVariable,
          timeoutMs: getOneReviewBrainCallResidualMs({
            clock: input.clock,
            msOfNow: Date.now(),
          }),
          msOfBound: brainCallTimeoutMs,
        },
        context,
      ),
  });

  // extract metrics from brain response
  // build the realized figures ONCE, so the artifact and the sdk return cannot part,
  // via the one cast a partition prime shares
  const { metrics } = reviewIssues;
  const metricsOfAnswer = asReviewRunMetricsRealized({
    metrics,
    time: metrics.cost.time,
  });

  // fold in each ask that ran to the output limit first: it was billed in full, and the
  // answer above carries only the ask that answered. weigh each fault the transient
  // retry swallowed too: it may have been billed, with no figures reported
  const metricsOfAsks = asReviewRunMetricsRealizedOfAsks({
    answered: metricsOfAnswer,
    runaways,
    faults: faultsSwallowed,
    rates: brainSpec.cost.cash,
  });
  // record the realized figures — or, where an ask was billed with no reported spend, record
  // none and return them nulled, so the run never under-reports (`0.wish`)
  const metricsRealizedOfResult = await setMetricsRealizedOrUnmeasured({
    logDir,
    realized: metricsOfAsks.realized,
    unmeasured: metricsOfAsks.unmeasured,
    record: {
      runaways: metricsOfAsks.runaways,
      // who served the call, so a zero cache read can be told apart later
      supply: asReviewRunSupplyOfAnswer({ answer: reviewIssues }),
      /**
       * .what = where to read what this prompt was MADE of
       * .why = 🔴 declared ONCE, beside the compile step that can know it. the
       *        prompt's char budget, its cache seam, and its per-input rows are
       *        all knowable before the brain is called and never change after —
       *        so a second copy here could only drift from the first.
       *
       * .note = it lives in a PEER artifact rather than a field of this one
       *         because a run that compiles a prompt and then dies writes no
       *         realized metrics at all. its composition must survive that.
       */
      compiled: NAME_OF_RUN_ARTIFACT.compiled,
    },
  });

  // format review output
  const formattedReview = formatReviewOutput({
    response: reviewIssues.output,
  });

  // write output artifacts
  await setOutputArtifacts({
    logDir,
    response: reviewIssues.output,
    review: formattedReview,
  });

  // write the report and emit the one tally the guard reads, through the leaf every
  // reviewed lane ends on, so a whole lane and a split lane render one contract
  const summary = {
    blockersCount: reviewIssues.output.blockers.length,
    nitpicksCount: reviewIssues.output.nitpicks.length,
  };
  const { outputAbsolute } = await setReviewLaneOutcome({
    output: review.output,
    cwd,
    logDir,
    body: formattedReview,
    summary,
    realized: metricsRealizedOfResult,
  });

  return {
    outcome: 'reviewed',
    review: {
      formatted: formattedReview,
    },
    log: {
      dir: logDir,
    },
    output: {
      path: outputAbsolute,
    },
    summary,
    metrics: {
      files: metricsExpected.files,
      expected: {
        tokens: metricsExpected.tokens,
        cost: metricsExpected.cost,
      },
      realized: metricsRealizedOfResult,
    },
  };
};

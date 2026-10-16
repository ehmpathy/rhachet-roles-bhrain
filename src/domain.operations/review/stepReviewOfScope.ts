import * as path from 'path';
import type { BrainChoice, ContextBrain } from 'rhachet';

import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';
import { asReviewOverflowScopeFigures } from '@src/domain.operations/review/asReviewOverflowScopeFigures';
import { asReviewRouteOfOutput } from '@src/domain.operations/review/asReviewRouteOfOutput';
import { asReviewRunArgsMetricsOfExpected } from '@src/domain.operations/review/asReviewRunArgsMetricsOfExpected';
import { asReviewRunArgsOfRun } from '@src/domain.operations/review/asReviewRunArgsOfRun';
import { asReviewRunMetricsExpected } from '@src/domain.operations/review/asReviewRunMetricsExpected';
import { NAME_OF_RUN_ARTIFACT } from '@src/domain.operations/review/asRunArtifactPath';
import { asTargetContentsByInput } from '@src/domain.operations/review/asTargetContentsByInput';
import { asTargetContentsForBreakdown } from '@src/domain.operations/review/asTargetContentsForBreakdown';
import { asTargetContentsWithDiffs } from '@src/domain.operations/review/asTargetContentsWithDiffs';
import { asTokenBreakdownsByTargetInput } from '@src/domain.operations/review/asTokenBreakdownsByTargetInput';
import { compileReviewPromptOrOverflow } from '@src/domain.operations/review/compileReviewPromptOrOverflow';
import { emitReviewOverflowRefusal } from '@src/domain.operations/review/emitReviewOverflowRefusal';
import { genTokenBreakdownReport } from '@src/domain.operations/review/genTokenBreakdownReport';
import { getOneReviewBrainCallResidualMs } from '@src/domain.operations/review/getOneReviewBrainCallResidualMs';
import { getOneReviewGuardProvenance } from '@src/domain.operations/review/getOneReviewGuardProvenance';
import type { ReviewScopeSettled } from '@src/domain.operations/review/getOneReviewScopeSettled';
import { isReviewOverflowSplittable } from '@src/domain.operations/review/isReviewOverflowSplittable';
import { asTargetLocusEntriesByInput } from '@src/domain.operations/review/meter/asTargetLocusEntriesByInput';
import { asReviewPartitionRepairVia } from '@src/domain.operations/review/partition/asReviewPartitionRepairVia';
import { emitReviewPartitionSplitVerdict } from '@src/domain.operations/review/partition/emitReviewPartitionSplitVerdict';
import { genReviewRunOfPartition } from '@src/domain.operations/review/partition/genReviewRunOfPartition';
import { getAllPartitionsDeclaredForRun } from '@src/domain.operations/review/partition/getAllPartitionsDeclaredForRun';
import { getAllTargetsAsContext } from '@src/domain.operations/review/partition/getAllTargetsAsContext';
import { getAllTargetsOfPartition } from '@src/domain.operations/review/partition/getAllTargetsOfPartition';
import { getOneReviewPartitionSplitVerdict } from '@src/domain.operations/review/partition/getOneReviewPartitionSplitVerdict';
import { stepReviewByPartitions } from '@src/domain.operations/review/partition/stepReviewByPartitions';
import { stepReviewPlanOfSplit } from '@src/domain.operations/review/partition/stepReviewPlanOfSplit';
import { setOneReviewPrefixPrime } from '@src/domain.operations/review/prime/setOneReviewPrefixPrime';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';
import { setInputArtifacts } from '@src/domain.operations/review/setInputArtifacts';
import { setMetricsExpected } from '@src/domain.operations/review/setMetricsExpected';
import { setTokenArtifacts } from '@src/domain.operations/review/setTokenArtifacts';
import { stepReviewOfCompiled } from '@src/domain.operations/review/stepReviewOfCompiled';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';

/**
 * .what = compiles and asks a review over a SETTLED scope — the whole lane's, or one
 *         partition's narrow of it — then splits, refuses, primes, or reviews
 * .why = the compile-and-ask half of a review, apart from the scope walk, so a split lane
 *        walks and reads its scope once and each partition run (and the prime) narrows that
 *        one settled scope, never re-walks it. the prime and every partition then send the
 *        same common bytes, and no planned target can drift out of a second walk
 *
 * .note = `input.logDir` is this run's own log dir. a partition run mints its own
 *         (`genReviewRunOfPartition`), so each partition is still a full run on disk — its
 *         own artifacts, its own meter row, its own report
 */
export const stepReviewOfScope = async (
  input: {
    review: StepReviewInput;
    settled: ReviewScopeSettled;
    logDir: string;
    cwd: string;
    clock: ReviewLaneClock;
  },
  context: { brain: ContextBrain<BrainChoice> },
): Promise<StepReviewResult> => {
  const { review, settled, logDir, cwd } = input;
  const { scope, ruleFiles } = settled;
  const { refFiles, conversationFiles, fileDiffByPath } = scope;
  const ruleContents = settled.contents.rules;
  const refContents = settled.contents.refs;
  const conversationContents = settled.contents.conversation;
  const logDirRelative = path.relative(cwd, logDir);

  // the targets this run grades — the whole lane's, or its partition's narrow of them
  const targetFiles = getAllTargetsOfPartition({
    targets: scope.targets.files,
    partition: review.partition ?? null,
  });

  // re-joined in the ORDER ASKED — the corpus is sorted by cache stability upstream,
  // and a reorder here would void that sort at the last step before the prompt
  const targetContents = asTargetContentsWithDiffs({
    targets: targetFiles,
    bodiesByPath: settled.contents.targetBodiesByPath,
    changeKindByPath: fileDiffByPath,
  });

  // fold each target down to the bytes the renderer SENDS for it — the estimate
  // must measure what was sent, never what was held
  const targetContentsForBreakdown = asTargetContentsForBreakdown({
    targets: targetContents,
    focus: review.focus,
  });

  // the head every partition carries whole — rules, refs, conversation — named once, so
  // the breakdown and the split verdict read one list
  const headContents = [
    ...ruleContents,
    ...refContents,
    ...conversationContents,
  ];

  // generate and write token breakdown reports
  // 🔴 `all` carries EVERY file-backed input — refs and conversation too. the overflow
  //    refusal points a driver here for "token breakdown by file", so a breakdown that
  //    omits two first-class inputs would send them to cut targets while a `--refs` or
  //    `--conversation` bloat caused the overflow
  const allBreakdown = genTokenBreakdownReport({
    files: [...headContents, ...targetContentsForBreakdown],
  });
  const rulesBreakdown = genTokenBreakdownReport({ files: ruleContents });
  const targetsBreakdown = genTokenBreakdownReport({
    files: targetContentsForBreakdown,
  });

  // the same targets, split by named input — bodies apart from diffs — so the
  // breakdown on disk answers "big with WHAT", for a refused run as for any other.
  // written BEFORE the plan return on purpose: a `--mode plan` preview is where a driver
  // sizes a lane before it spends, so its `tokens.expected.md` is the answer the preview owes
  // (rule.forbid.adhoc-scope-rollups)
  const targetContentsByInput = asTargetContentsByInput({
    targets: targetContents,
    focus: review.focus,
  });
  await setTokenArtifacts({
    logDir,
    all: allBreakdown,
    rules: rulesBreakdown,
    targets: targetsBreakdown,
    byInput: asTokenBreakdownsByTargetInput({ byInput: targetContentsByInput }),
  });

  // the route this run was driven from, whose spec every partition must hold
  const route = asReviewRouteOfOutput({ output: review.output, cwd });
  const brainSpec = context.brain.brain.choice.spec;

  // the declared partitions — the caller's own, else the route's
  const partitionsDeclared = review.partition
    ? []
    : getAllPartitionsDeclaredForRun({
        partitions: review.partitions ?? [],
        partitionsOfRoute: review.partitionsOfRoute?.partition ?? [],
        route,
        targets: targetFiles,
      });

  // the whole set the split came from, so a coverage refusal proposes it repaired
  const partitionsRepairVia = asReviewPartitionRepairVia({
    partitions: review.partitions ?? [],
    partitionsOfRoute: review.partitionsOfRoute ?? null,
  });

  // the split, checked only where a split is READ — a plan preview, or an overflow that splits
  // .why = 🔴 a declaration is a progressive enhancement: a lane that fits must run exactly as
  //        if none were declared, so one stale glob cannot refuse a lane that never splits.
  //        up-front coverage is the stone entrance's job (`getAllStoneGuardPartitionGaps`),
  //        checked once, before any lane; a hand run previews it with --mode plan
  //        (rule.forbid.workarounds)
  const emitSplitChecked = () =>
    emitReviewPartitionSplitVerdict({
      verdict: getOneReviewPartitionSplitVerdict({
        partitions: partitionsDeclared,
        targets: targetFiles,
        route,
        repairVia: partitionsRepairVia,
        targetContents: targetContentsForBreakdown,
        headContents,
        contextWindowTokens: brainSpec.gain.size.context.tokens,
      }),
    });

  // a plan previews the split and calls no brain
  if (review.mode === 'plan')
    return stepReviewPlanOfSplit({
      splitChecked: emitSplitChecked(),
      route,
      logDir,
      output: review.output,
    });

  // compile review prompt with brain's context window and cost spec
  const { compiled, overflow } = compileReviewPromptOrOverflow({
    prompt: {
      rules: ruleContents,
      refs: refContents,
      conversation: conversationContents,
      targets: targetContents,
      targetsAsContext: getAllTargetsAsContext({ partition: review.partition }),
      targetsShared: review.partition?.common,
      partitionPeers: review.partition ? review.peers : undefined,
      focus: review.focus,
      goal: review.goal,
      contextWindowSize: brainSpec.gain.size.context.tokens,
      costSpec: brainSpec.cost.cash,
      diffRange: review.diffs,
    },
  });

  // split an overflowed whole run into its declared partitions, each run on THIS settled scope
  const splittable = isReviewOverflowSplittable({
    overflowed: !!overflow,
    partitionsDeclared: partitionsDeclared.length,
    isPartitionRun: !!review.partition,
  });
  const splitChecked = splittable ? emitSplitChecked() : null;
  if (splitChecked)
    return await stepReviewByPartitions(
      {
        review,
        partitions: splitChecked.split.partitions,
        logDir,
        cwd,
        route,
        clock: input.clock,
      },
      {
        // each partition (and the prime, and each retry) mints its own run on disk, then
        // compiles and asks over THIS settled scope, on the LANE's clock — never a fresh one:
        // all share one process under one subprocess bound (`genReviewRunOfPartition`)
        runOne: async (reviewOfPartition) => {
          const run = await genReviewRunOfPartition({
            review: reviewOfPartition,
            settled,
            cwd,
          });
          return await stepReviewOfScope(
            {
              review: reviewOfPartition,
              settled,
              logDir: run.logDir,
              cwd,
              clock: input.clock,
            },
            context,
          );
        },
      },
    );

  // refuse an overflow that cannot split, with the lever that would make it fit
  if (overflow)
    return emitReviewOverflowRefusal({
      figures: overflow.figures,
      composition: overflow.composition,
      partition: review.partition?.name ?? null,
      route,
      provenance: await getOneReviewGuardProvenance({
        output: review.output,
        cwd,
      }),
      ...asReviewOverflowScopeFigures({
        review,
        scope,
        ruleFiles,
        targetFiles,
        tokens: {
          rules: rulesBreakdown.total,
          targets: targetsBreakdown.total,
        },
      }),
      // the same send plan the breakdown read, split by named input — bodies apart
      // from diffs, so the refusal can say which of the two a directory carries
      locus: asTargetLocusEntriesByInput({ byInput: targetContentsByInput }),
      logDirRelative,
    });
  const promptResult = compiled;

  // write metrics.expected immediately after files are read
  const metricsExpected = asReviewRunMetricsExpected({
    files: {
      rules: ruleFiles.length,
      refs: refFiles.length,
      conversation: conversationFiles.length,
      targets: targetFiles.length,
    },
    compiled: promptResult,
  });
  await setMetricsExpected({ logDir, metrics: metricsExpected });

  // write input artifacts
  await setInputArtifacts({
    logDir,
    args: asReviewRunArgsOfRun({ args: scope.args, review }),
    scope: {
      ruleFiles,
      refFiles,
      conversationFiles,
      targetFiles,
    },
    // the replay copy is cast from the one source the expected artifact was written from
    metrics: asReviewRunArgsMetricsOfExpected({ expected: metricsExpected }),
    composition: promptResult.composition,
    prompt: promptResult.prompt,
  });

  // a prime run sends the common prefix as a poke, records what it cost, and reviews naught
  if (review.prime)
    return await setOneReviewPrefixPrime(
      {
        head: promptResult.promptHeadStatic,
        tail: promptResult.promptTailVariable,
        logDir,
        output: asPathAbsoluteFromCwd({ path: review.output, cwd }),
        cwd,
        metricsExpected,
        // the input artifacts above wrote this run's compiled composition
        compiled: NAME_OF_RUN_ARTIFACT.compiled,
        // the prime spends the lane's one bound, as every partition and retry does, so a
        // short bound never lets a stuck prime outlast the subprocess kill
        msOfTimeout: getOneReviewBrainCallResidualMs({
          clock: input.clock,
          msOfNow: Date.now(),
        }),
      },
      { brain: context.brain },
    );

  // review the compiled prompt: header, prime, the brain call under its deadline, the verdict
  return await stepReviewOfCompiled(
    {
      review: {
        output: review.output,
        focus: review.focus,
        diffs: review.diffs ?? null,
        partition: review.partition ?? null,
        meet: review.meet ?? 'skip',
      },
      compiled: promptResult,
      metricsExpected,
      scope,
      breakdowns: { rules: rulesBreakdown, targets: targetsBreakdown },
      logDir,
      cwd,
      clock: input.clock,
    },
    { brain: context.brain },
  );
};

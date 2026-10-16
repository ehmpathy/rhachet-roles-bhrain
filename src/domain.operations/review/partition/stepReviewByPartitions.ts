import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';
import { setReviewLaneOutcome } from '@src/domain.operations/review/setReviewLaneOutcome';

import { asPartitionFaultLaneSection } from './asPartitionFaultLaneSection';
import { asPartitionOutcomesSplit } from './asPartitionOutcomesSplit';
import { asPartitionPourOfSettled } from './asPartitionPourOfSettled';
import { asPartitionRunsOfSettled } from './asPartitionRunsOfSettled';
import { asPartitionSectionsOfRuns } from './asPartitionSectionsOfRuns';
import { asReviewPartitionSplitLines } from './asReviewPartitionSplitLines';
import { asReviewPartitionsMergedBody } from './asReviewPartitionsMergedBody';
import { getAllPartitionPeersOf } from './getAllPartitionPeersOf';
import { getAllPartitionsThatGrade } from './getAllPartitionsThatGrade';
import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';
import { getAllTargetsCommonToEvery } from './getAllTargetsCommonToEvery';
import { getOneReviewResultOfPartitions } from './getOneReviewResultOfPartitions';
import type { ReviewPartitionRunStep } from './ReviewPartitionRunStep';
import { setOnePartitionReview } from './setOnePartitionReview';
import { setOneReviewPartitionsPrime } from './setOneReviewPartitionsPrime';
import { withStdoutToStderr } from './withStdoutToStderr';

/**
 * .what = reviews an overflowed scope as its declared partitions, ALL AT ONCE, then merges
 *         every verdict it obtained into the lane's one report
 * .why = a lane whose caller declared `--partition` asked for exactly this when its whole
 *        prompt does not fit: each partition is its own request against the same rubric,
 *        and the guard still reads ONE report and ONE blockers/nitpicks pair (seed S44)
 *
 * .note = 🔴 the partitions POUR (`rule.forbid.serial-reviews-that-could-pour`). no partition
 *         reads another's output, so a serial loop would multiply wall time by N for naught
 * .note = 🔴 the pour is PRIMED (`rule.require.prime-the-shared-prefix-before-a-pour`). every
 *         partition opens on the same `common` bytes (`getAllTargetsOfPartition`); one poke
 *         writes them to the cache first, so the N read them rather than each pay in full.
 *         a prime FAULT (`withPrimeFaultSurvived`) is logged and the pour proceeds — it is an
 *         optimization, never a gate (`rule.forbid.cold-pour-of-a-shared-prefix`); a defect in
 *         our own code rethrows
 * .note = 🔴 the pour SETTLES (`rule.forbid.dropped-partial-review-progress`). a partition
 *         that fails — after its one retry (`withOneRetryOnBrainCallFault`), or by its own
 *         overflow — keeps a section in the merged report that names the fault, and counts
 *         as ONE blocker, never zero: an unread verdict cannot be assumed clean
 *         (`contract.reviewer-output`). every partition that succeeded keeps its verdict
 * .note = 🔴 a partition that answered on its retry keeps its verdict, yet its first attempt
 *         may have been billed with no figures reported — so the fault the retry swallowed
 *         voids the lane's spend, exactly as a throw does (`0.wish`: never under-report)
 * .note = 🔴 the pour runs on the LANE's one clock (`input.clock`). the prime, every partition,
 *         and each retry spend the one bound the lane's subprocess was given, so a partition
 *         that never answers times out inside it, and this step still writes the merged report
 *         and the tally before the outer kill. a retry is refused once that bound is spent
 *         (`withOneRetryOnBrainCallFault`)
 * .note = `options.runOne` is the step each partition runs — a caller-chosen strategy, so it
 *         rides `options`, never `context` (rule.forbid.inject-same-repo-domain-ops). the step
 *         closes over its own brain, so this orchestrator takes no `context` at all and keeps
 *         the two-arg `(input, options)` shape. `stepReviewOfScope` passes its compile-and-ask
 *         step, bound to its brain AND to the lane's settled scope, so no partition re-walks
 *         the scope; a test passes a run step that returns a chosen verdict per partition,
 *         with no brain call per case. each partition run is a full run — its own log dir,
 *         its own meter row, its own report under `.partition=<n>.<slug>/`
 */
export const stepReviewByPartitions = async (
  input: {
    /** the whole run's input, which each partition run repeats with its own scope */
    review: StepReviewInput;
    partitions: ReviewPartitionOfTargets[];
    /** the whole run's log dir, which holds the scope that overflowed */
    logDir: string;
    cwd: string;
    /** the route this run was driven from; null for a hand run, whose recovery has no re-arrive */
    route: string | null;
    /** the lane's one clock — every partition, the prime, and each retry spend this bound */
    clock: ReviewLaneClock;
  },
  options: { runOne: ReviewPartitionRunStep },
): Promise<StepReviewResult> => {
  // a partition that grades naught — every file it carries is graded elsewhere — is not run
  const partitions = getAllPartitionsThatGrade({
    partitions: input.partitions,
  });

  // the prefix every partition carries — what the prime writes, and empty where none runs
  const common = getAllTargetsCommonToEvery({ partitions });

  // announce the split on stderr, so a human sees it and the guard's tally does not
  console.error(
    asReviewPartitionSplitLines({ partitions, commonToEvery: common }).join(
      '\n',
    ),
  );

  // prime, then pour — both inside ONE stdout swap, held by this step alone, so no
  // partition's own tally reaches the stdout the guard reads
  const { prime, settled } = await withStdoutToStderr({
    operation: async () => {
      // prime the prefix every partition carries once, so the pour reads it from cache
      const prime = await setOneReviewPartitionsPrime(
        { review: input.review, common },
        options,
      );

      // pour every partition at once, each settled on its own
      const settled = await Promise.allSettled(
        partitions.map((partition, index) =>
          setOnePartitionReview(
            {
              review: input.review,
              partition,
              peers: getAllPartitionPeersOf({ partition, partitions }),
              index,
              clock: input.clock,
            },
            options,
          ),
        ),
      );
      return { prime, settled };
    },
  });

  // keep every verdict obtained; name every fault, and every fault a retry swallowed
  const pour = asPartitionPourOfSettled({ settled });
  const runs = asPartitionRunsOfSettled({
    partitions,
    settled: pour.settled,
  });
  const { results, faults } = asPartitionOutcomesSplit({ runs });

  // sum the partitions (and the prime's spend) into the lane's one verdict; a partition
  // fault is a blocker, while a prime fault or a first attempt a retry swallowed reaches
  // only the spend
  const merged = getOneReviewResultOfPartitions({
    results,
    primed: prime.primed,
    faults: {
      ofPour: faults,
      ofSpend: [...prime.faults, ...pour.faultsSwallowed],
    },
  });
  // a lane-wide refusal states its one cause and fix once, ahead of every partition
  const laneSection = asPartitionFaultLaneSection({
    faults,
    partitionsTotal: runs.length,
    route: input.route,
  });
  const body = [
    ...(laneSection ? [laneSection] : []),
    asReviewPartitionsMergedBody({
      sections: asPartitionSectionsOfRuns({
        runs,
        faults,
        cwd: input.cwd,
        route: input.route,
      }),
    }),
  ].join('\n');

  // write the merged report and emit the one tally the guard reads, through the leaf every
  // reviewed lane ends on. the output, the token total, and the cost are null where any
  // partition's spend is unmeasured, so each renders absent, never low
  const { outputAbsolute } = await setReviewLaneOutcome({
    output: input.review.output,
    cwd: input.cwd,
    logDir: input.logDir,
    body,
    summary: merged.summary,
    realized: merged.metrics.realized,
  });

  return {
    outcome: 'reviewed',
    review: { formatted: body },
    log: { dir: input.logDir },
    output: { path: outputAbsolute },
    summary: merged.summary,
    metrics: merged.metrics,
  };
};

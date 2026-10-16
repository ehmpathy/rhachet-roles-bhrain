import { asIsoPriceHuman, priceSum } from 'iso-price';

import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

import { getOneSecondsOfPartitionRuns } from './getOneSecondsOfPartitionRuns';
import { getOneSpendOfPartitionRuns } from './getOneSpendOfPartitionRuns';

/**
 * .what = the sum of a split review's partition results — counts, files, tokens, cost, time
 * .why = a split lane is ONE lane to its guard (F92): one blockers/nitpicks pair, one cost,
 *        one time. each figure is a plain sum, since each partition is a separate request
 *        that spent its own tokens; the one exception is the window share, which is a max,
 *        since no partition shares a window with another
 *
 * .note = 🔴 a shared spec file is counted once PER PARTITION. that is what was sent — each
 *         partition's prompt carried it — so a sum that counted it once would understate
 *         the spend the split cost
 * .note = 🔴 a run that THREW returns no figures, yet may have been billed — a deadline the
 *         provider overran, a brain fault that outlived its retry. its spend is absent from
 *         `results`, so a sum of the rest would read low. every fault is therefore handed in,
 *         and any fault but an unbilled refusal makes the lane's cost and output unknown
 * .note = 🔴 the faults arrive as TWO sets, and this merge owns both sums. a partition that
 *         failed (`faults.ofPour`) counts as ONE blocker, never zero — an unread verdict
 *         cannot be assumed clean (`contract.reviewer-output`) — and voids the spend. a prime
 *         that threw, or a first ask a retry swallowed (`faults.ofSpend`), failed no
 *         partition: it reaches the spend decision alone, since it may have been billed with
 *         no figures reported, and never the verdict
 */
export const getOneReviewResultOfPartitions = (input: {
  /** the partition runs, which pour at once */
  results: StepReviewResult[];
  /** the prime run, which completes before the pour begins; null where none ran */
  primed: StepReviewResult | null;
  faults: {
    /** each partition that threw and left no verdict — each one blocker, and a void spend */
    ofPour: { error: unknown }[];
    /**
     * each fault that failed no partition yet whose spend is unreported — a prime that threw,
     * or an attempt a retry swallowed before its run answered. spend only, never a blocker
     */
    ofSpend: { error: unknown }[];
  };
}): Pick<StepReviewResult, 'summary' | 'metrics'> => {
  // every run spent its own tokens, the prime's among them; every fault may have spent too
  const runs = input.primed ? [input.primed, ...input.results] : input.results;
  const spend = getOneSpendOfPartitionRuns({
    runs,
    faults: [...input.faults.ofPour, ...input.faults.ofSpend],
  });
  const sumOf = (pick: (result: StepReviewResult) => number): number =>
    getOneSumOfRuns({ runs, pick });
  const priceOf = (
    pick: (result: StepReviewResult) => string,
  ): ReturnType<typeof asIsoPriceHuman> => getOnePriceOfRuns({ runs, pick });

  // only the partitions grade; a prime spends tokens and reviews naught, so its counts
  // never enter the lane's verdict, whatever it returns
  const countOf = (pick: (result: StepReviewResult) => number): number =>
    getOneSumOfRuns({ runs: input.results, pick });

  return {
    summary: {
      // each partition that failed counts as one blocker beside the verdicts obtained
      blockersCount:
        countOf((result) => result.summary.blockersCount) +
        input.faults.ofPour.length,
      nitpicksCount: countOf((result) => result.summary.nitpicksCount),
    },
    metrics: {
      files: {
        rulesCount: sumOf((result) => result.metrics.files.rulesCount),
        refsCount: sumOf((result) => result.metrics.files.refsCount),
        conversationCount: sumOf(
          (result) => result.metrics.files.conversationCount,
        ),
        targetsCount: sumOf((result) => result.metrics.files.targetsCount),
      },
      expected: {
        tokens: {
          estimate: sumOf((result) => result.metrics.expected.tokens.estimate),
          contextWindowPercent: getOneMaxContextWindowPercent({ runs }),
        },
        cost: {
          estimate: priceOf((result) => result.metrics.expected.cost.estimate),
        },
      },
      realized: {
        tokens: spend.tokens,
        cost: spend.cost,
        time: {
          seconds: getOneSecondsOfPartitionRuns({
            primed: input.primed,
            results: input.results,
          }),
        },
      },
    },
  };
};

/**
 * .what = the sum of one numeric figure across a set of runs
 * .why = one named fold, so the merge reads "sum this figure" rather than a reduce to
 *        simulate (rule.forbid.inline-decode-friction)
 */
const getOneSumOfRuns = (input: {
  runs: StepReviewResult[];
  pick: (result: StepReviewResult) => number;
}): number => input.runs.reduce((sum, result) => sum + input.pick(result), 0);

/**
 * .what = the sum of one price figure across a set of runs, as a human price
 * .why = one named fold for every cost figure of the merge
 * .note = seeded with a nil, as its peers are: every partition can fault with no prime
 *         run, and the merge must still render one blocker per fault, never throw
 */
const getOnePriceOfRuns = (input: {
  runs: StepReviewResult[];
  pick: (result: StepReviewResult) => string;
}): ReturnType<typeof asIsoPriceHuman> =>
  asIsoPriceHuman(priceSum(['USD 0', ...input.runs.map(input.pick)]));

/**
 * .what = the widest context window share any one run of a split lane used
 * .why = no partition shares a window with another, so the share is a max, never a sum;
 *        floored at 0, so an empty run set reads 0% rather than -Infinity
 */
const getOneMaxContextWindowPercent = (input: {
  runs: StepReviewResult[];
}): number =>
  Math.max(
    0,
    ...input.runs.map(
      (result) => result.metrics.expected.tokens.contextWindowPercent,
    ),
  );

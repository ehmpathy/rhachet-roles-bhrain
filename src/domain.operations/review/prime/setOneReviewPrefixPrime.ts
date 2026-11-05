import type { BrainChoice, ContextBrain } from 'rhachet';
import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';

import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import { asReviewRunMetricsRealized } from '@src/domain.operations/review/asReviewRunMetricsRealized';
import { getOneReviewMetricsOfZero } from '@src/domain.operations/review/getOneReviewMetricsOfZero';
import { isFaultOfUnbilledCall } from '@src/domain.operations/review/isFaultOfUnbilledCall';
import { setOnePrefixPoke } from '@src/domain.operations/review/prime/poke/setOnePrefixPoke';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';
import { setMetricsRealizedOrUnmeasured } from '@src/domain.operations/review/setMetricsRealizedOrUnmeasured';

import { getOneSecondsRounded } from './getOneSecondsRounded';

/**
 * .what = sends a split lane's common prefix to the brain as one poke, and records it as a run
 * .why = N partitions poured at once all arrive before any of them has written the common
 *        prefix to the cache, so all N miss and each pays the route spec at full rate. one
 *        poke first writes it; the N then read it (`rule.require.prime-the-shared-prefix-before-a-pour`)
 *
 * .note = the poke (`setOnePrefixPoke`) mirrors a review's send — same head-as-system-prompt,
 *         byte for byte, and a one-token answer — so a prime and a review share a prefix. no
 *         replica pin rides either ask, so they meet one host by chance, not by key
 *         (`setOnePrefixPoke`)
 * .note = its realized metrics are written to its own log dir, so the meter counts the prime's
 *         spend beside the partitions it served; a cost hidden from the meter is a lie by omission
 */
export const setOneReviewPrefixPrime = async (
  input: {
    /** the head, as the brief a run already wrote (`setPromptHeadArtifact`) — the poke writes none */
    headBrief: Artifact<typeof GitFile>;
    tail: string;
    logDir: string;
    /** the absolute path the prime would have written a report to; it writes none */
    output: string;
    metricsExpected: ReviewRunMetricsExpected;
    /** the compiled artifact this run's dir holds; null where the run compiled no prompt */
    compiled: string | null;
    /**
     * the time the lane has left for this poke; null where the caller bounds it elsewhere
     * (the lane meet caps every wait by its own stop). the poke's wedge bound still caps it
     */
    msOfTimeout: number | null;
  },
  context: { brain: ContextBrain<BrainChoice> },
): Promise<StepReviewResult> => {
  // send the prefix as one poke, timed
  const msBegin = Date.now();
  const poke = await setOnePrefixPoke(
    {
      headBrief: input.headBrief,
      tail: input.tail,
      msOfTimeout: input.msOfTimeout,
    },
    context,
  );
  const seconds = getOneSecondsRounded({ since: msBegin, until: Date.now() });

  // the prime's figures, in the shape every run records
  const realized = asReviewRunMetricsRealized({
    metrics: poke.metrics,
    time: { seconds },
  });

  // a fault the poke's retry swallowed may have been billed with no figures — the whole
  // prefix sent twice, priced once — so it counts unmeasured, and the prime records under
  // the one never-under-report rule the review ask follows (`0.wish`)
  const unmeasured = poke.faultsSwallowed.filter(
    (fault) => !isFaultOfUnbilledCall(fault),
  ).length;
  const realizedOfResult = await setMetricsRealizedOrUnmeasured({
    logDir: input.logDir,
    realized,
    unmeasured,
    record: {
      supply: poke.supply,
      compiled: input.compiled,
      // a poke asks for one output token, so it cannot run to the output limit
      runaways: [],
      // a prime IS the meet's poke, never a lane that meets — so it files as `poke`, never
      // under the absent-record key a run that predates the field files under
      meet: 'poke',
    },
  });

  // a prime reviews naught, so it carries no verdict and no files
  return {
    outcome: 'primed',
    review: { formatted: '' },
    log: { dir: input.logDir },
    output: { path: input.output },
    summary: { blockersCount: 0, nitpicksCount: 0 },
    metrics: {
      // a prime reviews no files, exactly as a skip and a plan do — one home for the zero
      files: getOneReviewMetricsOfZero().files,
      expected: {
        tokens: input.metricsExpected.tokens,
        cost: input.metricsExpected.cost,
      },
      // an unmeasured spend carries no cost, so the return states the verdict the absent
      // artifact does
      realized: realizedOfResult,
    },
  };
};

import type { BrainChoice, ContextBrain } from 'rhachet';

import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import { asReviewRunDir } from '@src/domain.operations/review/asReviewRunDir';
import { genLogDirName } from '@src/domain.operations/review/genLogDirName';
import { genReviewDir } from '@src/domain.operations/review/genReviewDir';
import { setOneReviewPrefixPrime } from '@src/domain.operations/review/prime/setOneReviewPrefixPrime';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

/**
 * .what = sends one lane's head as a poke, recorded in a run dir of its own
 * .why = the lanes of one guard level that share a head meet to prime it once
 *        (`genReviewPrefixPrime`); the lane that wins the meet sends this poke
 *        before its peers pour
 *
 * .note = the tail is EMPTY. lanes share only their head — each lane's tail is its
 *         own targets — so a poke that carried the primer's tail would pay a whole
 *         review's input for bytes no peer reads (rule.forbid.shared-bytes-behind-narrow-bytes)
 * .note = its own log dir, so the meter counts the prime's spend as a run beside
 *         the lanes it served, never inside the primer lane's record
 */
export const setOneReviewLanePrime = async (
  input: {
    head: string;
    cwd: string;
    /** the primer lane's output path, which names the poke's head brief */
    output: string;
    metricsExpected: ReviewRunMetricsExpected;
  },
  context: { brain: ContextBrain<BrainChoice> },
): Promise<StepReviewResult> => {
  // a run dir of the prime's own
  const logDir = asReviewRunDir({ cwd: input.cwd, name: genLogDirName() });
  await genReviewDir({ dir: logDir });

  // send the head as one poke, and record what it spent
  return await setOneReviewPrefixPrime(
    {
      head: input.head,
      tail: '',
      logDir,
      output: input.output,
      cwd: input.cwd,
      metricsExpected: input.metricsExpected,
      // a lane prime sends a head alone and compiles no prompt, so it points at none
      compiled: null,
      // the lane meet caps every wait by its own stop (`getOneReviewPrimeMeetStopMs`)
      msOfTimeout: null,
    },
    context,
  );
};

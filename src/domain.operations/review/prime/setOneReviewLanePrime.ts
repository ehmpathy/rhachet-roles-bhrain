import type { BrainChoice, ContextBrain } from 'rhachet';
import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';

import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import { asReviewRunDir } from '@src/domain.operations/review/asReviewRunDir';
import { genLogDirName } from '@src/domain.operations/review/genLogDirName';
import { genReviewDir } from '@src/domain.operations/review/genReviewDir';
import { asReviewLanePokeOutputPath } from '@src/domain.operations/review/prime/asReviewLanePokeOutputPath';
import { setOneReviewPrefixPrime } from '@src/domain.operations/review/prime/setOneReviewPrefixPrime';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';
import { setReviewRunArgsArtifact } from '@src/domain.operations/review/setReviewRunArgsArtifact';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';

/**
 * .what = sends one lane's head as a poke, recorded in a run dir of its own
 * .why = the lanes of one guard level that share a head meet to prime it once
 *        (`genReviewPrefixPrime`); the lane that wins the meet sends this poke
 *        before its peers pour
 *
 * .note = the tail is EMPTY. lanes share only their head — the corpus the level shares
 *         rides there; each lane's tail is its own rubric and refs — so a poke that carried
 *         the primer's tail would pay for bytes no peer reads (rule.forbid.shared-bytes-behind-narrow-bytes)
 * .note = the head rides as the primer's OWN head artifact, the brief its review sends next,
 *         so the poke writes no second copy of the corpus
 * .note = its own log dir, with an args record of its own, so the meter files the prime's
 *         spend by stone, round, and brain — under the poke slug (`asReviewLanePokeOutputPath`),
 *         never inside the primer lane's rounds
 */
export const setOneReviewLanePrime = async (
  input: {
    /** the primer lane's head artifact — the system prompt every lane of the meet sends */
    headBrief: Artifact<typeof GitFile>;
    cwd: string;
    /** the primer lane's own args record, which the poke's record is cast from */
    args: ReviewRunArgsRecord;
    metricsExpected: ReviewRunMetricsExpected;
  },
  context: { brain: ContextBrain<BrainChoice> },
): Promise<StepReviewResult> => {
  // a run dir of the prime's own
  const logDir = asReviewRunDir({ cwd: input.cwd, name: genLogDirName() });
  await genReviewDir({ dir: logDir });

  // the poke's args record: the primer's invocation under the poke slug. it carries the
  // targets its head holds, and no rules, refs, or conversation — those ride the tail,
  // which the poke never sends
  const output = asReviewLanePokeOutputPath({ output: input.args.args.output });
  await setReviewRunArgsArtifact({
    logDir,
    record: {
      ...input.args,
      args: { ...input.args.args, output },
      scope: {
        ruleFiles: [],
        refFiles: [],
        conversationFiles: [],
        targetFiles: input.args.scope.targetFiles,
      },
    },
  });

  // send the head as one poke, and record what it spent
  return await setOneReviewPrefixPrime(
    {
      headBrief: input.headBrief,
      tail: '',
      logDir,
      output: asPathAbsoluteFromCwd({ path: output, cwd: input.cwd }),
      metricsExpected: input.metricsExpected,
      // a lane prime sends a head alone and compiles no prompt, so it points at none
      compiled: null,
      // the lane meet caps every wait by its own stop (`getOneReviewPrimeMeetStopMs`)
      msOfTimeout: null,
    },
    context,
  );
};

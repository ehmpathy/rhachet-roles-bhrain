import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import type { ReviewRunMetricsCompiledRead } from '@src/domain.objects/Reviewer/ReviewRunMetricsCompiled';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { asMinutesOfCallOfRealized } from '@src/domain.operations/review/meter/asMinutesOfCallOfRealized';
import { asPrefixBreak } from '@src/domain.operations/review/meter/asPrefixBreak';
import { getOneMinutesBetweenRunDirs } from '@src/domain.operations/review/meter/getOneMinutesBetweenRunDirs';
import { getOneMinutesSincePriorSend } from '@src/domain.operations/review/meter/getOneMinutesSincePriorSend';
import { getOnePrefixVerdict } from '@src/domain.operations/review/meter/getOnePrefixVerdict';
import { getOneRunArtifactJson } from '@src/domain.operations/review/meter/getOneRunArtifactJson';
import { getOneSharedPrefixOfPromptFiles } from '@src/domain.operations/review/meter/getOneSharedPrefixOfPromptFiles';
import type { ReviewRunMeterOfGuard } from '@src/domain.operations/review/meter/isReviewRunOfGuard';
import type { ReviewPrefixPair } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = one reviewer's round, set against its prior round — the prefix their prompts
 *         share on disk, beside the cache read this round billed
 * .why = the one measurement every breadth's prefix figures read, so the run, tree, and
 *        grove cannot measure one pair two ways
 *
 * .note = reads two prompts, one compiled census, and the prior's realized record off disk.
 *         the prompts are read a chunk at a time and the read stops where they part
 *         (`getOneSharedPrefixOfPromptFiles`). the round's own meet rides its meter row
 */
export const getOnePrefixPairOfRuns = async (input: {
  prior: { dir: string; identity: ReviewRunIdentity; brain: string | null };
  round: ReviewRunMeterOfGuard;
}): Promise<ReviewPrefixPair> => {
  const brains = { prior: input.prior.brain, round: input.round.brain };

  // the shared prefix of the two prompts, this round's static head, and the prior's spend
  const [shared, compiled, priorRealized] = await Promise.all([
    getOneSharedPrefixOfPromptFiles({
      earlier: asRunArtifactPath({ dir: input.prior.dir, artifact: 'prompt' }),
      later: asRunArtifactPath({ dir: input.round.dir, artifact: 'prompt' }),
    }),
    getOneRunArtifactJson({ dir: input.round.dir, artifact: 'compiled' }),
    getOneRunArtifactJson({ dir: input.prior.dir, artifact: 'realized' }),
  ]);
  const headChars = asHeadCharsOfCompiled({
    compiled: compiled as ReviewRunMetricsCompiledRead | null,
  });

  // the gap from the prior's last send, never its mint — the cache reach runs from there
  const minutesSincePrior = getOneMinutesSincePriorSend({
    minutesBetweenMints: getOneMinutesBetweenRunDirs({
      since: input.prior.dir,
      until: input.round.dir,
    }),
    minutesOfPriorCall: asMinutesOfCallOfRealized({
      realized: priorRealized,
      dir: input.prior.dir,
    }),
  });

  // the expected and detected halves, and the verdict that parts them
  const sharedChars = shared?.chars ?? null;
  const meet = input.round.meet;
  const figures = getOnePrefixVerdict({
    sharedChars,
    promptChars: input.round.prompt?.chars ?? null,
    tokens: input.round.tokens,
    brains,
    minutesSincePrior,
    meet,
    headChars,
  });

  return {
    reviewer: input.round.identity.slug,
    prior: {
      dir: input.prior.dir,
      stone: input.prior.identity.stone,
      iteration: input.prior.identity.iteration,
    },
    round: {
      dir: input.round.dir,
      stone: input.round.identity.stone,
      iteration: input.round.identity.iteration,
    },
    brains,
    minutesSincePrior,
    meet,
    sharedChars,
    ...figures,
    breaksIn: asPrefixBreak({ shared, headChars }),
    headChars,
  };
};

/**
 * .what = the chars of a run's static head, as its compiled census recorded them
 * .why = null where the census or its head is absent, never a guess
 *
 * .note = the `as` above binds only the field NAMES of the deep-partial read shape; the
 *         `typeof` check here is the gate
 */
const asHeadCharsOfCompiled = (input: {
  compiled: ReviewRunMetricsCompiledRead | null;
}): number | null => {
  const head = input.compiled?.prompt?.cacheable?.head;
  return typeof head === 'number' ? head : null;
};

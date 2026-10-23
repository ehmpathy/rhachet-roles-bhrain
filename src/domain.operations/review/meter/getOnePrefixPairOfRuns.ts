import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import type { ReviewRunMetricsCompiledRead } from '@src/domain.objects/Reviewer/ReviewRunMetricsCompiled';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { asPrefixBreak } from '@src/domain.operations/review/meter/asPrefixBreak';
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
 * .note = reads two prompts and one compiled census off disk. the prompts are read a
 *         chunk at a time and the read stops where they part (`getOneSharedPrefixOfPromptFiles`)
 */
export const getOnePrefixPairOfRuns = async (input: {
  prior: { dir: string; identity: ReviewRunIdentity };
  round: ReviewRunMeterOfGuard;
}): Promise<ReviewPrefixPair> => {
  // the shared prefix of the two prompts, and this round's static head
  const [shared, compiled] = await Promise.all([
    getOneSharedPrefixOfPromptFiles({
      earlier: asRunArtifactPath({ dir: input.prior.dir, artifact: 'prompt' }),
      later: asRunArtifactPath({ dir: input.round.dir, artifact: 'prompt' }),
    }),
    getOneRunArtifactJson({ dir: input.round.dir, artifact: 'compiled' }),
  ]);
  const headChars = asHeadCharsOfCompiled({
    compiled: compiled as ReviewRunMetricsCompiledRead | null,
  });

  // the expected and detected halves, and the verdict that parts them
  const sharedChars = shared?.chars ?? null;
  const figures = getOnePrefixVerdict({
    sharedChars,
    promptChars: input.round.prompt?.chars ?? null,
    tokens: input.round.tokens,
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

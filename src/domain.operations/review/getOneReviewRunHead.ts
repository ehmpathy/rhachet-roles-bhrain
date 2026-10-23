import { createHash } from 'crypto';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { getOneFileText } from '@src/domain.operations/review/getOneFileText';

/**
 * .what = the content digest of a run's prompt head, or null where the run wrote none
 * .why = the head is the system message, and the system message is the affinity key
 *        (rule.require.name-the-shared-prefix-as-the-cache-anchor). so two runs of one
 *        slug share a prefix only where their heads are byte-identical — a rubric edit,
 *        a new brief, or a new focus is a new prefix, and the digest is what names it
 *
 * .note = keyed by CONTENT, never by path, the same law the affinity digest obeys
 *         (`setPromptHeadArtifact`): every run writes its head into its own log dir
 *
 * .note = null is "no head on record" — a refusal, or a run older than the artifact.
 *         it is never a guess at the head, so two such runs pair only with each other
 */
export const getOneReviewRunHead = async (input: {
  dir: string;
}): Promise<string | null> => {
  const content = await getOneFileText({
    at: asRunArtifactPath({ dir: input.dir, artifact: 'head' }),
  });
  if (content === null) return null;
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
};

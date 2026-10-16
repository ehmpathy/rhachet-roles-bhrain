import { genArtifactGitFile } from 'rhachet-artifact-git';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes the prompt's static head to the run's log dir, as a brief artifact
 * .why = 🔴 a brief becomes the SYSTEM message, and the system message is the
 *        slot a provider keys its cache replica on. so the static head must
 *        travel as a brief, never as the first bytes of the user message:
 *
 *        - as a brief → a system message exists → every round of this lane
 *          carries the same anchor, so the shared prefix can land where it was
 *          seen before
 *        - inside the prompt → no system message → no anchor → each round may
 *          land on a replica that has never seen the shared prefix
 *
 * .note = the artifact is keyed by CONTENT, never by path, so a per-run log path
 *         costs the anchor naught, and the file doubles as the audit record of
 *         what was cached.
 *
 * .note = returns the artifact, since the brain call hands it on as the role's brief
 */
export const setPromptHeadArtifact = async (input: {
  logDir: string;
  head: string;
}): Promise<ReturnType<typeof genArtifactGitFile>> => {
  const promptHeadBrief = genArtifactGitFile({
    uri: asRunArtifactPath({ dir: input.logDir, artifact: 'head' }),
  });
  await promptHeadBrief.set({ content: input.head });
  return promptHeadBrief;
};

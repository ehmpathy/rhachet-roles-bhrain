import * as fs from 'fs/promises';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes the SCOPE as finally resolved — the four supply sets, by path
 * .why = the replay record of what the prompt was built from, at file grain
 *
 * .note = its peer `input.scope.debug.json` holds the RESOLUTION — every join and
 *         drop that produced these four lists. this one holds the answer; that one
 *         holds the derivation, and is written earlier so a refusal can cite it.
 */
export const setScopeArtifact = async (input: {
  logDir: string;
  scope: {
    ruleFiles: string[];
    refFiles: string[];
    conversationFiles: string[];
    targetFiles: string[];
  };
}): Promise<{ path: string }> => {
  const at = asRunArtifactPath({ dir: input.logDir, artifact: 'scope' });
  await fs.writeFile(at, JSON.stringify(input.scope, null, 2), 'utf-8');
  return { path: at };
};

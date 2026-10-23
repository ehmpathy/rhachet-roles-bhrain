import * as fs from 'fs/promises';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import type { TargetInputName } from '@src/domain.operations/review/asTargetContentsByInput';
import { genTokenBreakdownMarkdown } from '@src/domain.operations/review/genTokenBreakdownMarkdown';
import type { TokenBreakdownEntry } from '@src/domain.operations/review/genTokenBreakdownReport';

/** one breakdown — its per-path entries and their sum */
export type Breakdown = { entries: TokenBreakdownEntry[]; total: number };

/**
 * .what = writes the token breakdown, twice — machine-readable and human-readable
 * .why = 🔴 ONE writer for both renders, because they are two views of ONE
 *        breakdown. two call sites could render different numbers from the same
 *        input and no clamp would catch it; one call cannot
 *        (rule.require.single-source-of-truth-for-render).
 *
 * .note = the three breakdowns are computed by the caller rather than here. the
 *         corpus fold they measure — which targets, at which focus — is the
 *         orchestrator's decision, and a writer that re-derived it would
 *         re-open the drift `isTargetDiffSent` closed.
 */
export const setTokenArtifacts = async (input: {
  logDir: string;
  all: Breakdown;
  rules: Breakdown;
  targets: Breakdown;
  /** the targets again, one breakdown per named target input the prompt sends */
  byInput: Record<TargetInputName, Breakdown>;
}): Promise<{ pathOfJson: string; pathOfMarkdown: string }> => {
  const breakdowns = {
    all: input.all,
    rules: input.rules,
    targets: input.targets,
    ...input.byInput,
  };

  const pathOfJson = asRunArtifactPath({
    dir: input.logDir,
    artifact: 'tokensJson',
  });
  await fs.writeFile(pathOfJson, JSON.stringify(breakdowns, null, 2), 'utf-8');

  const pathOfMarkdown = asRunArtifactPath({
    dir: input.logDir,
    artifact: 'tokensMarkdown',
  });
  await fs.writeFile(
    pathOfMarkdown,
    genTokenBreakdownMarkdown(breakdowns),
    'utf-8',
  );

  return { pathOfJson, pathOfMarkdown };
};

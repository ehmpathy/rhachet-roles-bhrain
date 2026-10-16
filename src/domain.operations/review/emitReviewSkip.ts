import * as path from 'path';

import { getOneReviewMetricsOfZero } from '@src/domain.operations/review/getOneReviewMetricsOfZero';
import { getReviewDisplayPath } from '@src/domain.operations/review/getReviewDisplayPath';
import { getReviewSkipReport } from '@src/domain.operations/review/getReviewSkipReport';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';
import { setReviewOutputFile } from '@src/domain.operations/review/setReviewOutputFile';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';

/**
 * .what = writes + echoes the 🌙 skipped review for an `--optional` supply-empty skip, and
 *         returns its zeroed result
 * .why = one source for the skip's side effects (write `--output` + echo stdout) and result,
 *        shared by the CLI pre-check (`review.ts`, before `genContextBrain`) and `stepReview`'s
 *        defense-in-depth branch — so the skip behaves identically wherever the empty supply is
 *        detected, with no duplicated i/o.
 * .note = emits real `0/0` counts (never a faked abstain — rule.forbid.failhide) so the guard
 *         tallies approved; invokes no brain, so it is deterministic and zero-cost.
 */
export const emitReviewSkip = async (input: {
  supply: 'rules';
  ruleGlobs: string[];
  output: string;
  cwd: string;
}): Promise<StepReviewResult> => {
  const outputAbsolute = asPathAbsoluteFromCwd({
    path: input.output,
    cwd: input.cwd,
  });

  // write the skip report + echo it to stdout. the write makes its own parent dir
  const skipReport = getReviewSkipReport({
    supply: input.supply,
    globs: input.ruleGlobs,
    reviewDisplayPath: getReviewDisplayPath({ outputAbsolute, cwd: input.cwd }),
  });
  await setReviewOutputFile({
    path: outputAbsolute,
    header: '',
    body: skipReport,
  });
  console.log(skipReport);

  return {
    outcome: 'skipped',
    review: { formatted: skipReport },
    // a skip writes no separate log artifacts; the only artifact is the review file itself
    log: { dir: path.dirname(outputAbsolute) },
    output: { path: outputAbsolute },
    summary: { blockersCount: 0, nitpicksCount: 0 },
    metrics: getOneReviewMetricsOfZero(),
  };
};

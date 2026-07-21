import * as fs from 'fs/promises';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';

import { getReviewDisplayPath } from '@src/domain.operations/review/getReviewDisplayPath';
import { getReviewSkipReport } from '@src/domain.operations/review/getReviewSkipReport';
import type { StepReviewResult } from '@src/domain.operations/review/stepReview';

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
  const outputAbsolute = path.isAbsolute(input.output)
    ? input.output
    : path.join(input.cwd, input.output);

  // ensure the --output parent exists, then write the skip report + echo it to stdout
  await fs.mkdir(path.dirname(outputAbsolute), { recursive: true });
  const skipReport = getReviewSkipReport({
    supply: input.supply,
    globs: input.ruleGlobs,
    reviewDisplayPath: getReviewDisplayPath({ outputAbsolute, cwd: input.cwd }),
  });
  await fs.writeFile(outputAbsolute, skipReport, 'utf-8');
  console.log(skipReport);

  const zeroPrice = asIsoPriceHuman({ amount: 0, currency: 'USD' });
  return {
    outcome: 'skipped',
    review: { formatted: skipReport },
    // a skip writes no separate log artifacts; the only artifact is the review file itself
    log: { dir: path.dirname(outputAbsolute) },
    output: { path: outputAbsolute },
    metrics: {
      files: { rulesCount: 0, refsCount: 0, targetsCount: 0 },
      expected: {
        tokens: { estimate: 0, contextWindowPercent: 0 },
        cost: { estimate: zeroPrice },
      },
      realized: {
        tokens: {
          input: 0,
          inputCacheCreation: 0,
          inputCacheRead: 0,
          output: 0,
        },
        cost: {
          input: zeroPrice,
          cacheWrite: zeroPrice,
          cacheRead: zeroPrice,
          output: zeroPrice,
          total: zeroPrice,
        },
        // 'PT0S' is a compile-time-validated IsoDurationWords literal (rule.forbid.as-cast)
        time: 'PT0S',
      },
    },
  };
};

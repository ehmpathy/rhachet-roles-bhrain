import * as fs from 'fs';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';
import { getUuid } from 'uuid-fns';

import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';

import { asReviewLogsDir } from '../asReviewLogsDir';
import { NAME_OF_RUN_ARTIFACT } from '../asRunArtifactPath';
import { asGuardReviewOutputPath } from './asGuardReviewOutputPath';

/**
 * .what = seeds one review log dir at a declared instant, for a declared lane
 * .why = the lane ordinal fold reads TWO things off a run — the dir's stamp
 *        and the lane recorded in its args — so a fixture must carry both or it
 *        exercises only half the read
 *
 * .note = the stamp is handed in ESCAPED, exactly as `genLogDirName` mints it
 *         (`2026-09-24T10-10-00-000Z`), so a fixture cannot quietly seed an
 *         instant the mint could never have produced
 */
export const setOneReviewRunLogDir = (input: {
  cwd: string;
  /** the escaped iso stamp, as `genLogDirName` writes it */
  stamp: string;
  slug: string;
  route?: string;
  stone?: string;
}): { name: string; dir: string } => {
  const name = `${input.stamp}.pid${process.pid}.${getUuid()}`;
  const dir = path.join(asReviewLogsDir({ cwd: input.cwd }), name);
  fs.mkdirSync(dir, { recursive: true });
  // typed against the production shape, so the fixture cannot nest `output`
  // at a level `setInputArtifacts` never writes it
  const record: ReviewRunArgsRecord = {
    args: {
      rules: '.agent/**/rules/*.md',
      output: asGuardReviewOutputPath({
        route: input.route ?? '.behavior/v2026_09_20.review-cost-meter',
        stone: input.stone ?? '5.1.execution.from_vision',
        slug: input.slug,
        iteration: 3,
        index: 1,
      }),
      focus: 'push',
      goal: 'representative',
      polluters: 'drop',
      join: 'intersect',
      brain: 'openrouter/deepseek/flash',
      optional: [],
      partitions: [],
      partition: null,
    },
    scope: {
      ruleFiles: [],
      refFiles: [],
      conversationFiles: [],
      targetFiles: [],
    },
    metrics: {
      tokenEstimate: 0,
      contextWindowPercent: 0,
      costEstimate: asIsoPriceHuman('USD 0.00'),
    },
  };
  fs.writeFileSync(
    path.join(dir, NAME_OF_RUN_ARTIFACT.args),
    JSON.stringify(record),
  );
  return { name, dir };
};

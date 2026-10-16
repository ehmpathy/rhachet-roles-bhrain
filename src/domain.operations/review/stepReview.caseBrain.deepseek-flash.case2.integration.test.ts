import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { BRAIN_CALL_TEST_TIMEOUT_MS } from '@src/.test/infra/brainCallTestTimeout';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';
import { logOutputHead } from '@src/.test/logOutputHead';

import { stepReview } from './stepReview';

/**
 * .what = paths to the static test assets
 * .why = enables reuse of test fixtures across test cases
 */
const ASSETS_PROSE = path.join(
  __dirname,
  '.test/assets/example.repo/prose-author',
);

describe('stepReview.caseBrain.deepseek-flash.case2', () => {
  // increase timeout for brain invocations (3 minutes)
  jest.setTimeout(BRAIN_CALL_TEST_TIMEOUT_MS);

  const scene = useBeforeAll(async () => ({
    brain: await genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }),
  }));

  given('[case1] multiple chapters with the default test brain', () => {
    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] stepReview on all chapters',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-deepseek-flash-multi.md',
        );
        afterAll(async () => fs.rm(outputPath, { force: true }));

        // single API call, result shared across assertions
        const result = useThen('stepReview succeeds', async () => {
          const res = await stepReview(
            {
              rules: '.agent/**/briefs/rules/*.md',
              paths: 'chapters/*.md',
              output: outputPath,
              focus: 'push',
              goal: 'representative',
              cwd: ASSETS_PROSE,
            },
            { brain: scene.brain },
          );

          // log output for observability
          logOutputHead({
            label: 'deepseek-flash.multi.review',
            output: res.review.formatted,
          });

          return { result: res, outputPath };
        });

        then('review covers all target files', async () => {
          expect(result.result.metrics.files.targetsCount).toBe(3);
        });

        then('review is written to output path', async () => {
          const content = await fs.readFile(result.outputPath, 'utf-8');
          expect(content.length).toBeGreaterThan(0);
        });

        then('review contains blockers for dirty chapters', async () => {
          // chapter2.md has gerund violations, so review should contain blockers
          expect(result.result.review.formatted.toLowerCase()).toContain(
            'blocker',
          );
        });
      },
    );
  });
});
